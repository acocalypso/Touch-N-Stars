import * as signalR from '@microsoft/signalr';
import { useSettingsStore } from '../store/settingsStore';

const backendProtokol = 'http';
const backendPort = 4782; // NINA server port
const backendPfad = '/hubs/dialogs';

class SignalRDialogService {
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
      console.log('[SignalRDialogService] Connecting to SignalR at:', this.url);

      try {
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(this.url, { withCredentials: false })
          .withAutomaticReconnect([1000, 3000, 5000, 10000, 30000])
          .build();

        // Event Handler for ReceiveDialog
        this.connection.on('ReceiveDialog', (dialogData) => {
          if (connectionId !== this._connectionId) return;
          console.log('[SignalRDialogService] Received dialog:', dialogData);
          if (this.dialogCallback) {
            this.dialogCallback(dialogData);
          }
        });

        // Event Handler for ReceiveMeasurement
        this.connection.on('ReceiveMeasurement', (measurement) => {
          if (connectionId !== this._connectionId) return;
          console.log('[SignalRDialogService] Received measurement:', measurement);
          if (this.measurementCallback) {
            this.measurementCallback(measurement);
          }
        });

        // Event Handler for ReceiveDialogStatus
        this.connection.on('ReceiveDialogStatus', (status) => {
          if (connectionId !== this._connectionId) return;
          console.log('[SignalRDialogService] Received dialog status:', status);
          if (this.dialogStatusCallback) {
            this.dialogStatusCallback(status);
          }
        });

        // Event Handler for ClearDialog
        this.connection.on('ClearDialog', (contentType) => {
          if (connectionId !== this._connectionId) return;
          console.log('[SignalRDialogService] Clear dialog:', contentType);
          if (this.clearDialogCallback) {
            this.clearDialogCallback(contentType);
          }
        });

        // Reconnection Events
        this.connection.onreconnected(() => {
          if (connectionId !== this._connectionId) return;
          console.log('[SignalRDialogService] Reconnected');
          this.isConnected = true;
          if (this.statusCallback) {
            this.statusCallback('Reconnected');
          }
        });

        this.connection.onreconnecting(() => {
          if (connectionId !== this._connectionId) return;
          console.log('[SignalRDialogService] Reconnecting...');
          this.isConnected = false;
          if (this.statusCallback) {
            this.statusCallback('Reconnecting');
          }
        });

        this.connection.onclose((error) => {
          if (connectionId !== this._connectionId) return;
          console.log('[SignalRDialogService] Connection closed', error);
          this.isConnected = false;

          if (this.statusCallback) {
            this.statusCallback('Closed');
          }

          // Manual reconnect if shouldReconnect is true
          if (this.shouldReconnect) {
            console.log(
              `[SignalRDialogService] Attempting to reconnect in ${this.reconnectDelay / 1000} seconds...`
            );
            this.reconnectTimeoutId = setTimeout(() => {
              this.reconnectTimeoutId = null;

              if (this.shouldReconnect) {
                this.connect()
                  .then(() => {
                    console.log('[SignalRDialogService] Successfully reconnected');
                  })
                  .catch((err) => {
                    console.warn('[SignalRDialogService] Reconnect failed:', err.message);
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
            console.log('[SignalRDialogService] Connected successfully');
            this.isConnected = true;
            if (this.statusCallback) {
              this.statusCallback('Connected');
            }
            resolve(this.connection);
          })
          .catch((error) => {
            this._connectingPromise = null;
            console.error('[SignalRDialogService] Connection failed:', error);
            this.isConnected = false;
            if (this.statusCallback) {
              this.statusCallback('Failed');
            }
            // Retry initial connection after delay
            if (this.shouldReconnect) {
              console.log(
                `[SignalRDialogService] Retrying initial connection in ${this.reconnectDelay / 1000} seconds...`
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
        console.error('[SignalRDialogService] Error during connection setup:', error);
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
        const conn = this.connection;
        this.connection = null; // Clear immediately so concurrent connect() won't be overwritten
        conn
          .stop()
          .then(() => {
            console.log('[SignalRDialogService] Disconnected');
            this.isConnected = false;
            resolve();
          })
          .catch((error) => {
            console.error('[SignalRDialogService] Error during disconnect:', error);
            this.isConnected = false;
            reject(error);
          });
      } else {
        console.log('[SignalRDialogService] No active connection to disconnect');
        resolve();
      }
    });
  }
}

// Export singleton instance
const signalRDialogService = new SignalRDialogService();
export default signalRDialogService;
