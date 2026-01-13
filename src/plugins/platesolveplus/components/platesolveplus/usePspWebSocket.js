import { ref } from 'vue';

export function usePspWebSocket({ wsUrl, pushLog, onEvent }) {
  const ws = ref(null);
  const wsConnected = ref(false);

  const wsReconnectTimer = ref(null);
  const wsBackoffMs = ref(500);
  const wsBackoffMaxMs = 10000;

  function scheduleWsReconnect() {
    if (wsReconnectTimer.value) return;

    const delay = wsBackoffMs.value;
    wsReconnectTimer.value = setTimeout(() => {
      wsReconnectTimer.value = null;
      connectWs(false);
    }, delay);

    wsBackoffMs.value = Math.min(wsBackoffMaxMs, Math.floor(wsBackoffMs.value * 1.8));
    pushLog?.('WS reconnect scheduled', { delayMs: delay });
  }

  function disconnectWs() {
    try {
      wsConnected.value = false;
      if (ws.value) {
        ws.value.onopen = null;
        ws.value.onclose = null;
        ws.value.onerror = null;
        ws.value.onmessage = null;
        ws.value.close();
      }
      ws.value = null;
    } catch {
      // ignore
    }
  }

  function connectWs(force = false) {
    if (!force && wsConnected.value) return;

    disconnectWs();

    try {
      const socket = new WebSocket(wsUrl.value);
      ws.value = socket;

      socket.onopen = () => {
        wsConnected.value = true;
        wsBackoffMs.value = 500;
        pushLog?.('WS connected');
      };

      socket.onclose = () => {
        wsConnected.value = false;
        pushLog?.('WS closed');
        scheduleWsReconnect();
      };

      socket.onerror = () => {
        pushLog?.('WS error');
      };

      socket.onmessage = (evt) => {
        let msg = null;
        try {
          msg = JSON.parse(evt.data);
        } catch {
          msg = { type: 'Raw', payload: { raw: evt.data } };
        }

        const type = msg?.type || 'Event';
        const payload = msg?.payload ?? {};
        pushLog?.(`WS ${type}`, payload);

        onEvent?.(type, payload);
      };
    } catch (e) {
      wsConnected.value = false;
      pushLog?.('WS connect failed', { error: e?.message ?? String(e) });
      scheduleWsReconnect();
    }
  }

  function cleanup() {
    if (wsReconnectTimer.value) clearTimeout(wsReconnectTimer.value);
    disconnectWs();
  }

  return {
    wsConnected,
    connectWs,
    disconnectWs,
    cleanup,
  };
}
