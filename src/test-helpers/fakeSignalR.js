// Controllable stand-in for @microsoft/signalr, wired in for every test run by
// scripts/test-loader.mjs (the resolve hook redirects the bare specifier
// here). Tests reach the created connections through the exported registry.
// Test-only code - never imported by application modules directly.

export const HubConnectionState = {
  Disconnected: 'Disconnected',
  Connecting: 'Connecting',
  Connected: 'Connected',
  Disconnecting: 'Disconnecting',
  Reconnecting: 'Reconnecting',
};

export const fakeSignalR = {
  connections: [],
  reset() {
    this.connections.length = 0;
  },
  lastConnection() {
    return this.connections[this.connections.length - 1];
  },
};

class FakeHubConnection {
  constructor(url, options, reconnectDelays) {
    this.baseUrl = url;
    this.options = options;
    this.reconnectDelays = reconnectDelays;
    this.state = HubConnectionState.Disconnected;
    this.startCalls = 0;
    this.stopCalls = 0;
    this.invocations = [];
    this.handlers = new Map();
    this.closeHandlers = [];
    this.reconnectingHandlers = [];
    this.reconnectedHandlers = [];
    this._startSettlers = null;
    fakeSignalR.connections.push(this);
  }

  start() {
    this.startCalls += 1;
    this.state = HubConnectionState.Connecting;
    return new Promise((resolve, reject) => {
      this._startSettlers = { resolve, reject };
    });
  }

  stop() {
    this.stopCalls += 1;
    this.state = HubConnectionState.Disconnected;
    return Promise.resolve();
  }

  on(methodName, callback) {
    if (!this.handlers.has(methodName)) this.handlers.set(methodName, []);
    this.handlers.get(methodName).push(callback);
  }

  off(methodName) {
    this.handlers.delete(methodName);
  }

  onclose(callback) {
    this.closeHandlers.push(callback);
  }

  onreconnecting(callback) {
    this.reconnectingHandlers.push(callback);
  }

  onreconnected(callback) {
    this.reconnectedHandlers.push(callback);
  }

  invoke(methodName, ...args) {
    this.invocations.push({ methodName, args });
    return Promise.resolve();
  }

  // --- test controls --------------------------------------------------------

  resolveStart() {
    this.state = HubConnectionState.Connected;
    this._startSettlers?.resolve();
    this._startSettlers = null;
  }

  rejectStart(error = new Error('connection refused')) {
    this.state = HubConnectionState.Disconnected;
    this._startSettlers?.reject(error);
    this._startSettlers = null;
  }

  emitClose(error) {
    this.state = HubConnectionState.Disconnected;
    for (const handler of this.closeHandlers) handler(error);
  }

  emitReconnecting(error) {
    this.state = HubConnectionState.Reconnecting;
    for (const handler of this.reconnectingHandlers) handler(error);
  }

  emitReconnected(connectionId) {
    this.state = HubConnectionState.Connected;
    for (const handler of this.reconnectedHandlers) handler(connectionId);
  }

  emitEvent(methodName, ...args) {
    for (const handler of this.handlers.get(methodName) ?? []) handler(...args);
  }
}

export class HubConnectionBuilder {
  withUrl(url, options) {
    this._url = url;
    this._options = options;
    return this;
  }

  withAutomaticReconnect(delays) {
    this._reconnectDelays = delays;
    return this;
  }

  configureLogging() {
    return this;
  }

  build() {
    return new FakeHubConnection(this._url, this._options, this._reconnectDelays);
  }
}
