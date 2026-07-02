import { createSignalRService } from './signalRServiceFactory';

/**
 * Dialogs hub. Thin adapter over the shared SignalR factory.
 */
class SignalRDialogService {
  constructor() {
    this.statusCallback = null;
    this.dialogCallback = null;
    this.measurementCallback = null;
    this.dialogStatusCallback = null;
    this.clearDialogCallback = null;

    this._service = createSignalRService({
      name: 'SignalRDialogService',
      path: '/hubs/dialogs',
      emitStatus: (s) => {
        if (this.statusCallback) this.statusCallback(s === 'Error' ? 'Failed' : s);
      },
      registerHandlers: (connection, ctx) => {
        const guard = () => ctx.getConnectionId() === ctx.currentConnectionId();
        connection.on('ReceiveDialog', (data) => {
          if (guard() && this.dialogCallback) this.dialogCallback(data);
        });
        connection.on('ReceiveMeasurement', (data) => {
          if (guard() && this.measurementCallback) this.measurementCallback(data);
        });
        connection.on('ReceiveDialogStatus', (data) => {
          if (guard() && this.dialogStatusCallback) this.dialogStatusCallback(data);
        });
        connection.on('ClearDialog', (contentType) => {
          if (guard() && this.clearDialogCallback) this.clearDialogCallback(contentType);
        });
      },
    });
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

  connect() {
    return this._service.connect();
  }

  disconnect() {
    return this._service.disconnect();
  }

  isSignalRConnected() {
    return this._service.isSignalRConnected();
  }
}

const signalRDialogService = new SignalRDialogService();
export default signalRDialogService;
