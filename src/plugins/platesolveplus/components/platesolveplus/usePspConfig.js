import { computed, reactive } from 'vue';

export function usePspConfig(storageKey = 'platesolveplus:config:v1') {
  const cfg = reactive({
    host: '127.0.0.1',
    port: 1899,
    basePath: '/api/platesolveplus',
    useToken: false,
    token: '',
  });

  const baseUrl = computed(() => {
    const host = cfg.host?.trim() || '127.0.0.1';
    const port = Number(cfg.port) || 1899;
    const path = cfg.basePath?.trim() || '/api/platesolveplus';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `http://${host}:${port}${normalizedPath}`;
  });

  const wsUrl = computed(() => {
    const host = cfg.host?.trim() || '127.0.0.1';
    const port = Number(cfg.port) || 1899;
    return `ws://${host}:${port}/ws/platesolveplus`;
  });

  function authHeaders() {
    // Dein API Host erwartet X-PSP-Token (optional)
    if (cfg.useToken && cfg.token?.trim()) {
      return { 'X-PSP-Token': cfg.token.trim() };
    }
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
    cfg.host = data.host ?? cfg.host;
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
