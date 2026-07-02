import { useProgressStore } from '@/store/progressStore';
import { createSignalRService } from './signalRServiceFactory';

/**
 * Progress hub. Thin adapter over the shared SignalR factory.
 */
class SignalRProgressService {
  constructor() {
    this.statusCallback = null;
    this.progressCallback = null;
    this.reconnectCallback = null;

    this._service = createSignalRService({
      name: 'SignalRProgressService',
      path: '/hubs/progress',
      emitStatus: (s) => {
        if (this.statusCallback) this.statusCallback(s);
      },
      onReconnected: () => {
        if (this.reconnectCallback) this.reconnectCallback();
      },
      registerHandlers: (connection, ctx) => {
        connection.on('ReceiveProgress', (progressMessage) => {
          if (ctx.getConnectionId() !== ctx.currentConnectionId()) return;
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

          useProgressStore().handleProgressMessage(progressObj);
          if (this.progressCallback) this.progressCallback(progressObj);
        });
      },
    });
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
    return this._service.connect();
  }

  disconnect() {
    return this._service.disconnect();
  }

  sendMessage(methodName, ...args) {
    return this._service.sendMessage(methodName, ...args);
  }

  isSignalRConnected() {
    return this._service.isSignalRConnected();
  }
}

const signalRProgressService = new SignalRProgressService();
export default signalRProgressService;
