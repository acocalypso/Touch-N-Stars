import { computed, reactive } from 'vue';

function resolveDefaultHost(settingsStore) {
  return settingsStore?.connection?.ip?.trim() || window.location.hostname || '127.0.0.1';
}

export function usePspConfig(settingsStore, storageKey = 'platesolveplus:config:v1') {
  const cfg = reactive({
    host: resolveDefaultHost(settingsStore),
    port: 1899,
    basePath: '/api/platesolveplus',
    useToken: false,
    token: '',
  });

  const baseUrl = computed(() => {
    const host = cfg.host?.trim() || resolveDefaultHost(settingsStore);
    const port = Number(cfg.port) || 1899;
    const path = (cfg.basePath?.trim() || '/api/platesolveplus').replace(/^\/*/, '/');
    return `http://${host}:${port}${path}`;
  });

  const wsUrl = computed(() => {
    const host = cfg.host?.trim() || resolveDefaultHost(settingsStore);
    const port = Number(cfg.port) || 1899;

    let url = `ws://${host}:${port}/ws/platesolveplus`;
    if (cfg.useToken && cfg.token?.trim()) url += `?token=${encodeURIComponent(cfg.token.trim())}`;
    return url;
  });

  function authHeaders() {
    if (cfg.useToken && cfg.token?.trim()) return { 'X-PSP-Token': cfg.token.trim() };
    return {};
  }

  function saveConfig(pushLog) {
    const toSave = {
      host: cfg.host,
      port: cfg.port,
      basePath: cfg.basePath,
      useToken: cfg.useToken,
      token: cfg.token,
    };
    localStorage.setItem(storageKey, JSON.stringify(toSave));
    pushLog?.('Config saved', { host: cfg.host, port: cfg.port, useToken: cfg.useToken });
  }

  function loadConfig(pushLog) {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    const data = JSON.parse(raw);

    // gespeicherter Host gewinnt, sonst Auto-Host
    cfg.host = data.host?.trim() || resolveDefaultHost(settingsStore);

    cfg.port = data.port ?? cfg.port;
    cfg.basePath = data.basePath ?? cfg.basePath;
    cfg.useToken = !!data.useToken;
    cfg.token = data.token ?? cfg.token;

    pushLog?.('Config loaded', { host: cfg.host, port: cfg.port, useToken: cfg.useToken });
  }

  return {
    cfg,
    baseUrl,
    wsUrl,
    authHeaders,
    saveConfig,
    loadConfig,
  };
}
