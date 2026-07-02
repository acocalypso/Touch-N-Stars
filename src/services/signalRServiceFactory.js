import * as signalR from '@microsoft/signalr';
import { useSettingsStore } from '../store/settingsStore';

const backendProtokol = 'http';
const backendPort = 4782; // NINA server port

// Automatic reconnect is the ONLY in-connection retrier. Its schedule spans ~49s;
// onclose fires only after it gives up, at which point the single manual restart
// below arms. This removes the old double-driver (a manual 2s loop racing the
// automatic one) that every SignalR service used to run.
const AUTOMATIC_RECONNECT_DELAYS = [1000, 3000, 5000, 10000, 30000];
const RESTART_DELAY_MS = 2000;

/**
 * Build a SignalR hub service with a shared connection lifecycle:
 * - connect() dedup via an in-flight promise
 * - generation guard (_connectionId) invalidating stale handlers
 * - withAutomaticReconnect as the sole in-connection retrier
 * - one tracked manual restart, armed only after automatic reconnect gives up
 *   (onclose) or the very first connect fails
 * - disconnect() that cancels the restart and stops the connection
 *
 * @param {object} config
 * @param {string} config.name - log prefix, e.g. 'SignalRDialogService'
 * @param {string} config.path - hub path, e.g. '/hubs/dialogs'
 * @param {(connection: signalR.HubConnection, ctx: { getConnectionId: () => number, currentConnectionId: () => number }) => void} config.registerHandlers
 *   Register `connection.on(...)` event handlers here. Guard each with
 *   `if (ctx.getConnectionId() !== ctx.currentConnectionId()) return;`.
 * @param {(status: string) => void} [config.emitStatus] - forward status strings to the instance's statusCallback
 * @param {() => void} [config.onReconnected] - extra hook fired on automatic reconnect success
 * @returns {object} controller with connect/disconnect/isSignalRConnected and the raw connection accessor
 */
export function createSignalRService({ name, path, registerHandlers, emitStatus, onReconnected }) {
  const state = {
    connection: null,
    shouldReconnect: true,
    isConnected: false,
    restartTimeoutId: null,
    url: null,
    connectionId: 0,
    connectingPromise: null,
  };

  const status = (s) => {
    if (emitStatus) emitStatus(s);
  };

  const clearRestartTimer = () => {
    if (state.restartTimeoutId) {
      clearTimeout(state.restartTimeoutId);
      state.restartTimeoutId = null;
    }
  };

  const scheduleRestart = () => {
    if (!state.shouldReconnect || state.restartTimeoutId) return;
    console.log(`[${name}] scheduling restart in ${RESTART_DELAY_MS / 1000}s...`);
    state.restartTimeoutId = setTimeout(() => {
      state.restartTimeoutId = null;
      if (state.shouldReconnect) {
        connect().catch(() => {});
      }
    }, RESTART_DELAY_MS);
  };

  function connect() {
    if (state.connectingPromise) {
      return state.connectingPromise;
    }

    state.connectingPromise = new Promise((resolve, reject) => {
      state.shouldReconnect = true;

      // Invalidate a previous connection's handlers and stop it
      state.connectionId++;
      const connectionId = state.connectionId;
      if (state.connection) {
        const stale = state.connection;
        state.connection = null;
        stale.stop().catch(() => {});
      }

      const settingsStore = useSettingsStore();
      const host = settingsStore.connection.ip || window.location.hostname;
      state.url = `${backendProtokol}://${host}:${backendPort}${path}`;
      console.log(`[${name}] connecting to SignalR at:`, state.url);

      try {
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(state.url, { withCredentials: false })
          .withAutomaticReconnect(AUTOMATIC_RECONNECT_DELAYS)
          .build();
        state.connection = connection;

        registerHandlers(connection, {
          getConnectionId: () => connectionId,
          currentConnectionId: () => state.connectionId,
        });

        connection.onreconnected(() => {
          if (connectionId !== state.connectionId) return;
          console.log(`[${name}] reconnected`);
          state.isConnected = true;
          status('Reconnected');
          if (onReconnected) onReconnected();
        });

        connection.onreconnecting(() => {
          if (connectionId !== state.connectionId) return;
          console.log(`[${name}] reconnecting...`);
          state.isConnected = false;
          status('Reconnecting');
        });

        connection.onclose((error) => {
          if (connectionId !== state.connectionId) return;
          // Fires only after automatic reconnect exhausted its schedule.
          console.log(`[${name}] connection closed`, error);
          state.isConnected = false;
          status('Closed');
          scheduleRestart();
        });

        connection
          .start()
          .then(() => {
            state.connectingPromise = null;
            console.log(`[${name}] connected`);
            state.isConnected = true;
            status('Connected');
            resolve(connection);
          })
          .catch((err) => {
            state.connectingPromise = null;
            console.error(`[${name}] connection error:`, err);
            state.isConnected = false;
            status('Error: ' + err.message);
            // The very first connect has no automatic-reconnect safety net, so
            // arm the single manual restart here too.
            if (state.shouldReconnect) {
              scheduleRestart();
              resolve(null); // resolve so awaiters don't hang; restart continues
            } else {
              reject(err);
            }
          });
      } catch (err) {
        state.connectingPromise = null;
        console.error(`[${name}] setup error:`, err);
        reject(err);
      }
    });

    return state.connectingPromise;
  }

  function disconnect() {
    state.shouldReconnect = false;
    state.isConnected = false;
    clearRestartTimer();
    if (state.connection) {
      const conn = state.connection;
      state.connection = null;
      return conn
        .stop()
        .then(() => console.log(`[${name}] disconnected`))
        .catch((err) => console.error(`[${name}] error disconnecting:`, err));
    }
    return Promise.resolve();
  }

  function isSignalRConnected() {
    return (
      state.isConnected &&
      state.connection &&
      state.connection.state === signalR.HubConnectionState.Connected
    );
  }

  function sendMessage(methodName, ...args) {
    if (state.connection && state.isConnected) {
      return state.connection
        .invoke(methodName, ...args)
        .then(() => console.log(`[${name}] message sent:`, methodName, args))
        .catch((err) => {
          console.error(`[${name}] error sending message:`, err);
          status('Error: Failed to send message');
          throw err;
        });
    }
    const error = new Error(`[${name}] SignalR is not connected. Message could not be sent.`);
    console.error(error.message);
    status('Error: SignalR not connected');
    return Promise.reject(error);
  }

  return {
    connect,
    disconnect,
    isSignalRConnected,
    sendMessage,
    getConnection: () => state.connection,
  };
}
