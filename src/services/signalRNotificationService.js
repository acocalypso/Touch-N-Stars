import * as signalR from '@microsoft/signalr';
import { useSettingsStore } from '../store/settingsStore';

const backendProtokol = 'http';
const backendPort = 4782; // NINA server port
const backendPfad = '/hubs/notifications';

class SignalRNotificationService {
  constructor() {
    this.connection = null;
    this.statusCallback = null;
    this.messageCallback = null;
    this.notificationCallback = null;
    this.reconnectDelay = 2000; // 2 Sekunden
    this.shouldReconnect = true;
    this.isConnected = false;
    this.reconnectTimeoutId = null;
    this.url = null;
  }

  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  setMessageCallback(callback) {
    this.messageCallback = callback;
  }

  setNotificationCallback(callback) {
    this.notificationCallback = callback;
  }

  parseTimespan(timespan) {
    // Parse ISO 8601 duration or HH:MM:SS format
    if (typeof timespan !== 'string') return 5000;

    // ISO 8601 format: PT5S, PT1M30S, etc.
    const iso8601Regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/;
    const match = timespan.match(iso8601Regex);

    if (match) {
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseFloat(match[3] || 0);
      return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }

    // HH:MM:SS format
    const parts = timespan.split(':');
    if (parts.length === 3) {
      const h = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      const s = parseInt(parts[2]);
      return (h * 3600 + m * 60 + s) * 1000;
    }

    return 5000; // Default 5 seconds
  }

  connect() {
    return new Promise((resolve, reject) => {
      // Setze shouldReconnect auf true bei jedem Connect-Versuch
      this.shouldReconnect = true;

      const settingsStore = useSettingsStore();
      const backendHost = settingsStore.connection.ip || window.location.hostname;

      this.url = `${backendProtokol}://${backendHost}:${backendPort}${backendPfad}`;
      console.log('[SignalRNotificationService] Connecting to SignalR at:', this.url);

      try {
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(this.url, { withCredentials: false })
          .withAutomaticReconnect([1000, 3000, 5000, 10000, 30000])
          .build();

        // Event Handler für Notifications
        this.connection.on('ReceiveNotification', (notification) => {
          //console.log('[SignalRNotificationService] Received notification:', notification);

          const notifObj = {
            ...notification,
            id: Date.now() + Math.random(),
            timestamp: new Date(notification.timestamp),
          };

          // Callback für Notification aufrufen (wenn gesetzt)
          if (this.notificationCallback) {
            this.notificationCallback(notifObj);
          }

          // Generischer Message Callback (wenn gesetzt)
          if (this.messageCallback) {
            this.messageCallback(notifObj);
          }

          // Auto-remove handling (optional - Callback muss selbst implementieren)
          if (notification.lifetime) {
            const lifetimeMs = this.parseTimespan(notification.lifetime);
            // Weitergeben der Lifetime-Info
            if (this.notificationCallback) {
              notifObj.lifetimeMs = lifetimeMs;
            }
          }
        });

        // Reconnection Events
        this.connection.onreconnected(() => {
          console.log('[SignalRNotificationService] SignalR reconnected');
          this.isConnected = true;
          if (this.statusCallback) {
            this.statusCallback('Reconnected');
          }
        });

        this.connection.onreconnecting(() => {
          console.log('[SignalRNotificationService] SignalR reconnecting...');
          this.isConnected = false;
          if (this.statusCallback) {
            this.statusCallback('Reconnecting');
          }
        });

        this.connection.onclose((error) => {
          console.log('[SignalRNotificationService] SignalR connection closed', error);
          this.isConnected = false;

          if (this.statusCallback) {
            this.statusCallback('Closed');
          }

          // Manual reconnect wenn shouldReconnect true ist
          if (this.shouldReconnect && !error) {
            console.log(
              `[SignalRNotificationService] SignalR: Attempting to reconnect in ${this.reconnectDelay / 1000} seconds...`
            );
            this.reconnectTimeoutId = setTimeout(() => {
              this.reconnectTimeoutId = null;

              if (this.shouldReconnect) {
                this.connect()
                  .then(() => {
                    console.log('[SignalRNotificationService] SignalR successfully reconnected');
                  })
                  .catch((error) => {
                    console.warn(
                      '[SignalRNotificationService] SignalR reconnect failed:',
                      error.message
                    );
                  });
              }
            }, this.reconnectDelay);
          }
        });

        // Verbindung starten
        this.connection
          .start()
          .then(() => {
            console.log('[SignalRNotificationService] SignalR connected for notifications');
            this.isConnected = true;
            if (this.statusCallback) {
              this.statusCallback('Connected');
            }
            resolve();
          })
          .catch((err) => {
            console.error('[SignalRNotificationService] SignalR connection error:', err);
            this.isConnected = false;
            if (this.statusCallback) {
              this.statusCallback('Error: ' + err.message);
            }
            reject(err);
          });
      } catch (err) {
        console.error('[SignalRNotificationService] SignalR setup error:', err);
        reject(err);
      }
    });
  }

  disconnect() {
    this.shouldReconnect = false;
    this.isConnected = false;

    // Laufende Reconnect-Timeouts clearen
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.connection) {
      return this.connection
        .stop()
        .then(() => {
          console.log('[SignalRNotificationService] SignalR disconnected');
          this.connection = null;
        })
        .catch((err) => {
          console.error('[SignalRNotificationService] Error disconnecting SignalR:', err);
          this.connection = null;
        });
    }
    return Promise.resolve();
  }

  // Optional: Methode zum Senden von Messages an den Hub (falls benötigt)
  sendMessage(methodName, ...args) {
    if (this.connection && this.isConnected) {
      return this.connection
        .invoke(methodName, ...args)
        .then(() => {
          console.log('[SignalRNotificationService] SignalR message sent:', methodName, args);
        })
        .catch((err) => {
          console.error('[SignalRNotificationService] Error sending SignalR message:', err);
          if (this.statusCallback) {
            this.statusCallback('Error: Failed to send message');
          }
          throw err;
        });
    } else {
      const error = new Error(
        '[SignalRNotificationService] SignalR is not connected. Message could not be sent.'
      );
      console.error(error.message);
      if (this.statusCallback) {
        this.statusCallback('[SignalRNotificationService] Error: SignalR not connected');
      }
      return Promise.reject(error);
    }
  }

  // Status prüfen
  isSignalRConnected() {
    return (
      this.isConnected &&
      this.connection &&
      this.connection.state === signalR.HubConnectionState.Connected
    );
  }

  // Force reconnect
  forceReconnect() {
    if (this.connection) {
      return this.disconnect().then(() => {
        return this.connect();
      });
    }
    return this.connect();
  }
}

const signalRNotificationService = new SignalRNotificationService();
export default signalRNotificationService;
