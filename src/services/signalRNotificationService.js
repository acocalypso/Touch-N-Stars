import { createSignalRService } from './signalRServiceFactory';

/**
 * Notifications hub. Thin adapter over the shared SignalR factory.
 */
class SignalRNotificationService {
  constructor() {
    this.statusCallback = null;
    this.messageCallback = null;
    this.notificationCallback = null;

    this._service = createSignalRService({
      name: 'SignalRNotificationService',
      path: '/hubs/notifications',
      emitStatus: (s) => {
        if (this.statusCallback) this.statusCallback(s);
      },
      registerHandlers: (connection, ctx) => {
        connection.on('ReceiveNotification', (notification) => {
          if (ctx.getConnectionId() !== ctx.currentConnectionId()) return;

          const notifObj = {
            ...notification,
            id: Date.now() + Math.random(),
            timestamp: new Date(notification.timestamp),
          };

          if (notification.lifetime) {
            notifObj.lifetimeMs = this.parseTimespan(notification.lifetime);
          }

          if (this.notificationCallback) this.notificationCallback(notifObj);
          if (this.messageCallback) this.messageCallback(notifObj);
        });
      },
    });
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
    // Parse ISO 8601 duration (PT5S, PT1M30S) or HH:MM:SS into milliseconds.
    if (typeof timespan !== 'string') return 5000;

    const iso8601Regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/;
    const match = timespan.match(iso8601Regex);
    if (match) {
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseFloat(match[3] || 0);
      return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }

    const parts = timespan.split(':');
    if (parts.length === 3) {
      const h = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      const s = parseInt(parts[2]);
      return (h * 3600 + m * 60 + s) * 1000;
    }

    return 5000;
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

const signalRNotificationService = new SignalRNotificationService();
export default signalRNotificationService;
