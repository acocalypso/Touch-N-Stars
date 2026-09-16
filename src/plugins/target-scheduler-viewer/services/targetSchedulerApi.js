import { useSettingsStore } from '@/store/settingsStore';

const PORT_STORAGE_KEY = 'tsviewer.port';
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

function baseUrl() {
  const settingsStore = useSettingsStore();
  const host = settingsStore.connection?.ip || window.location.hostname;
  const port = getStoredPort();
  return `http://${host}:${port}/ts/v0`;
}

async function getJson(path) {
  const res = await fetch(`${baseUrl()}${path}`);
  if (!res.ok) {
    throw new Error(`Target Scheduler API ${path} failed: HTTP ${res.status}`);
  }
  return res.json();
}

export const targetSchedulerApi = {
  getVersion: () => getJson('/version'),
  getProfiles: () => getJson('/profiles'),
  getProjects: (profileId) => getJson(`/profiles/${profileId}/projects`),
  getTargets: (projectId) => getJson(`/projects/${projectId}/targets`),
  getStatistics: (targetId) => getJson(`/targets/${targetId}/statistics`),
  getPreview: (profileId) => getJson(`/profiles/${profileId}/preview`),
};
