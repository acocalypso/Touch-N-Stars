export function usePspApi({ baseUrl, authHeaders, pushLog }) {
  async function apiFetch(path, options = {}) {
    const url = `${baseUrl.value}${path}`;
    const headers = {
      ...(options.headers || {}),
      ...(authHeaders?.() || {}),
    };

    const resp = await fetch(url, { ...options, headers });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status} ${resp.statusText}${text ? ` � ${text}` : ''}`);
    }
    return resp;
  }

  async function refreshStatus({ status, lastStatusTs, loadingStatus }) {
    loadingStatus.value = true;
    try {
      const resp = await apiFetch('/status', { method: 'GET' });
      const data = await resp.json();

      status.busy = !!data.busy;
      status.importsReady = !!data.importsReady;
      status.mountConnected = !!data.mountConnected;
      status.secondaryConnected = !!data.secondaryConnected;

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
      pushLog?.('Status refreshed');
    } catch (e) {
      pushLog?.('Status refresh failed', { error: e?.message ?? String(e) });
    } finally {
      loadingStatus.value = false;
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

  async function triggerSolve({ activeJobId, status, progress, startFakeSolveProgress }) {
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

      startFakeSolveProgress?.();
    } catch (e) {
      pushLog?.('Solve failed', { error: e?.message ?? String(e) });
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

  async function testConnection({ testResult }) {
    testResult.value = null;
    try {
      const resp = await apiFetch('/Status', { method: 'GET' });
      const data = await resp.json();
      testResult.value = {
        ok: true,
        message: `OK � importsReady=${!!data.importsReady}, secondaryConnected=${!!data.secondaryConnected}, mountConnected=${!!data.mountConnected}`,
      };
      pushLog?.('Connection test OK');
    } catch (e) {
      testResult.value = { ok: false, message: `FAILED � ${e?.message ?? String(e)}` };
      pushLog?.('Connection test failed', { error: e?.message ?? String(e) });
    }
  }

  return {
    apiFetch,
    refreshStatus,
    triggerCapture,
    triggerSolve,
    calibrateOffset,
    testConnection,
  };
}
