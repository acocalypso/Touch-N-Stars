// services/websocketTppa.js
import { useSettingsStore } from '@/store/settingsStore';
import { useFilterStore } from '@/store/filterStore';
import { apiStore } from '@/store/store';

const backendProtokol = 'ws';
const backendPfad = '/v2/filterwheel';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.statusCallback = null;
    this.messageCallback = null;
    this.backendUrl = null;

    this.reconnectInterval = 5000; // 5 Sekunden warten vorm Reconnect
    this.reconnectTimeout = null;
    this.shouldReconnect = true; // Standard: Verbindung soll sich selbst wieder aufbauen
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

    //Nur wenn das Backenderreichbar ist
    if (!store.isBackendReachable) return;

    // Prüfen ob bereits verbunden
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      //console.log('WebSocket bereits verbunden, überspringe connect()');
      return;
    }

    // Vorherige Verbindung schließen falls vorhanden
    if (this.socket) {
      this.socket.close();
    }

    const backendPort = store.apiPort;
    const backendHost = settingsStore.connection.ip || window.location.hostname;
    this.backendUrl = `${backendProtokol}://${backendHost}:${backendPort}${backendPfad}`;

    //console.log('ws url: ', this.backendUrl);

    this.socket = new WebSocket(this.backendUrl);

    this.socket.onopen = () => {
      console.log('WebSocket Filterwheel connected.');
      if (this.statusCallback) {
        this.statusCallback('connected');
      }

      this.sendMessage('get-target-filter');
      //console.log('get-target-filter gesendet');

      // Falls vorher ein Reconnect-Timer lief: abbrechen
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    };

    this.socket.onmessage = (event) => {
      //console.log('Nachricht empfangen:', event.data);
      try {
        const message = event.data;
        const filterStore = useFilterStore(); // erneute Instanz sichern (falls State neu aufgebaut wurde)
        filterStore.message = message;

        if (message === 'N/A' || message === 'Change Complete') {
          filterStore.filterChange = false;
        } else {
          filterStore.filterChange = true;
          filterStore.filterName = message;
        }

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
      if (this.statusCallback) {
        this.statusCallback('Error: ' + error.message);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket Filterwheel closed.');
      if (this.statusCallback) {
        this.statusCallback('Closed');
      }

      // Reconnect versuchen
      if (this.shouldReconnect) {
        console.log(`Attempting reconnect in ${this.reconnectInterval / 1000}s...`);
        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, this.reconnectInterval);
      }
    };
  }

  // Manuelles Trennen & Reconnect stoppen
  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.socket) {
      this.socket.close();
    }
  }

  // Methode zum Senden von Nachrichten
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

const wsFilter = new WebSocketService();
export default wsFilter;
