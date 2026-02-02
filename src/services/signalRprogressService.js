import * as signalR from '@microsoft/signalr';
import { useSettingsStore } from '../store/settingsStore';
import { useProgressStore } from '../store/progressStore';

const backendProtokol = 'http';
const backendPort = 4782; // NINA server port
const backendPfad = '/hubs/progress';

class SignalRProgressService {
  constructor() {
    this.connection = null;
    this.statusCallback = null;
    this.progressCallback = null;
    this.reconnectCallback = null;
    this.reconnectDelay = 2000; // 2 Sekunden
    this.shouldReconnect = true;
    this.isConnected = false;
    this.reconnectTimeoutId = null;
    this.url = null;
  }

  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  setReconnectCallback(callback) {
    this.reconnectCallback = callback;
  }

  connect() {
    return new Promise((resolve, reject) => {
      // Setze shouldReconnect auf true bei jedem Connect-Versuch
      this.shouldReconnect = true;

      const settingsStore = useSettingsStore();
      const backendHost = settingsStore.connection.ip || window.location.hostname;

      this.url = `${backendProtokol}://${backendHost}:${backendPort}${backendPfad}`;
      console.log('[SignalRProgressService] Connecting to SignalR at:', this.url);

      try {
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(this.url, { withCredentials: false })
          .withAutomaticReconnect([1000, 3000, 5000, 10000, 30000])
          .build();

        // Event Handler für Progress Updates
        this.connection.on('ReceiveProgress', (progressMessage) => {
          console.log('Received progress:', progressMessage);
          const progressObj = {
            source: progressMessage.source,
            state: progressMessage.state,
            status: progressMessage.status,
            status2: progressMessage.status2,
            status3: progressMessage.status3,
            progress: progressMessage.progress,
            maxProgress: progressMessage.maxProgress,
            progressType: progressMessage.progressType,
            progress2: progressMessage.progress2,
            maxProgress2: progressMessage.maxProgress2,
            progressType2: progressMessage.progressType2,
            progress3: progressMessage.progress3,
            maxProgress3: progressMessage.maxProgress3,
            progressType3: progressMessage.progressType3,
            timestamp: new Date(progressMessage.timestamp),
          };

          // Progress im Store speichern
          const progressStore = useProgressStore();
          progressStore.handleProgressMessage(progressObj);

          // Callback für Progress aufrufen (wenn gesetzt)
          if (this.progressCallback) {
            this.progressCallback(progressObj);
          }
        });

        // Reconnection Events
        this.connection.onreconnected(() => {
          console.log('[SignalRProgressService] SignalR reconnected');
          this.isConnected = true;
          if (this.statusCallback) {
            this.statusCallback('Reconnected');
          }
          if (this.reconnectCallback) {
            this.reconnectCallback();
          }
        });

        this.connection.onreconnecting(() => {
          console.log('[SignalRProgressService] SignalR reconnecting...');
          this.isConnected = false;
          if (this.statusCallback) {
            this.statusCallback('Reconnecting');
          }
        });

        this.connection.onclose((error) => {
          console.log('[SignalRProgressService] SignalR connection closed', error);
          this.isConnected = false;

          if (this.statusCallback) {
            this.statusCallback('Closed');
          }

          // Manual reconnect wenn shouldReconnect true ist
          if (this.shouldReconnect) {
            console.log(
              `[SignalRProgressService] SignalR: Attempting to reconnect in ${this.reconnectDelay / 1000} seconds...`
            );
            this.reconnectTimeoutId = setTimeout(() => {
              this.reconnectTimeoutId = null;

              if (this.shouldReconnect) {
                this.connect()
                  .then(() => {
                    console.log('[SignalRProgressService] SignalR successfully reconnected');
                  })
                  .catch((err) => {
                    console.warn(
                      '[SignalRProgressService] SignalR reconnect failed:',
                      err.message
                    );
                    // Retry again after delay
                    if (this.shouldReconnect) {
                      this.reconnectTimeoutId = setTimeout(() => {
                        this.reconnectTimeoutId = null;
                        if (this.shouldReconnect) {
                          this.connect().catch(() => {});
                        }
                      }, this.reconnectDelay);
                    }
                  });
              }
            }, this.reconnectDelay);
          }
        });

        // Verbindung starten
        this.connection
          .start()
          .then(() => {
            console.log('[SignalRProgressService] SignalR connected for progress updates');
            this.isConnected = true;
            if (this.statusCallback) {
              this.statusCallback('Connected');
            }
            resolve();
          })
          .catch((err) => {
            console.error('[SignalRProgressService] SignalR connection error:', err);
            this.isConnected = false;
            if (this.statusCallback) {
              this.statusCallback('Error: ' + err.message);
            }
            // Retry initial connection after delay
            if (this.shouldReconnect) {
              console.log(
                `[SignalRProgressService] Retrying initial connection in ${this.reconnectDelay / 1000} seconds...`
              );
              this.reconnectTimeoutId = setTimeout(() => {
                this.reconnectTimeoutId = null;
                if (this.shouldReconnect) {
                  this.connect()
                    .then(resolve)
                    .catch(() => {});
                }
              }, this.reconnectDelay);
            } else {
              reject(err);
            }
          });
      } catch (err) {
        console.error('[SignalRProgressService] SignalR setup error:', err);
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
          console.log('[SignalRProgressService] SignalR disconnected');
          this.connection = null;
        })
        .catch((err) => {
          console.error('[SignalRProgressService] Error disconnecting SignalR:', err);
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
          console.log('[SignalRProgressService] SignalR message sent:', methodName, args);
        })
        .catch((err) => {
          console.error('[SignalRProgressService] Error sending SignalR message:', err);
          if (this.statusCallback) {
            this.statusCallback('Error: Failed to send message');
          }
          throw err;
        });
    } else {
      const error = new Error(
        '[SignalRProgressService] SignalR is not connected. Message could not be sent.'
      );
      console.error(error.message);
      if (this.statusCallback) {
        this.statusCallback('[SignalRProgressService] Error: SignalR not connected');
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

const signalRProgressService = new SignalRProgressService();
export default signalRProgressService;
