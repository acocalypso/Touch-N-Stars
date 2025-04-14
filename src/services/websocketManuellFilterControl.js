// services/websocketTppa.js
import { useSettingsStore } from '@/store/settingsStore';
import { useFilterStore } from '@/store/filterStore';

const backendProtokol = 'ws';
const backendPfad = '/v2/filterwheel';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.statusCallback = null;
    this.messageCallback = null;
    this.backendUrl = null;
  }

  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  setMessageCallback(callback) {
    this.messageCallback = callback;
  }

  connect() {
    const filterStore = useFilterStore();
    const settingsStore = useSettingsStore();
    const backendPort = 1888;
    const backendHost = settingsStore.connection.ip || window.location.hostname;
    this.backendUrl = `${backendProtokol}://${backendHost}:${backendPort}${backendPfad}`;

    console.log('ws url: ', this.backendUrl);

    this.socket = new WebSocket(this.backendUrl);

    this.socket.onopen = () => {
      console.log('WebSocket manuell Filterwheel connected.');
      if (this.statusCallback) {
        this.statusCallback('connected');
      }
    };

    this.socket.onmessage = (event) => {
      console.log('Nachricht empfangen:', event.data);
      try {
        const message = event.data;
        console.log('Message:', message);
        filterStore.message = message;
        if (message === 'N/A') {
          filterStore.filterChange = false;
        } else if (message === 'Change Complete') {
          filterStore.filterChange = false;
        } else {
          filterStore.filterChange = true;
          filterStore.filterName = message;
        }

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
    };
  }

  // Methode zum Senden von Nachrichten als einfache Strings
  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Nachricht direkt als String senden
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
