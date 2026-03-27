import * as signalR from '@microsoft/signalr';
import { useSettingsStore } from '../store/settingsStore';

const backendProtokol = 'http';
const backendPort = 4782; // NINA server port
const backendPfad = '/hubs/messageboxes';

class SignalRMessageboxesService {
  constructor() {
    this.connection = null;
    this.statusCallback = null;
    this.dialogCallback = null;
    this.measurementCallback = null;
    this.dialogStatusCallback = null;
    this.clearDialogCallback = null;
    this.reconnectDelay = 2000; // 2 seconds
    this.shouldReconnect = true;
    this.isConnected = false;
    this.reconnectTimeoutId = null;
    this.url = null;
    this._connectionId = 0;
    this._connectingPromise = null;
  }

  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  setDialogCallback(callback) {
    this.dialogCallback = callback;
  }

  setMeasurementCallback(callback) {
    this.measurementCallback = callback;
  }

  setDialogStatusCallback(callback) {
    this.dialogStatusCallback = callback;
  }

  setClearDialogCallback(callback) {
    this.clearDialogCallback = callback;
  }

  isSignalRConnected() {
    return this.isConnected && this.connection?.state === signalR.HubConnectionState.Connected;
  }

  connect() {
    // Deduplicate concurrent connect() calls — return the in-flight promise if one exists
    if (this._connectingPromise) {
      return this._connectingPromise;
    }

    this._connectingPromise = new Promise((resolve, reject) => {
      // Set shouldReconnect to true on each connect attempt
      this.shouldReconnect = true;

      // Invalidate any previous connection's handlers and stop the stale connection
      this._connectionId++;
      const connectionId = this._connectionId;
      if (this.connection) {
        const stale = this.connection;
        this.connection = null;
        stale.stop().catch(() => {});
      }

      const settingsStore = useSettingsStore();
      const backendHost = settingsStore.connection.ip || window.location.hostname;

      this.url = `${backendProtokol}://${backendHost}:${backendPort}${backendPfad}`;
      //console.log('[SignalRMessageboxesService] Connecting to SignalR at:', this.url);

      try {
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(this.url, { withCredentials: false })
          .withAutomaticReconnect([1000, 3000, 5000, 10000, 30000])
          .build();

        // Event Handler for ReceiveMessageBox
        this.connection.on('ReceiveMessageBox', (messageBoxData) => {
          if (connectionId !== this._connectionId) return;
          //console.log('[SignalRMessageboxesService] Received MessageBox:', messageBoxData);
          if (this.dialogCallback) {
            this.dialogCallback(messageBoxData);
          }
        });

        // Note: MessageBox Hub only sends 'ReceiveMessageBox' event
        // No ReceiveMeasurement, ReceiveDialogStatus, or ClearDialog events in MessageBox Hub

        // Reconnection Events
        this.connection.onreconnected(() => {
          if (connectionId !== this._connectionId) return;
          console.log('[SignalRMessageboxesService] Reconnected');
          this.isConnected = true;
          if (this.statusCallback) {
            this.statusCallback('Reconnected');
          }
        });

        this.connection.onreconnecting(() => {
          if (connectionId !== this._connectionId) return;
          console.log('[SignalRMessageboxesService] Reconnecting...');
          this.isConnected = false;
          if (this.statusCallback) {
            this.statusCallback('Reconnecting');
          }
        });

        this.connection.onclose((error) => {
          if (connectionId !== this._connectionId) return;
          console.log('[SignalRMessageboxesService] Connection closed', error);
          this.isConnected = false;

          if (this.statusCallback) {
            this.statusCallback('Closed');
          }

          // Manual reconnect if shouldReconnect is true
          if (this.shouldReconnect) {
            console.log(
              `[SignalRMessageboxesService] Attempting to reconnect in ${this.reconnectDelay / 1000} seconds...`
            );
            this.reconnectTimeoutId = setTimeout(() => {
              this.reconnectTimeoutId = null;

              if (this.shouldReconnect) {
                this.connect()
                  .then(() => {
                    console.log('[SignalRMessageboxesService] Successfully reconnected');
                  })
                  .catch((err) => {
                    console.warn('[SignalRMessageboxesService] Reconnect failed:', err.message);
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

        // Start connection
        this.connection
          .start()
          .then(() => {
            this._connectingPromise = null;
            console.log('[SignalRMessageboxesService] Connected successfully');
            this.isConnected = true;
            if (this.statusCallback) {
              this.statusCallback('Connected');
            }
            resolve(this.connection);
          })
          .catch((error) => {
            this._connectingPromise = null;
            console.error('[SignalRMessageboxesService] Connection failed:', error);
            this.isConnected = false;
            if (this.statusCallback) {
              this.statusCallback('Failed');
            }
            // Retry initial connection after delay
            if (this.shouldReconnect) {
              console.log(
                `[SignalRMessageboxesService] Retrying initial connection in ${this.reconnectDelay / 1000} seconds...`
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
              reject(error);
            }
          });
      } catch (error) {
        this._connectingPromise = null;
        console.error('[SignalRMessageboxesService] Error during connection setup:', error);
        reject(error);
      }
    });

    return this._connectingPromise;
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      // Disable auto-reconnect
      this.shouldReconnect = false;

      // Clear any pending reconnect timeout
      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }

      if (this.connection) {
        this.connection
          .stop()
          .then(() => {
            console.log('[SignalRMessageboxesService] Disconnected');
            this.isConnected = false;
            this.connection = null;
            resolve();
          })
          .catch((error) => {
            console.error('[SignalRMessageboxesService] Error during disconnect:', error);
            this.isConnected = false;
            reject(error);
          });
      } else {
        console.log('[SignalRMessageboxesService] No active connection to disconnect');
        resolve();
      }
    });
  }
}

// Export singleton instance
const signalRMessageboxesService = new SignalRMessageboxesService();
export default signalRMessageboxesService;
