import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import { handleApiError } from '@/utils/utils';

const backendProtokol = 'ws';
const backendPfad = '/v2/mount';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.statusCallback = null;
    this.messageCallback = null;
    this.backendUrl = null;

    this.reconnectInterval = 5000; // 5 Sekunden
    this.reconnectTimeout = null;
    this.shouldReconnect = true;
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

    console.log('ws url: ', this.backendUrl);

    this.socket = new WebSocket(this.backendUrl);

    this.socket.onopen = () => {
      console.log('WebSocket Mount connected.');
      if (this.statusCallback) {
        this.statusCallback('connected');
      }

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Message:', message);
        if (handleApiError(message, { title: 'Mount error' })) return;
        if (this.messageCallback) {
          this.messageCallback(message);
        }
      } catch (error) {
        console.error('Fehler beim Parsen der Nachricht:', error);
        if (this.statusCallback) {
          this.statusCallback('Fehler beim Empfangen einer Nachricht');
        }
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket-Fehler:', error);
      if (this.statusCallback) {
        this.statusCallback('Fehler: ' + error.message);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket geschlossen.');
      if (this.statusCallback) {
        this.statusCallback('Geschlossen');
      }

      if (this.shouldReconnect) {
        console.log(`Versuche Reconnect in ${this.reconnectInterval / 1000}s...`);
        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, this.reconnectInterval);
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.socket) {
      this.socket.close();
    }
  }

  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.error('WebSocket ist nicht verbunden. Nachricht konnte nicht gesendet werden.');
      if (this.statusCallback) {
        this.statusCallback('Fehler: WebSocket nicht verbunden');
      }
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
