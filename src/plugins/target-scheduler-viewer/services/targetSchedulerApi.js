import { useSettingsStore } from '@/store/settingsStore';

const PORT_STORAGE_KEY = 'tsviewer.port';
const PROFILE_STORAGE_KEY = 'tsviewer.profileId';
const DEFAULT_PORT = '8188';

export function getStoredPort() {
  try {
    return localStorage.getItem(PORT_STORAGE_KEY) || DEFAULT_PORT;
  } catch {
    return DEFAULT_PORT;
  }
}

export function setStoredPort(port) {
  try {
    localStorage.setItem(PORT_STORAGE_KEY, String(port));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

const HEADER_COLLAPSED_KEY = 'tsviewer.headerCollapsed';

export function getStoredHeaderCollapsed() {
  try {
    return localStorage.getItem(HEADER_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setStoredHeaderCollapsed(collapsed) {
  try {
    localStorage.setItem(HEADER_COLLAPSED_KEY, String(collapsed));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

// Whether this browser has ever successfully connected — lets a first-run
// connection failure show setup guidance instead of a plain error, since
// "not configured yet" is the expected first-load state, not a fault.
const HAS_CONNECTED_KEY = 'tsviewer.hasConnected';

export function getStoredHasConnected() {
  try {
    return localStorage.getItem(HAS_CONNECTED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setStoredHasConnected() {
  try {
    localStorage.setItem(HAS_CONNECTED_KEY, 'true');
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function getStoredProfileId() {
  try {
    return localStorage.getItem(PROFILE_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredProfileId(profileId) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, profileId);
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

function hostPort() {
  const settingsStore = useSettingsStore();
  const host = settingsStore.connection?.ip || window.location.hostname;
  const port = getStoredPort();
  return { host, port };
}

function baseUrl() {
  const { host, port } = hostPort();
  return `http://${host}:${port}/ts/v0`;
}

const REQUEST_TIMEOUT_MS = 8000;

class TargetSchedulerApiError extends Error {
  constructor(message, { kind }) {
    super(message);
    this.kind = kind; // 'unreachable' | 'timeout' | 'http' | 'parse'
  }
}

// Built from a plain AbortController rather than AbortSignal.any()/
// AbortSignal.timeout() (Chrome 116+/Safari 17.4+) — those aren't available
// in every webview this app runs in, and a missing method there would throw
// before the request even starts. AbortController itself is much older
// (Safari 12.1+) and safe to rely on everywhere.
function raceAbort(externalSignal, timeoutMs) {
  const controller = new AbortController();
  let timedOut = false;
  let cancelled = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => {
    cancelled = true;
    controller.abort();
  };
  if (externalSignal) {
    if (externalSignal.aborted) {
      cancelled = true;
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort);
    }
  }

  return {
    signal: controller.signal,
    isTimedOut: () => timedOut,
    isCancelled: () => cancelled,
    cleanup() {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    },
  };
}

async function getJson(path, { signal } = {}) {
  const { host, port } = hostPort();
  const url = `${baseUrl()}${path}`;
  const race = raceAbort(signal, REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, { signal: race.signal });
  } catch (e) {
    if (race.isCancelled()) {
      throw new TargetSchedulerApiError('Connection attempt cancelled.', { kind: 'cancelled' });
    }
    if (race.isTimedOut()) {
      throw new TargetSchedulerApiError(
        `Target Scheduler API at ${host}:${port} did not respond within ${REQUEST_TIMEOUT_MS / 1000}s. Check the port is correct and the host is reachable.`,
        { kind: 'timeout' }
      );
    }
    throw new TargetSchedulerApiError(
      `Can't reach Target Scheduler API at ${host}:${port}. Check the port is correct and the API is enabled in the Target Scheduler plugin options in NINA.`,
      { kind: 'unreachable' }
    );
  } finally {
    race.cleanup();
  }

  if (!res.ok) {
    throw new TargetSchedulerApiError(
      `Target Scheduler API at ${host}:${port} returned HTTP ${res.status} for ${path}.`,
      { kind: 'http' }
    );
  }

  try {
    return await res.json();
  } catch {
    throw new TargetSchedulerApiError(
      `Target Scheduler API at ${host}:${port} returned an unreadable response for ${path}.`,
      { kind: 'parse' }
    );
  }
}

export const targetSchedulerApi = {
  getVersion: (opts) => getJson('/version', opts),
  getProfiles: (opts) => getJson('/profiles', opts),
  getProjects: (profileId, opts) => getJson(`/profiles/${profileId}/projects`, opts),
  getTargets: (projectId, opts) => getJson(`/projects/${projectId}/targets`, opts),
  getStatistics: (targetId, opts) => getJson(`/targets/${targetId}/statistics`, opts),
  getPreview: (profileId, opts) => getJson(`/profiles/${profileId}/preview`, opts),
};
