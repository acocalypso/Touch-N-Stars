import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import { useMountStore } from '@/store/mountStore';

const backendProtokol = 'ws';
const backendPfad = '/v2/mount';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.statusCallback = null;
    this.messageCallback = null;
    this.backendUrl = null;

    this.reconnectInterval = 2000; // 2 Sekunden
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
    this.shouldReconnect = true; // Reconnect aktivieren bei neuer Verbindung
    const settingsStore = useSettingsStore();
    const store = apiStore();
    const backendPort = store.apiPort;
    const backendHost = settingsStore.connection.ip || window.location.hostname;
    this.backendUrl = `${backendProtokol}://${backendHost}:${backendPort}${backendPfad}`;

    //console.log('ws url: ', this.backendUrl);

    this.socket = new WebSocket(this.backendUrl);

    this.socket.onopen = () => {
      console.log('WebSocket Mount connected.');
      const mountStore = useMountStore();
      mountStore.wsIsConnected = true;

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
        if (!message.Success) return;
        if (this.messageCallback) {
          this.messageCallback(message);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
        if (this.statusCallback) {
          this.statusCallback('Error receiving message');
        }
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      const mountStore = useMountStore();
      mountStore.wsIsConnected = false;

      if (this.statusCallback) {
        this.statusCallback('Error: ' + error.message);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket closed.');
      const mountStore = useMountStore();
      mountStore.wsIsConnected = false;

      if (this.statusCallback) {
        this.statusCallback('Closed');
      }

      console.log('shouldReconnect:', this.shouldReconnect);
      if (this.shouldReconnect) {
        console.log(`Attempting reconnect in ${this.reconnectInterval / 1000}s...`);
        this.reconnectTimeout = setTimeout(() => {
          console.log('Attempting reconnect...');
          this.connect();
        }, this.reconnectInterval);
      } else {
        console.log('Reconnect disabled');
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    const mountStore = useMountStore();
    mountStore.wsIsConnected = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.socket) {
      this.socket.close();
    }
  }

  sendMessage(message) {
    if (this.socket && this.socket.readyState === 1) {
      this.socket.send(message);
    } else {
      console.error('WebSocket is not connected. Message could not be sent.');
      if (this.statusCallback) {
        this.statusCallback('Error: WebSocket not connected');
      }
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
