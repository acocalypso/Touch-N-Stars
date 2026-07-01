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
    this._pendingConnect = null; // in-flight connect() promise, shared by concurrent callers
  }

  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  setMessageCallback(callback) {
    this.messageCallback = callback;
  }

  connect(timeout = 500) {
    // A connect() attempt is already in flight (typically the internal auto-reconnect
    // loop below). Concurrent callers - most notably fetchAllInfos() polling on its own
    // ~2s cadence - used to start a *competing* connect() that tore down and replaced
    // the in-flight one. With both loops retrying on a similar cadence, they kept
    // cancelling each other roughly every 2 seconds, so neither ever got an
    // uninterrupted window to actually finish the WebSocket handshake - a self-inflicted
    // livelock that could stretch reconnection out to 10+ seconds. Piggyback on the
    // existing attempt instead of starting a new one.
    if (this._pendingConnect) {
      return this._pendingConnect;
    }

    const connectPromise = new Promise((resolve, reject) => {
      // Setze shouldReconnect auf true bei jedem Connect-Versuch
      this.shouldReconnect = true;

      // Invalidate any previous socket's event handlers by incrementing the id
      this._socketId++;
      const socketId = this._socketId;

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
        reject(new Error('WebSocket connection failed: API port not available'));
        return;
      }

      this.backendUrl = `${backendProtokol}://${backendHost}:${backendPort}${backendPfad}`;
      //console.log('Channel WebSocket URL: ', this.backendUrl);

      this.socket = new WebSocket(this.backendUrl);

      // Timeout wenn Verbindung zu lange dauert
      const timeoutId = setTimeout(() => {
        if (socketId !== this._socketId) return; // stale socket, ignore
        if (!this.isConnected) {
          // WICHTIG: Socket schließen, damit onclose-Handler getriggert wird
          if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
            this.socket.close();
          }
          reject(new Error('WebSocket connection timeout'));
        }
      }, timeout);

      this.socket.onopen = () => {
        if (socketId !== this._socketId) return; // stale socket, ignore
        //console.log('Channel WebSocket verbunden.');
        clearTimeout(timeoutId);
        this.isConnected = true;
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
        // A no-op if onopen already resolved it.
        reject(new Error('WebSocket closed before connection was established'));

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

    this._pendingConnect = connectPromise;
    connectPromise.finally(() => {
      if (this._pendingConnect === connectPromise) {
        this._pendingConnect = null;
      }
    });

    return connectPromise;
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
    // Discard any dedup target so this always starts a genuinely fresh attempt.
    this._pendingConnect = null;
    if (this.socket) {
      this.socket.close();
    }
    this.connect();
  }
}

const websocketChannelService = new WebSocketChannelService();
export default websocketChannelService;
