/**
 * A WebSocket wrapper that owns the full reconnect lifecycle so the individual
 * services don't each re-implement (and drift on) it. It consolidates the
 * best-of behavior previously scattered across the channel / mount / tppa
 * services and the platesolveplus composable:
 *
 * - connect() returns a promise (resolves on open, rejects on timeout or on a
 *   close that happens before the socket ever opened)
 * - concurrent connect() calls piggyback on the in-flight attempt (dedup), so a
 *   poll-driven connect() and the internal reconnect loop can never tear each
 *   other's socket down mid-handshake
 * - a generation guard invalidates the handlers of any superseded socket
 * - a single tracked reconnect timer, cancelable by disconnect()
 * - exponential backoff with a cap, reset on a successful open AND on every
 *   manual connect() (so a resume that does disconnect(); connect() never
 *   inherits a long backoff from before the pause)
 * - a canReconnect() predicate gates dialing; while it is false (or getUrl()
 *   returns null) the loop does NOT die - it idles on a recheck timer at the
 *   max-backoff cadence and resumes on its own once the predicate flips true,
 *   so callers never need a second external reconnect driver
 *
 * The class is intentionally store-free: everything environment-specific
 * (URL, reachability, store writes) is injected as callbacks so it stays
 * unit-testable in plain Node.
 */
export class ReconnectingWebSocket {
  /**
   * @param {object} options
   * @param {string} options.name - log prefix, e.g. 'Channel'
   * @param {() => string|null} options.getUrl - evaluated fresh per attempt; null means "cannot dial right now"
   * @param {() => boolean} [options.canReconnect] - checked before scheduling AND again before dialing
   * @param {number} [options.connectTimeoutMs] - single owner of the connect timeout
   * @param {number} [options.backoffInitialMs]
   * @param {number} [options.backoffFactor]
   * @param {number} [options.backoffMaxMs] - also the cadence of the canReconnect()/getUrl() idle recheck
   * @param {boolean} [options.parseJson] - parse onmessage payloads that look like JSON; raw string otherwise
   * @param {(info: { url: string }) => void} [options.onOpen]
   * @param {(event: CloseEvent) => void} [options.onClose] - fired on every real close of the current socket
   * @param {(message: any) => void} [options.onMessage]
   * @param {(status: 'open'|'closed'|'error'|'reconnect-scheduled'|'reconnect-waiting') => void} [options.onStatus]
   * @param {(fn: Function, ms: number) => any} [options.setTimeoutFn] - injectable for tests
   * @param {(id: any) => void} [options.clearTimeoutFn] - injectable for tests
   */
  constructor({
    name = 'WebSocket',
    getUrl,
    canReconnect = () => true,
    connectTimeoutMs = 5000,
    backoffInitialMs = 500,
    backoffFactor = 1.8,
    backoffMaxMs = 10000,
    parseJson = true,
    onOpen = null,
    onClose = null,
    onMessage = null,
    onStatus = null,
    setTimeoutFn = (fn, ms) => setTimeout(fn, ms),
    clearTimeoutFn = (id) => clearTimeout(id),
  } = {}) {
    if (typeof getUrl !== 'function') {
      throw new Error('ReconnectingWebSocket requires a getUrl() function');
    }

    this.name = name;
    this._getUrl = getUrl;
    this._canReconnect = canReconnect;
    this.connectTimeoutMs = connectTimeoutMs;
    this._backoffInitialMs = backoffInitialMs;
    this._backoffFactor = backoffFactor;
    this._backoffMaxMs = backoffMaxMs;
    this._parseJson = parseJson;
    this._onOpen = onOpen;
    this._onClose = onClose;
    this._onMessage = onMessage;
    this._onStatus = onStatus;
    this._setTimeout = setTimeoutFn;
    this._clearTimeout = clearTimeoutFn;

    this.socket = null;
    this.url = null;
    this._shouldReconnect = true;
    this._isConnected = false;

    this._socketId = 0; // incremented per attempt to invalidate stale socket handlers
    this._pendingConnect = null; // in-flight connect() promise, shared by concurrent callers
    this._rejectCurrent = null; // reject() of the current attempt, for disconnect() to settle
    this._reconnectTimerId = null; // pending reconnect OR idle recheck timer
    this._backoffMs = backoffInitialMs;
    this._lastMessageAt = null;
  }

  get shouldReconnect() {
    return this._shouldReconnect;
  }

  set shouldReconnect(value) {
    this._shouldReconnect = value;
  }

  get lastMessageAt() {
    return this._lastMessageAt;
  }

  _emitStatus(status) {
    if (this._onStatus) {
      try {
        this._onStatus(status);
      } catch (err) {
        console.error(`[${this.name}] onStatus callback threw:`, err);
      }
    }
  }

  /**
   * Dial now. Cancels any pending backoff/idle timer and resets the backoff so a
   * manual reconnect is always prompt. Concurrent callers piggyback on the same
   * promise.
   * @param {number} [timeoutMs]
   * @returns {Promise<void>}
   */
  connect(timeoutMs = this.connectTimeoutMs) {
    if (this._pendingConnect) {
      return this._pendingConnect;
    }

    // A manual connect() always dials immediately and starts fresh: drop any
    // scheduled reconnect/recheck timer and reset the backoff.
    this._clearReconnectTimer();
    this._backoffMs = this._backoffInitialMs;
    this._shouldReconnect = true;

    return this._dial(timeoutMs);
  }

  /**
   * Open a socket without touching backoff/shouldReconnect state. This is the
   * dial path used by the internal reconnect loop, which must NOT reset the
   * backoff on every attempt - otherwise _scheduleReconnect() always sees the
   * initial value and the exponential growth/cap never takes effect.
   * @param {number} [timeoutMs]
   * @returns {Promise<void>}
   */
  _dial(timeoutMs = this.connectTimeoutMs) {
    if (this._pendingConnect) {
      return this._pendingConnect;
    }

    const connectPromise = new Promise((resolve, reject) => {
      this._rejectCurrent = null;
      this._socketId++;
      const socketId = this._socketId;

      // Close any existing socket to avoid orphaned connections
      if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
        this.socket.close();
      }

      const url = this._getUrl();
      if (!url) {
        // Arm the self-healing idle-recheck loop here too, or a connect() call
        // that happens to land while getUrl() is still null (e.g. a page
        // mounting before the API port handshake finishes) would reject once
        // and never dial again - onclose (which normally schedules this) never
        // fires because no socket was ever created.
        if (this._shouldReconnect) {
          this._scheduleReconnect();
        }
        reject(new Error(`[${this.name}] cannot connect: no URL available`));
        return;
      }
      this.url = url;

      let settled = false;
      const settle = (fn, arg) => {
        if (settled) return;
        settled = true;
        this._rejectCurrent = null;
        fn(arg);
      };
      // Expose this attempt's reject so disconnect() can settle a still-pending
      // connect() promise instead of orphaning its awaiter.
      this._rejectCurrent = (err) => settle(reject, err);

      this.socket = new WebSocket(url);

      const timeoutId = this._setTimeout(() => {
        if (socketId !== this._socketId) return; // superseded
        if (!this._isConnected) {
          // Settle with the timeout reason BEFORE closing: close() synchronously
          // fires onclose, which would otherwise settle the promise first with a
          // less specific "closed before connection" error.
          settle(reject, new Error(`[${this.name}] connection timeout`));
          // Close so onclose fires and drives the reconnect
          if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
            this.socket.close();
          }
        }
      }, timeoutMs);

      this.socket.onopen = () => {
        if (socketId !== this._socketId) return; // stale socket
        this._clearTimeout(timeoutId);
        this._isConnected = true;
        this._backoffMs = this._backoffInitialMs; // reset backoff on success
        this._lastMessageAt = Date.now();
        this._emitStatus('open');
        if (this._onOpen) {
          try {
            this._onOpen({ url });
          } catch (err) {
            console.error(`[${this.name}] onOpen callback threw:`, err);
          }
        }
        settle(resolve);
      };

      this.socket.onmessage = (event) => {
        if (socketId !== this._socketId) return; // stale socket
        this._lastMessageAt = Date.now();
        if (!this._onMessage) return;
        try {
          let message = event.data;
          if (
            this._parseJson &&
            typeof event.data === 'string' &&
            (event.data.startsWith('{') || event.data.startsWith('['))
          ) {
            message = JSON.parse(event.data);
          }
          this._onMessage(message);
        } catch (err) {
          console.error(`[${this.name}] error parsing message:`, err);
          // Hand the raw payload to the consumer so it can decide what to do
          this._onMessage(event.data);
        }
      };

      this.socket.onerror = (error) => {
        if (socketId !== this._socketId) return; // stale socket
        this._isConnected = false;
        this._emitStatus('error');
        // Do NOT reject here - onclose fires after onerror and owns reconnecting.
        console.error(`[${this.name}] WebSocket error:`, error?.message || error);
      };

      this.socket.onclose = (event) => {
        if (socketId !== this._socketId) return; // stale socket
        this._clearTimeout(timeoutId);
        this._isConnected = false;
        this._emitStatus('closed');
        if (this._onClose) {
          try {
            this._onClose(event);
          } catch (err) {
            console.error(`[${this.name}] onClose callback threw:`, err);
          }
        }
        // If the socket closed before ever opening, settle the connect() promise
        // so its awaiter doesn't hang. A no-op if onopen already resolved it.
        settle(reject, new Error(`[${this.name}] closed before connection was established`));

        this._scheduleReconnect();
      };
    });

    this._pendingConnect = connectPromise;
    // Clear the dedup pointer once settled AND sink any rejection so a
    // fire-and-forget connect() (e.g. the mount socket) never surfaces as an
    // unhandled rejection. Chaining .catch after .finally covers both the
    // original promise and the derived one. The original is returned unchanged.
    connectPromise
      .finally(() => {
        if (this._pendingConnect === connectPromise) {
          this._pendingConnect = null;
        }
      })
      .catch(() => {});

    return connectPromise;
  }

  /**
   * Schedule the next reconnect. If reconnecting is currently gated
   * (canReconnect() false or no URL), idle on a recheck timer at the max-backoff
   * cadence instead of dialing, so the loop stays alive and self-heals.
   */
  _scheduleReconnect() {
    if (!this._shouldReconnect) return;
    if (this._reconnectTimerId) return; // already scheduled

    const canDial = this._canReconnect() && this._getUrl() !== null;

    if (!canDial) {
      this._emitStatus('reconnect-waiting');
      this._reconnectTimerId = this._setTimeout(() => {
        this._reconnectTimerId = null;
        this._scheduleReconnect();
      }, this._backoffMaxMs);
      return;
    }

    const delay = this._backoffMs;
    // Advance the backoff for the attempt after this one
    this._backoffMs = Math.min(
      this._backoffMaxMs,
      Math.floor(this._backoffMs * this._backoffFactor)
    );

    this._emitStatus('reconnect-scheduled');
    this._reconnectTimerId = this._setTimeout(() => {
      this._reconnectTimerId = null;
      // Re-check the gate right before dialing - conditions may have changed
      if (this._shouldReconnect && this._canReconnect() && this._getUrl() !== null) {
        this._dial().catch(() => {
          // onclose will schedule the next attempt; nothing to do here
        });
      } else {
        // Gate closed again while we waited - fall back to the idle recheck
        this._scheduleReconnect();
      }
    }, delay);
  }

  _clearReconnectTimer() {
    if (this._reconnectTimerId) {
      this._clearTimeout(this._reconnectTimerId);
      this._reconnectTimerId = null;
    }
  }

  /**
   * Stop reconnecting and close the socket. disconnect(); connect() works: the
   * dedup pointer is dropped eagerly so the fresh connect() isn't piggybacked
   * onto a promise that's on its way out.
   */
  disconnect() {
    // Turn off reconnecting first: the socket.close() below fires onclose
    // synchronously, and _scheduleReconnect() early-returns while this is false,
    // so onclose still emits 'closed'/onClose but does NOT schedule a reconnect.
    this._shouldReconnect = false;
    this._isConnected = false;
    this._pendingConnect = null;
    this._clearReconnectTimer();
    // Settle any still-pending connect() promise so its awaiter doesn't hang.
    if (this._rejectCurrent) {
      const rejectCurrent = this._rejectCurrent;
      this._rejectCurrent = null;
      rejectCurrent(new Error(`[${this.name}] disconnected`));
    }
    if (this.socket) {
      this.socket.close();
    }
  }

  /**
   * Force a genuinely fresh attempt: drop the dedup pointer, close the current
   * socket, and dial immediately. Used by the staleness watchdog.
   * @returns {Promise<void>}
   */
  forceReconnect() {
    this._pendingConnect = null;
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.close();
    }
    return this.connect();
  }

  /**
   * Send a payload. Objects are JSON-stringified. Never throws.
   * @returns {boolean} whether the payload was handed to the socket
   */
  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket.send(payload);
      return true;
    }
    console.error(`[${this.name}] not connected, message not sent`);
    this._emitStatus('error');
    return false;
  }

  isOpen() {
    return this._isConnected && this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /** Current bufferedAmount of the underlying socket, or 0 when unavailable. */
  get bufferedAmount() {
    return this.socket ? this.socket.bufferedAmount : 0;
  }
}
