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

async function getJson(path, { signal } = {}) {
  const { host, port } = hostPort();
  const url = `${baseUrl()}${path}`;
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const requestSignal = signal ? AbortSignal.any([timeoutSignal, signal]) : timeoutSignal;

  let res;
  try {
    res = await fetch(url, { signal: requestSignal });
  } catch (e) {
    if (signal?.aborted) {
      throw new TargetSchedulerApiError('Connection attempt cancelled.', { kind: 'cancelled' });
    }
    if (e.name === 'TimeoutError') {
      throw new TargetSchedulerApiError(
        `Target Scheduler API at ${host}:${port} did not respond within ${REQUEST_TIMEOUT_MS / 1000}s. Check the port is correct and the host is reachable.`,
        { kind: 'timeout' }
      );
    }
    throw new TargetSchedulerApiError(
      `Can't reach Target Scheduler API at ${host}:${port}. Check the port is correct and the API is enabled in the Target Scheduler plugin options in NINA.`,
      { kind: 'unreachable' }
    );
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
