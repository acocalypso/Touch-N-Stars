import { useSettingsStore } from '../store/settingsStore';
import { apiStore } from '@/store/store';
import { ReconnectingWebSocket } from '@/utils/reconnectingWebSocket';

const backendProtokol = 'ws';
const backendPfad = '/v2/socket';

// Single owner of the connect timeout. The old code kept three call sites
// (store.js, the internal reconnect loop, the default) manually aligned at
// 5000ms; the core now owns one timeout, so the alignment is structural.
const CHANNEL_CONNECT_TIMEOUT_MS = 5000;

// Staleness watchdog: if the socket looks open but no message has arrived for
// STALE_AFTER_MS while HTTP is healthy, send a cheap probe and, if nothing comes
// back within PROBE_TIMEOUT_MS, treat it as a zombie half-open socket.
const STALE_AFTER_MS = 30000;
const PROBE_TIMEOUT_MS = 10000;
// A single probe's bufferedAmount rarely proves anything: a small subscribe
// frame is handed off to the OS send buffer almost instantly even over a dead
// (NAT-dropped) TCP connection, so the "stuck buffer" case below almost never
// fires in practice. Falling back to reconnecting after this many consecutive
// inconclusive probes catches the common case the buffer check misses.
const MAX_INCONCLUSIVE_PROBES = 3;

/**
 * Main event channel WebSocket (image events, device events, livestack, ...).
 * Thin adapter over ReconnectingWebSocket. App-scoped singleton.
 *
 * Keeps a subscription registry so subscriptions are replayed on every (re)open
 * - the old code only re-subscribed when fetchAllInfos() itself did the connect,
 * so a reconnect driven by the internal loop silently dropped every subscription.
 */
class WebSocketChannelService {
  constructor() {
    // Public fields: LiveStack chains by reading these directly.
    this.statusCallback = null;
    this.messageCallback = null;

    this._subscriptions = new Set();
    this._probeSentAt = null;
    this._inconclusiveProbeCount = 0;

    this._rws = new ReconnectingWebSocket({
      name: 'Channel',
      connectTimeoutMs: CHANNEL_CONNECT_TIMEOUT_MS,
      getUrl: () => {
        const settingsStore = useSettingsStore();
        const store = apiStore();
        const host = settingsStore.connection.ip || window.location.hostname;
        const port = store.apiPort;
        if (port === null || port === undefined) return null;
        return `${backendProtokol}://${host}:${port}${backendPfad}`;
      },
      // Gate on the raw reachability inputs, not the composite isBackendReachable
      // (which includes isWebSocketConnected and would create a cycle).
      canReconnect: () => {
        const store = apiStore();
        return store.isApiConnected && store.isTnsPluginConnected;
      },
      onOpen: () => {
        apiStore().isWebSocketConnected = true;
        this._clearProbe();
        // Replay every subscription so events keep flowing after any reconnect.
        for (const eventType of this._subscriptions) {
          this._rws.send({ action: 'subscribe', eventType });
        }
        if (this.statusCallback) this.statusCallback('Connected');
      },
      onClose: () => {
        apiStore().isWebSocketConnected = false;
        this._clearProbe();
        if (this.statusCallback) this.statusCallback('Closed');
      },
      onStatus: (status) => {
        if (status === 'error' && this.statusCallback) {
          this.statusCallback('Error: channel websocket error');
        }
      },
      onMessage: (message) => {
        // Any inbound traffic proves the socket is alive.
        this._clearProbe();
        if (this.messageCallback) this.messageCallback(message);
      },
    });
  }

  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  setMessageCallback(callback) {
    this.messageCallback = callback;
  }

  get shouldReconnect() {
    return this._rws.shouldReconnect;
  }

  set shouldReconnect(value) {
    this._rws.shouldReconnect = value;
  }

  connect(timeout = CHANNEL_CONNECT_TIMEOUT_MS) {
    return this._rws.connect(timeout);
  }

  disconnect() {
    this._clearProbe();
    this._rws.disconnect();
  }

  sendMessage(message) {
    const ok = this._rws.send(message);
    if (!ok && this.statusCallback) {
      this.statusCallback('Error: WebSocket not connected');
    }
  }

  subscribe(eventType) {
    this._subscriptions.add(eventType);
    // Only send immediately if the socket is already open. Adding to the
    // registry alone is enough otherwise: onOpen replays every registered
    // subscription, whether this connect() call or the internal reconnect
    // loop is the one that eventually opens the socket. Sending here
    // unconditionally would fail silently on every call made before the
    // first successful connect and spam the error status on each poll tick.
    if (this._rws.isOpen()) {
      this._rws.send({ action: 'subscribe', eventType });
    }
  }

  unsubscribe(eventType) {
    this._subscriptions.delete(eventType);
    this._rws.send({ action: 'unsubscribe', eventType });
  }

  isWebSocketConnected() {
    return this._rws.isOpen();
  }

  forceReconnect() {
    this._clearProbe();
    return this._rws.forceReconnect();
  }

  // Full reset: called when the connection is known-good (a message arrived)
  // or its lifecycle just turned over (open/close), so any accumulated
  // inconclusive-probe history no longer applies.
  _clearProbe() {
    this._probeSentAt = null;
    this._inconclusiveProbeCount = 0;
  }

  /**
   * Detect and recover a zombie (half-open) socket. Called from the 2s
   * fetchAllInfos() poll, which only runs its "already connected" branch when the
   * HTTP chain just succeeded - so this is inherently "HTTP healthy, WS silent".
   *
   * Browser WebSockets have no ping frames, so we probe with a cheap re-subscribe
   * (idempotent server-side) and watch for ANY inbound message. If none arrives
   * within PROBE_TIMEOUT_MS we treat it as dead and force a reconnect.
   */
  checkStaleness() {
    if (!this._rws.isOpen()) return;

    const now = Date.now();
    const lastMessageAt = this._rws.lastMessageAt;
    const silentFor = lastMessageAt === null ? Infinity : now - lastMessageAt;

    // No probe in flight yet: if silent too long, send one.
    if (this._probeSentAt === null) {
      if (silentFor > STALE_AFTER_MS) {
        // Re-send an existing subscription as a liveness probe (idempotent). If
        // there are none, IMAGE-SAVE is always registered by fetchAllInfos().
        const probeEvent = this._subscriptions.values().next().value || 'IMAGE-SAVE';
        this._rws.send({ action: 'subscribe', eventType: probeEvent });
        this._probeSentAt = now;
      }
      return;
    }

    // A probe is in flight. Any received message would have cleared _probeSentAt
    // via onMessage, so if we're still here the socket has been silent since.
    if (now - this._probeSentAt > PROBE_TIMEOUT_MS) {
      // The frame we sent never left userland (send buffer still not drained) =>
      // the TCP send window is stalled => the peer is gone. This is a conclusive
      // signal, but rarely fires in practice: a tiny probe frame is handed off to
      // the OS send buffer almost instantly even over a dead (NAT-dropped)
      // connection, so a drained buffer here does NOT prove the peer is alive.
      const stuckBuffer = this._rws.bufferedAmount > 0;
      if (stuckBuffer) {
        console.warn('[Channel] zombie socket detected (send buffer stalled), reconnecting');
        this.forceReconnect();
        return;
      }

      this._inconclusiveProbeCount += 1;
      if (this._inconclusiveProbeCount >= MAX_INCONCLUSIVE_PROBES) {
        console.warn(
          `[Channel] zombie socket suspected (${this._inconclusiveProbeCount} silent probes), reconnecting`
        );
        this.forceReconnect();
      } else {
        // Inconclusive: reset just the in-flight probe timer (not the count) and
        // let the next stale window try again.
        this._probeSentAt = null;
      }
    }
  }
}

const websocketChannelService = new WebSocketChannelService();
export default websocketChannelService;
