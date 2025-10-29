import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import appVersion from '@/version';

const SUPPORTED_PLATFORMS = new Set(['android', 'ios']);
const GITHUB_API_BASE = 'https://api.github.com/repos/acocalypso/Touch-N-Stars';
const UPDATE_ASSET_NAME = 'dist.zip';

const defaultHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'touch-n-stars-updater',
};

function getPlatform() {
  try {
    return Capacitor.getPlatform();
  } catch (error) {
    console.warn('[Updater] Failed to resolve platform:', error);
    return 'web';
  }
}

export function isNativePlatform() {
  return SUPPORTED_PLATFORMS.has(getPlatform());
}

function sanitizeVersion(version) {
  if (!version) {
    return '';
  }

  const trimmed = version.trim();
  const withoutPrefix = trimmed.replace(/^v/gi, '');
  const match = withoutPrefix.match(/\d+(?:\.\d+)+/);
  if (match) {
    return match[0];
  }

  const fallback = withoutPrefix.split(/[-+]/)[0];
  return fallback ? fallback.trim() : '';
}

function compareVersions(remote, local) {
  const remoteParts = sanitizeVersion(remote)
    .split('.')
    .map((segment) => Number.parseInt(segment, 10) || 0);
  const localParts = sanitizeVersion(local)
    .split('.')
    .map((segment) => Number.parseInt(segment, 10) || 0);
  const maxLength = Math.max(remoteParts.length, localParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const remoteSegment = remoteParts[index] ?? 0;
    const localSegment = localParts[index] ?? 0;
    if (remoteSegment > localSegment) {
      return 1;
    }
    if (remoteSegment < localSegment) {
      return -1;
    }
  }

  return 0;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: defaultHeaders });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request to ${url} failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function fetchLatestRelease() {
  try {
    const release = await fetchJson(`${GITHUB_API_BASE}/releases/latest`);
    if (!release || release.draft || release.prerelease) {
      return null;
    }

    const asset = Array.isArray(release.assets)
      ? release.assets.find((item) => item?.name === UPDATE_ASSET_NAME)
      : null;

    if (!asset || !asset.browser_download_url) {
      throw new Error(`Release ${release.tag_name} does not expose ${UPDATE_ASSET_NAME}`);
    }

    const normalizedVersion = sanitizeVersion(release.tag_name || release.name);
    if (!normalizedVersion) {
      console.warn('[Updater] Skipping release with unparseable version:', release.tag_name);
      return null;
    }

    return {
      tagName: release.tag_name,
      version: normalizedVersion,
      name: release.name || release.tag_name,
      notes: release.body || '',
      assetUrl: asset.browser_download_url,
      publishedAt: release.published_at,
    };
  } catch (error) {
    console.warn('[Updater] Failed to resolve latest release:', error);
    return null;
  }
}

export async function checkForManualUpdate(currentVersion = appVersion) {
  if (!isNativePlatform()) {
    return { available: false, reason: 'non-native-platform' };
  }

  const latestRelease = await fetchLatestRelease();
  if (!latestRelease) {
    return { available: false, reason: 'no-release' };
  }

  if (compareVersions(latestRelease.version, currentVersion) <= 0) {
    return { available: false, reason: 'no-newer-version' };
  }

  return {
    available: true,
    version: latestRelease.version,
    tagName: latestRelease.tagName,
    name: latestRelease.name,
    notes: latestRelease.notes,
    downloadUrl: latestRelease.assetUrl,
    publishedAt: latestRelease.publishedAt,
  };
}

export async function downloadAndApplyUpdate(options) {
  const { version, downloadUrl, onProgress, onPreparing } = options;

  if (!isNativePlatform()) {
    throw new Error('Updates are only supported on native platforms');
  }

  if (!version || !downloadUrl) {
    throw new Error('Missing download metadata');
  }

  let listener;
  try {
    listener = await CapacitorUpdater.addListener('download', (event) => {
      if (event?.bundle?.version !== version) {
        return;
      }
      if (typeof onProgress === 'function') {
        onProgress(event.percent ?? 0);
      }
    });
  } catch (error) {
    console.warn('[Updater] Failed to attach download listener:', error);
  }

  try {
    const bundle = await CapacitorUpdater.download({
      version,
      url: downloadUrl,
    });

    if (!bundle?.id) {
      throw new Error('Download completed without a valid bundle identifier');
    }

    if (typeof onPreparing === 'function') {
      onPreparing();
    }

    await CapacitorUpdater.set({ id: bundle.id });
    return bundle;
  } finally {
    if (listener?.remove) {
      try {
        await listener.remove();
      } catch (removeError) {
        console.warn('[Updater] Failed to remove download listener:', removeError);
      }
    }
  }
}

export async function markAppReady() {
  if (!isNativePlatform()) {
    return;
  }
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch (error) {
    console.warn('[Updater] notifyAppReady failed:', error);
  }
}
