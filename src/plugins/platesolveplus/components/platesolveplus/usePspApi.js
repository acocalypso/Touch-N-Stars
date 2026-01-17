export function usePspApi({ baseUrl, authHeaders, pushLog }) {
  function mergeHeaders(options) {
    return {
      ...(options?.headers || {}),
      ...(authHeaders?.() || {}),
    };
  }

  async function apiFetch(path, options = {}) {
    const url = `${baseUrl.value}${path}`;
    const headers = mergeHeaders(options);

    const resp = await fetch(url, { ...options, headers });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status} ${resp.statusText}${text ? ` — ${text}` : ''}`);
    }
    return resp;
  }

  // For endpoints outside baseUrl (e.g. /api/health)
  async function apiFetchAbsolute(url, options = {}) {
    const headers = mergeHeaders(options);
    const resp = await fetch(url, { ...options, headers });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status} ${resp.statusText}${text ? ` — ${text}` : ''}`);
    }
    return resp;
  }

  function buildApiRootUrl() {
    // baseUrl = http://host:port/api/platesolveplus  -> apiRoot = http://host:port/api
    const u = new URL(baseUrl.value);
    u.pathname = '/api';
    return u.toString().replace(/\/$/, '');
  }

  async function refreshStatus({ status, lastStatusTs, loadingStatus }) {
    loadingStatus.value = true;
    try {
      const resp = await apiFetch('/status', { method: 'GET' });
      const data = await resp.json();

      status.busy = !!data.busy;
      status.importsReady = !!data.importsReady;
      status.mountConnected = !!data.mountConnected;
      status.mountState = data.mountState ?? null;
      //status.secondaryConnected = !!data.secondaryConnected;

      status.statusText = data.statusText ?? null;
      status.detailsText = data.detailsText ?? null;
      status.lastSolveSummary = data.lastSolveSummary ?? null;
      status.lastGuiderSolveText = data.lastGuiderSolveText ?? null;
      status.correctedSolveText = data.correctedSolveText ?? null;

      status.offsetEnabled = !!data.offsetEnabled;
      status.offsetMode = data.offsetMode ?? null;
      status.offsetRaArcsec = data.offsetRaArcsec ?? null;
      status.offsetDecArcsec = data.offsetDecArcsec ?? null;
      status.rotation = data.rotation ?? null;

      lastStatusTs.value = Date.now();
      // pushLog?.('Status refreshed');
    } catch (e) {
      pushLog?.('Status refresh failed', { error: e?.message ?? String(e) });
    } finally {
      loadingStatus.value = false;
    }
  }

  async function refreshSettings({ settings, loadingSettings, lastSettingsTs }) {
    if (!settings) return;
    if (loadingSettings) loadingSettings.value = true;
    try {
      const resp = await apiFetch('/settings', { method: 'GET' });
      const data = await resp.json();

      // camera
      settings.camera = data.camera ?? null;
      // scope
      settings.scope = data.scope ?? null;
      // platesolve
      settings.platesolve = data.platesolve ?? null;

      if (lastSettingsTs) lastSettingsTs.value = Date.now();
    } catch (e) {
      pushLog?.('Settings refresh failed', { error: e?.message ?? String(e) });
    } finally {
      if (loadingSettings) loadingSettings.value = false;
    }
  }

  /**
   * Update plugin settings via PUT /settings.
   * Supports partial updates, e.g. { camera: { exposureSeconds: 2.0 }, platesolve: { centeringThresholdArcmin: 1.0 } }
   */
  async function putSettings(payload) {
    try {
      const resp = await apiFetch('/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload ?? {}),
      });
      const data = await resp.json().catch(() => ({}));
      pushLog?.('Settings updated', data);
      return data;
    } catch (e) {
      pushLog?.('Settings update failed', { error: e?.message ?? String(e) });
      throw e;
    }
  }

  async function triggerCapture({ activeJobId, refreshPreview, refreshStatusFn }) {
    try {
      pushLog?.('Capture requested');
      const resp = await apiFetch('/capture', { method: 'POST' });
      const data = await resp.json().catch(() => ({}));

      activeJobId.value = data.jobId ?? activeJobId.value;
      pushLog?.('Capture accepted', data);

      setTimeout(() => refreshPreview?.(true), 500);
      setTimeout(() => refreshStatusFn?.(), 700);
    } catch (e) {
      pushLog?.('Capture failed', { error: e?.message ?? String(e) });
    }
  }

  async function triggerSolve({ activeJobId, status, progress }) {
    try {
      pushLog?.('Solve requested');
      const resp = await apiFetch('/solve', { method: 'POST' });
      const data = await resp.json().catch(() => ({}));

      activeJobId.value = data.jobId ?? activeJobId.value;
      status.busy = true;

      progress.stage = 'queued';
      progress.message = 'Solve accepted (waiting for events)';
      progress.percent = 1;

      pushLog?.('Solve accepted', data);
    } catch (e) {
      pushLog?.('Solve failed', { error: e?.message ?? String(e) });
    }
  }

  async function triggerSync({ activeJobId, status, progress }) {
    try {
      pushLog?.('Solve+Sync requested');
      const resp = await apiFetch('/sync', { method: 'POST' });
      const data = await resp.json().catch(() => ({}));

      activeJobId.value = data.jobId ?? activeJobId.value;
      status.busy = true;

      progress.stage = 'queued';
      progress.message = 'Solve+Sync accepted (waiting for events)';
      progress.percent = 1;

      pushLog?.('Solve+Sync accepted', data);
    } catch (e) {
      pushLog?.('Solve+Sync failed', { error: e?.message ?? String(e) });
    }
  }

  async function triggerCenter({ activeJobId, status, progress }) {
    try {
      pushLog?.('Center+Solve requested');
      const resp = await apiFetch('/center', { method: 'POST' });
      const data = await resp.json().catch(() => ({}));

      activeJobId.value = data.jobId ?? activeJobId.value;
      status.busy = true;

      progress.stage = 'queued';
      progress.message = 'Center+Solve accepted (waiting for events)';
      progress.percent = 1;

      pushLog?.('Center+Solve accepted', data);
    } catch (e) {
      pushLog?.('Center+Solve failed', { error: e?.message ?? String(e) });
    }
  }

  async function calibrateOffset({ activeJobId }) {
    try {
      pushLog?.('Offset calibrate requested');
      const resp = await apiFetch('/offset/calibrate', { method: 'POST' });
      const data = await resp.json().catch(() => ({}));

      activeJobId.value = data.jobId ?? activeJobId.value;
      pushLog?.('Offset calibrate accepted', data);
    } catch (e) {
      pushLog?.('Offset calibrate failed', { error: e?.message ?? String(e) });
    }
  }

  async function resetOffsets({ activeJobId }) {
    pushLog?.('Offset reset requested');
    try {
      const resp = await apiFetch('/offset/reset', { method: 'POST' });
      const data = await resp.json().catch(() => ({}));
      activeJobId.value = data.jobId ?? activeJobId.value;
      pushLog?.('Offset reset accepted', data);
      return { ok: true, data };
    } catch (e) {
      pushLog?.('Offset reset failed', { error: e?.message ?? String(e) });
      return { ok: false };
    }
  }

  async function resetRotationOffset({ activeJobId }) {
    pushLog?.('Rotation offset reset requested');
    try {
      const resp = await apiFetch('/offset/reset-rotation', { method: 'POST' });
      const data = await resp.json().catch(() => ({}));
      activeJobId.value = data.jobId ?? activeJobId.value;
      pushLog?.('Rotation offset reset accepted', data);
      return { ok: true, data };
    } catch (e) {
      pushLog?.('Rotation offset reset failed', { error: e?.message ?? String(e) });
      return { ok: false };
    }
  }

  // ----------------------------
  // Secondary Camera API
  // ----------------------------
  async function getSecondaryDrivers() {
    const resp = await apiFetch('/secondary/drivers', { method: 'GET' });
    return resp.json();
  }

  async function getSecondarySelection() {
    const resp = await apiFetch('/secondary/selection', { method: 'GET' });
    return resp.json();
  }

  async function setSecondarySelection(progId) {
    const resp = await apiFetch('/secondary/selection', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progId }),
    });
    return resp.json();
  }

  async function secondaryConnect() {
    const resp = await apiFetch('/secondary/connect', { method: 'POST' });
    return resp.json();
  }

  async function secondaryDisconnect() {
    const resp = await apiFetch('/secondary/disconnect', { method: 'POST' });
    return resp.json();
  }

  async function secondarySetupDialog() {
    const resp = await apiFetch('/secondary/setup-dialog', { method: 'POST' });
    return resp.json();
  }

  async function testConnection({ testResult }) {
    testResult.value = null;
    try {
      // preferred: /api/health (outside /api/platesolveplus)
      const apiRoot = buildApiRootUrl();
      const resp = await apiFetchAbsolute(`${apiRoot}/health`, { method: 'GET' });
      const data = await resp.json().catch(() => ({}));

      testResult.value = {
        ok: true,
        message: `OK — ${data?.service ?? 'service'} @ ${data?.utc ?? ''}`,
      };
      pushLog?.('Connection test OK (/api/health)');
    } catch (e1) {
      // fallback: old /status
      try {
        const resp2 = await apiFetch('/status', { method: 'GET' });
        const data2 = await resp2.json().catch(() => ({}));
        testResult.value = {
          ok: true,
          message: `OK — importsReady=${!!data2.importsReady}, secondaryConnected=${!!data2.secondaryConnected}, mountConnected=${!!data2.mountConnected}`,
        };
        pushLog?.('Connection test OK (/status fallback)');
      } catch (e2) {
        testResult.value = { ok: false, message: `FAILED — ${e2?.message ?? String(e2)}` };
        pushLog?.('Connection test failed', { error: e2?.message ?? String(e2) });
      }
    }
  }

  return {
    apiFetch,
    apiFetchAbsolute,
    refreshStatus,
    refreshSettings,
    putSettings,
    triggerCapture,
    triggerSolve,
    triggerSync,
    triggerCenter,
    calibrateOffset,
    resetOffsets,
    resetRotationOffset,
    testConnection,

    // secondary camera
    getSecondaryDrivers,
    getSecondarySelection,
    setSecondarySelection,
    secondaryConnect,
    secondaryDisconnect,
    secondarySetupDialog,
  };
}
