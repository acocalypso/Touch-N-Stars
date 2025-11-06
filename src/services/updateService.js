import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import appVersion from '@/version';
import { useSettingsStore } from '@/store/settingsStore';

const settingsStore = useSettingsStore();

let SUPPORTED_PLATFORMS = new Set(['android', 'ios']);
let GITHUB_API_BASE = 'https://api.github.com/repos/Touch-N-Stars/Touch-N-Stars';
let UPDATE_ASSET_NAME = 'dist.zip';
let CHANGELOG_RAW_URL =
  'https://raw.githubusercontent.com/Touch-N-Stars/Touch-N-Stars/master/CHANGELOG.md';

if (settingsStore.useBetaFeatures) {
  GITHUB_API_BASE = 'https://api.github.com/repos/JohannesWorks/Touch-N-Stars';
  CHANGELOG_RAW_URL =
    'https://raw.githubusercontent.com/JohannesWorks/Touch-N-Stars/refs/heads/master/CHANGELOG.md';
  console.log('[Updater] Beta features enabled: using beta update channels');
}

const defaultHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'touch-n-stars-updater',
};

function buildHeaders(acceptType, options = {}) {
  const { includeUserAgent = true } = options;
  const headers = { ...defaultHeaders };
  if (!includeUserAgent) {
    delete headers['User-Agent'];
  }
  if (acceptType) {
    headers.Accept = acceptType;
  }
  return headers;
}

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

    const assets = Array.isArray(release.assets) ? release.assets : [];
    console.info(
      '[Updater] Release assets found:',
      assets.map((assetItem) => assetItem?.name).filter(Boolean)
    );
    const asset = assets.find((item) => item?.name === UPDATE_ASSET_NAME) || null;

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

function extractLatestChangelogSection(markdown) {
  if (!markdown) {
    return null;
  }

  const lines = markdown.split(/\r?\n/);
  let startIdx = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].startsWith('## [')) {
      startIdx = index;
      break;
    }
  }

  if (startIdx === -1) {
    return null;
  }

  let endIdx = lines.length;
  for (let index = startIdx + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith('## [')) {
      endIdx = index;
      break;
    }
  }

  const sectionLines = lines.slice(startIdx, endIdx);
  const heading = sectionLines[0]?.trim() ?? '';
  const match = heading.match(/^## \[(.+?)\]\s*-\s*(.+)$/);
  const version = match ? match[1].trim() : 'unknown';
  const date = match ? match[2].trim() : '';
  const bodyLines = sectionLines.slice(1);

  while (bodyLines.length && !bodyLines[0].trim()) {
    bodyLines.shift();
  }
  while (bodyLines.length && !bodyLines[bodyLines.length - 1].trim()) {
    bodyLines.pop();
  }

  const markdownOut = [heading, '', ...bodyLines].join('\n');
  return {
    version,
    date,
    heading,
    bodyLines,
    markdown: markdownOut,
  };
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function changelogLinesToHtml(lines, heading) {
  const parts = [];

  if (heading) {
    const titleText = heading.replace(/^##\s*/, '');
    parts.push(`<h2 class="text-xl sm:text-2xl font-bold mb-3">${escapeHtml(titleText)}</h2>`);
  }

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      parts.push(
        `<h3 class="text-lg sm:text-xl font-semibold mt-4 mb-2">${escapeHtml(line.slice(4))}</h3>`
      );
      index += 1;
      continue;
    }

    if (line.startsWith('- ')) {
      const items = [];
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push(lines[index].slice(2));
        index += 1;
      }
      const listItems = items
        .map(
          (item) =>
            `<li class="ml-4 list-disc"><span class="align-middle">${escapeHtml(item)}</span></li>`
        )
        .join('');
      parts.push(`<ul class="pl-5 space-y-1">${listItems}</ul>`);
      continue;
    }

    parts.push(`<p class="mb-2">${escapeHtml(line)}</p>`);
    index += 1;
  }

  return parts.join('\n');
}

export async function fetchChangelogWhatsNew() {
  // Mirror the CLI generator to render the latest CHANGELOG entry for the update modal.
  try {
    console.info('[Updater] Fetching latest changelog entry');
    const response = await fetch(CHANGELOG_RAW_URL, {
      headers: buildHeaders('text/plain', { includeUserAgent: false }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const markdown = await response.text();
    const section = extractLatestChangelogSection(markdown);
    if (!section) {
      throw new Error('CHANGELOG.md does not contain a valid release section');
    }

    const html = changelogLinesToHtml(section.bodyLines, section.heading);
    const titleBase = `What's New in ${section.version}`;
    const title = section.date ? `${titleBase} (${section.date})` : titleBase;

    return {
      version: section.version,
      date: section.date,
      title,
      html,
      markdown: section.markdown,
    };
  } catch (error) {
    console.warn('[Updater] Failed to load changelog whats-new content:', error?.message ?? error);
    return null;
  }
}
