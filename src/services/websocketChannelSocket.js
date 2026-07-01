import { useSettingsStore } from '../store/settingsStore';
import { apiStore } from '@/store/store';

const backendProtokol = 'ws';
const backendPfad = '/v2/socket';

class WebSocketChannelService {
  constructor() {
    this.socket = null;
    this.statusCallback = null;
    this.messageCallback = null;
    this.backendUrl = null;
    this.reconnectDelay = 2000; // 2 Sekunden
    this.shouldReconnect = true;
    this.isConnected = false;
    this.reconnectTimeoutId = null; // Track reconnect timeout
    this._socketId = 0; // Incremented on each connect() to invalidate stale socket handlers
    this._pendingReject = null; // reject() of the currently in-flight connect() promise, if any
  }

  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  setMessageCallback(callback) {
    this.messageCallback = callback;
  }

  connect(timeout = 500) {
    return new Promise((resolve, reject) => {
      // Setze shouldReconnect auf true bei jedem Connect-Versuch
      this.shouldReconnect = true;

      // If an older connect() call is still pending (its onopen/timeout hasn't fired
      // yet), reject it now. Without this, two overlapping connect() calls (e.g. the
      // internal auto-reconnect below racing an explicit call from fetchAllInfos())
      // could leave the older one's promise unsettled forever: its timeout handler
      // used to check the *shared* isConnected flag, which the newer call had already
      // flipped to true, so it silently did nothing instead of resolving/rejecting.
      // Whoever awaited that older call (fetchAllInfos()) would then hang forever,
      // permanently stalling the info poller.
      if (this._pendingReject) {
        const staleReject = this._pendingReject;
        this._pendingReject = null;
        staleReject(new Error('WebSocket connect superseded by a newer connect() call'));
      }

      // Invalidate any previous socket's event handlers by incrementing the id
      this._socketId++;
      const socketId = this._socketId;
      this._pendingReject = reject;

      // Close any existing socket to avoid orphaned connections
      if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
        this.socket.close();
      }

      const settingsStore = useSettingsStore();
      const store = apiStore();
      const backendPort = store.apiPort;
      const backendHost = settingsStore.connection.ip || window.location.hostname;

      // Sicherheitsprüfung: apiPort muss gesetzt sein
      if (backendPort === null || backendPort === undefined) {
        this._pendingReject = null;
        reject(new Error('WebSocket connection failed: API port not available'));
        return;
      }

      this.backendUrl = `${backendProtokol}://${backendHost}:${backendPort}${backendPfad}`;
      //console.log('Channel WebSocket URL: ', this.backendUrl);

      this.socket = new WebSocket(this.backendUrl);

      // Timeout wenn Verbindung zu lange dauert
      const timeoutId = setTimeout(() => {
        if (socketId !== this._socketId) return; // superseded, already settled above
        if (!this.isConnected) {
          // WICHTIG: Socket schließen, damit onclose-Handler getriggert wird
          if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
            this.socket.close();
          }
          this._pendingReject = null;
          reject(new Error('WebSocket connection timeout'));
        }
      }, timeout);

      this.socket.onopen = () => {
        if (socketId !== this._socketId) return; // stale socket, ignore
        //console.log('Channel WebSocket verbunden.');
        clearTimeout(timeoutId);
        this.isConnected = true;
        this._pendingReject = null;
        if (this.statusCallback) {
          this.statusCallback('Connected');
        }
        resolve();
      };

      this.socket.onmessage = (event) => {
        if (socketId !== this._socketId) return; // stale socket, ignore
        //console.log('Channel Nachricht empfangen:', event.data);
        try {
          let message;
          if (event.data.startsWith('{') || event.data.startsWith('[')) {
            message = JSON.parse(event.data);
          } else {
            message = event.data;
          }

          if (this.messageCallback) {
            this.messageCallback(message);
          }
        } catch (error) {
          console.error('Channel error parsing message:', error);
          if (this.messageCallback) {
            this.messageCallback(event.data);
          }
          if (this.statusCallback) {
            this.statusCallback('Error receiving message');
          }
        }
      };

      this.socket.onerror = (error) => {
        if (socketId !== this._socketId) return; // stale socket, ignore
        console.error('Channel WebSocket error:', error);
        clearTimeout(timeoutId);
        this.isConnected = false;
        if (this.statusCallback) {
          this.statusCallback('Error: ' + error.message);
        }
        // NICHT reject() hier - onclose wird automatisch nach onerror getriggert
        // und handled den Reconnect
      };

      this.socket.onclose = (event) => {
        if (socketId !== this._socketId) return; // stale socket, ignore
        console.log('Channel WebSocket closed.', event.code, event.reason);
        clearTimeout(timeoutId);
        this.isConnected = false;

        // Store-Flag aktualisieren
        const store = apiStore();
        store.isWebSocketConnected = false;

        if (this.statusCallback) {
          this.statusCallback('Closed');
        }

        // Socket closed before ever successfully opening (e.g. connection refused) -
        // settle the connect() promise now instead of leaving the caller hanging.
        if (this._pendingReject) {
          const pendingReject = this._pendingReject;
          this._pendingReject = null;
          pendingReject(new Error('WebSocket closed before connection was established'));
        }

        // Reconnect basierend auf shouldReconnect und ob API/TNS-Plugin erreichbar sind
        // Warte NICHT auf isBackendReachable, da das einen Teufelskreis erzeugt
        const shouldAttemptReconnect =
          this.shouldReconnect &&
          store.isApiConnected &&
          store.isTnsPluginConnected &&
          store.apiPort !== null;

        if (shouldAttemptReconnect) {
          console.log(
            `Channel WebSocket: Attempting to reconnect in ${this.reconnectDelay / 1000} seconds...`
          );
          // WICHTIG: Timeout tracken, damit es bei disconnect() gecleard werden kann
          this.reconnectTimeoutId = setTimeout(() => {
            this.reconnectTimeoutId = null;
            // Erneute Prüfung vor Reconnect
            const recheckConditions =
              this.shouldReconnect &&
              store.isApiConnected &&
              store.isTnsPluginConnected &&
              store.apiPort !== null;

            if (recheckConditions) {
              // Use a longer timeout than the default 500ms here: right after the
              // app resumes from background, the radio (WiFi/mobile) is often still
              // waking up and a real handshake can take a few seconds. With the
              // short default this loop would time out forever every 2s and never
              // succeed, even though the backend is otherwise reachable.
              this.connect(5000)
                .then(() => {
                  // KRITISCH: Store-Flag aktualisieren nach erfolgreichem Reconnect!
                  store.isWebSocketConnected = true;
                  console.log('WebSocket successfully reconnected');
                })
                .catch((error) => {
                  console.warn('WebSocket reconnect failed:', error.message);
                  store.isWebSocketConnected = false;
                });
            }
          }, this.reconnectDelay);
        }
      };
    });
  }

  disconnect() {
    this.shouldReconnect = false;
    this.isConnected = false;

    // WICHTIG: Laufende Reconnect-Timeouts clearen
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.socket) {
      this.socket.close();
    }
  }

  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Für strukturierte Nachrichten (Objekte) JSON.stringify verwenden
      const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(messageToSend);
      console.log('Channel message sent:', message);
    } else {
      console.error('WebSocket is not connected. Message could not be sent.');
      if (this.statusCallback) {
        this.statusCallback('Error: WebSocket not connected');
      }
    }
  }

  // Subscription zu WebSocket events
  subscribe(eventType) {
    const subscribeMessage = {
      action: 'subscribe',
      eventType: eventType,
    };
    this.sendMessage(subscribeMessage);
  }

  // Unsubscription von WebSocket events
  unsubscribe(eventType) {
    const unsubscribeMessage = {
      action: 'unsubscribe',
      eventType: eventType,
    };
    this.sendMessage(unsubscribeMessage);
  }

  // Status prüfen
  isWebSocketConnected() {
    return this.isConnected && this.socket && this.socket.readyState === 1;
  }

  // Force reconnect
  forceReconnect() {
    if (this.socket) {
      this.socket.close();
    }
    this.connect();
  }
}

const websocketChannelService = new WebSocketChannelService();
export default websocketChannelService;
