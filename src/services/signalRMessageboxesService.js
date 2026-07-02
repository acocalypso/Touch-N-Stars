import { createSignalRService } from './signalRServiceFactory';

/**
 * MessageBox hub. Thin adapter over the shared SignalR factory. The MessageBox
 * hub only emits 'ReceiveMessageBox'; the extra dialog-style setters are kept for
 * API parity with the dialog service but are unused by this hub.
 */
class SignalRMessageboxesService {
  constructor() {
    this.statusCallback = null;
    this.dialogCallback = null;
    this.measurementCallback = null;
    this.dialogStatusCallback = null;
    this.clearDialogCallback = null;

    this._service = createSignalRService({
      name: 'SignalRMessageboxesService',
      path: '/hubs/messageboxes',
      emitStatus: (s) => {
        if (this.statusCallback) this.statusCallback(s === 'Error' ? 'Failed' : s);
      },
      registerHandlers: (connection, ctx) => {
        connection.on('ReceiveMessageBox', (data) => {
          if (ctx.getConnectionId() !== ctx.currentConnectionId()) return;
          if (this.dialogCallback) this.dialogCallback(data);
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

  invoke(methodName, ...args) {
    return this._service.sendMessage(methodName, ...args);
  }
}

const signalRMessageboxesService = new SignalRMessageboxesService();
export default signalRMessageboxesService;
