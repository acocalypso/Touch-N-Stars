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
    return new Promise((resolve, reject) => {
      // Set shouldReconnect to true on each connect attempt
      this.shouldReconnect = true;

      const settingsStore = useSettingsStore();
      const backendHost = settingsStore.connection.ip || window.location.hostname;

      this.url = `${backendProtokol}://${backendHost}:${backendPort}${backendPfad}`;
      console.log('[signalRMessageboxesService] Connecting to SignalR at:', this.url);

      try {
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(this.url, { withCredentials: false })
          .withAutomaticReconnect([1000, 3000, 5000, 10000, 30000])
          .build();

        // Event Handler for ReceiveDialog
        this.connection.on('ReceiveDialog', (dialogData) => {
          console.log('[signalRMessageboxesService] Received dialog:', dialogData);
          if (this.dialogCallback) {
            this.dialogCallback(dialogData);
          }
        });

        // Event Handler for ReceiveMeasurement
        this.connection.on('ReceiveMeasurement', (measurement) => {
          console.log('[signalRMessageboxesService] Received measurement:', measurement);
          if (this.measurementCallback) {
            this.measurementCallback(measurement);
          }
        });

        // Event Handler for ReceiveDialogStatus
        this.connection.on('ReceiveDialogStatus', (status) => {
          console.log('[signalRMessageboxesService] Received dialog status:', status);
          if (this.dialogStatusCallback) {
            this.dialogStatusCallback(status);
          }
        });

        // Event Handler for ClearDialog
        this.connection.on('ClearDialog', (contentType) => {
          console.log('[signalRMessageboxesService] Clear dialog:', contentType);
          if (this.clearDialogCallback) {
            this.clearDialogCallback(contentType);
          }
        });

        // Reconnection Events
        this.connection.onreconnected(() => {
          console.log('[signalRMessageboxesService] Reconnected');
          this.isConnected = true;
          if (this.statusCallback) {
            this.statusCallback('Reconnected');
          }
        });

        this.connection.onreconnecting(() => {
          console.log('[signalRMessageboxesService] Reconnecting...');
          this.isConnected = false;
          if (this.statusCallback) {
            this.statusCallback('Reconnecting');
          }
        });

        this.connection.onclose((error) => {
          console.log('[signalRMessageboxesService] Connection closed', error);
          this.isConnected = false;

          if (this.statusCallback) {
            this.statusCallback('Closed');
          }

          // Manual reconnect if shouldReconnect is true
          if (this.shouldReconnect && !error) {
            console.log(
              `[signalRMessageboxesService] Attempting to reconnect in ${this.reconnectDelay / 1000} seconds...`
            );
            this.reconnectTimeoutId = setTimeout(() => {
              this.reconnectTimeoutId = null;

              if (this.shouldReconnect) {
                this.connect()
                  .then(() => {
                    console.log('[signalRMessageboxesService] Successfully reconnected');
                  })
                  .catch((error) => {
                    console.warn('[signalRMessageboxesService] Reconnect failed:', error.message);
                  });
              }
            }, this.reconnectDelay);
          }
        });

        // Start connection
        this.connection
          .start()
          .then(() => {
            console.log('[signalRMessageboxesService] Connected successfully');
            this.isConnected = true;
            if (this.statusCallback) {
              this.statusCallback('Connected');
            }
            resolve(this.connection);
          })
          .catch((error) => {
            console.error('[signalRMessageboxesService] Connection failed:', error);
            this.isConnected = false;
            if (this.statusCallback) {
              this.statusCallback('Failed');
            }
            reject(error);
          });
      } catch (error) {
        console.error('[signalRMessageboxesService] Error during connection setup:', error);
        reject(error);
      }
    });
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
            console.log('[signalRMessageboxesService] Disconnected');
            this.isConnected = false;
            this.connection = null;
            resolve();
          })
          .catch((error) => {
            console.error('[signalRMessageboxesService] Error during disconnect:', error);
            this.isConnected = false;
            reject(error);
          });
      } else {
        console.log('[signalRMessageboxesService] No active connection to disconnect');
        resolve();
      }
    });
  }
}

// Export singleton instance
const signalRMessageboxesService = new SignalRMessageboxesService();
export default signalRMessageboxesService;
