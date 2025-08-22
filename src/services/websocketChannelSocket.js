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
  }

  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  setMessageCallback(callback) {
    this.messageCallback = callback;
  }

  connect() {
    const settingsStore = useSettingsStore();
    const store = apiStore();
    const backendPort = store.apiPort;
    const backendHost = settingsStore.connection.ip || window.location.hostname;
    this.backendUrl = `${backendProtokol}://${backendHost}:${backendPort}${backendPfad}`;

    console.log('Channel WebSocket URL: ', this.backendUrl);

    this.socket = new WebSocket(this.backendUrl);

    this.socket.onopen = () => {
      console.log('Channel WebSocket verbunden.');
      this.isConnected = true;
      if (this.statusCallback) {
        this.statusCallback('Verbunden');
      }
    };

    this.socket.onmessage = (event) => {
      console.log('Channel Nachricht empfangen:', event.data);
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
        console.error('Channel Fehler beim Parsen der Nachricht:', error);
        if (this.messageCallback) {
          this.messageCallback(event.data);
        }
        if (this.statusCallback) {
          this.statusCallback('Fehler beim Empfangen einer Nachricht');
        }
      }
    };

    this.socket.onerror = (error) => {
      console.error('Channel WebSocket-Fehler:', error);
      this.isConnected = false;
      if (this.statusCallback) {
        this.statusCallback('Fehler: ' + error.message);
      }
    };

    this.socket.onclose = (event) => {
      console.log('Channel WebSocket geschlossen.', event.code, event.reason);
      this.isConnected = false;
      if (this.statusCallback) {
        this.statusCallback('Geschlossen');
      }

      if (this.shouldReconnect && store.isBackendReachable) {
        console.log(`Channel WebSocket: Versuche erneut zu verbinden in ${this.reconnectDelay / 1000} Sekunden...`);
        setTimeout(() => {
          if (this.shouldReconnect && store.isBackendReachable) {
            this.connect();
          }
        }, this.reconnectDelay);
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    this.isConnected = false;
    if (this.socket) {
      this.socket.close();
    }
  }

  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      console.log('Channel Nachricht gesendet:', message);
    } else {
      console.error('Channel WebSocket ist nicht verbunden. Nachricht konnte nicht gesendet werden.');
      if (this.statusCallback) {
        this.statusCallback('Fehler: WebSocket nicht verbunden');
      }
    }
  }

  // Subscription zu WebSocket events
  subscribe(eventType) {
    const subscribeMessage = {
      action: 'subscribe',
      eventType: eventType
    };
    this.sendMessage(subscribeMessage);
  }

  // Unsubscription von WebSocket events
  unsubscribe(eventType) {
    const unsubscribeMessage = {
      action: 'unsubscribe',
      eventType: eventType
    };
    this.sendMessage(unsubscribeMessage);
  }

  // Status prüfen
  isWebSocketConnected() {
    return this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN;
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