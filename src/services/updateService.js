import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import appVersion from '@/version';
import { useSettingsStore } from '@/store/settingsStore';

let SUPPORTED_PLATFORMS = new Set(['android', 'ios']);
let UPDATE_ASSET_NAME = 'dist.zip';

function getGithubApiBase() {
  try {
    const settingsStore = useSettingsStore();
    if (settingsStore?.useBetaFeatures) {
      console.log('[Updater] Beta features enabled: using beta update channels');
      return 'https://api.github.com/repos/JohannesWorks/Touch-N-Stars';
    }
  } catch (error) {
    // Store not initialized yet, use default
  }
  return 'https://api.github.com/repos/Touch-N-Stars/Touch-N-Stars';
}

function getChangelogRawUrl() {
  try {
    const settingsStore = useSettingsStore();
    if (settingsStore?.useBetaFeatures) {
      return 'https://raw.githubusercontent.com/JohannesWorks/Touch-N-Stars/refs/heads/master/CHANGELOG.md';
    }
  } catch (error) {
    // Store not initialized yet, use default
  }
  return 'https://raw.githubusercontent.com/Touch-N-Stars/Touch-N-Stars/master/CHANGELOG.md';
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

function parseVersion(version) {
  if (!version) {
    return { major: 0, minor: 0, patch: 0, prerelease: [], prereleaseParts: [] };
  }

  const trimmed = version.trim();
  const withoutPrefix = trimmed.replace(/^v/gi, '');

  // Split version and pre-release parts (e.g., "4.0.0-beta.1" -> ["4.0.0", "beta.1"])
  const [corePart, ...prereleaseParts] = withoutPrefix.split(/[-+]/);

  // Extract major.minor.patch
  const match = corePart.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) {
    return { major: 0, minor: 0, patch: 0, prerelease: [], prereleaseParts: [] };
  }

  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt(match[2], 10) || 0;
  const patch = Number.parseInt(match[3], 10) || 0;

  // Parse pre-release identifiers (e.g., "beta.1" -> ["beta", "1"])
  const prereleasePart = prereleaseParts.join('-');
  const prerelease = prereleasePart ? prereleasePart.split('.') : [];

  return {
    major,
    minor,
    patch,
    prerelease,
    prereleaseParts,
  };
}

function compareVersions(remote, local) {
  const remoteVersion = parseVersion(remote);
  const localVersion = parseVersion(local);

  // Compare major.minor.patch
  if (remoteVersion.major !== localVersion.major) {
    return remoteVersion.major > localVersion.major ? 1 : -1;
  }
  if (remoteVersion.minor !== localVersion.minor) {
    return remoteVersion.minor > localVersion.minor ? 1 : -1;
  }
  if (remoteVersion.patch !== localVersion.patch) {
    return remoteVersion.patch > localVersion.patch ? 1 : -1;
  }

  // When core versions are equal, compare pre-release versions
  const remoteHasPrerelease = remoteVersion.prerelease.length > 0;
  const localHasPrerelease = localVersion.prerelease.length > 0;

  // Version without pre-release is greater than with pre-release (4.0.0 > 4.0.0-beta.1)
  if (remoteHasPrerelease && !localHasPrerelease) {
    return -1; // remote has pre-release, local doesn't: remote is less
  }
  if (!remoteHasPrerelease && localHasPrerelease) {
    return 1; // remote doesn't have pre-release, local does: remote is greater
  }

  // Both have pre-release: compare identifiers
  if (remoteHasPrerelease && localHasPrerelease) {
    const maxLength = Math.max(remoteVersion.prerelease.length, localVersion.prerelease.length);
    for (let i = 0; i < maxLength; i += 1) {
      const remotePart = remoteVersion.prerelease[i] ?? '';
      const localPart = localVersion.prerelease[i] ?? '';

      // Try numeric comparison first
      const remoteNum = Number.parseInt(remotePart, 10);
      const localNum = Number.parseInt(localPart, 10);
      const remoteIsNum = !Number.isNaN(remoteNum);
      const localIsNum = !Number.isNaN(localNum);

      if (remoteIsNum && localIsNum) {
        if (remoteNum !== localNum) {
          return remoteNum > localNum ? 1 : -1;
        }
      } else if (remoteIsNum !== localIsNum) {
        // Numbers are less than non-numbers
        return remoteIsNum ? -1 : 1;
      } else {
        // Both are strings: lexical comparison
        if (remotePart !== localPart) {
          return remotePart > localPart ? 1 : -1;
        }
      }
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
    const release = await fetchJson(`${getGithubApiBase()}/releases/latest`);
    if (!release || release.draft) {
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

    const versionString = release.tag_name || release.name;
    const parsedVersion = parseVersion(versionString);
    const normalizedVersion = `${parsedVersion.major}.${parsedVersion.minor}.${parsedVersion.patch}${
      parsedVersion.prerelease.length > 0 ? `-${parsedVersion.prerelease.join('.')}` : ''
    }`;

    if (!normalizedVersion || normalizedVersion === '0.0.0') {
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
      isPrerelease: release.prerelease,
    };
  } catch (error) {
    console.warn('[Updater] Failed to resolve latest release:', error);
    return null;
  }
}

export async function checkForManualUpdate(currentVersion = appVersion, options = {}) {
  const { allowDowngrade = false } = options;

  console.log('[Updater] checkForManualUpdate called with:', {
    currentVersion,
    allowDowngrade,
  });

  if (!isNativePlatform()) {
    return { available: false, reason: 'non-native-platform' };
  }

  const latestRelease = await fetchLatestRelease();
  if (!latestRelease) {
    return { available: false, reason: 'no-release' };
  }

  const versionComparison = compareVersions(latestRelease.version, currentVersion);
  console.log('[Updater] Version comparison:', {
    latestVersion: latestRelease.version,
    currentVersion,
    comparison: versionComparison,
    allowDowngrade,
  });

  // If not allowing downgrades, skip if version is not newer
  if (!allowDowngrade && versionComparison <= 0) {
    console.log('[Updater] No update: version not newer and downgrade not allowed');
    return { available: false, reason: 'no-newer-version' };
  }

  // If versions are identical, no update needed
  if (versionComparison === 0) {
    console.log('[Updater] No update: same version');
    return { available: false, reason: 'same-version' };
  }

  // If downgrade is allowed or version is newer, return available
  const isDowngrade = versionComparison < 0;
  console.log('[Updater] Update available:', {
    version: latestRelease.version,
    isDowngrade,
  });

  return {
    available: true,
    version: latestRelease.version,
    tagName: latestRelease.tagName,
    name: latestRelease.name,
    notes: latestRelease.notes,
    downloadUrl: latestRelease.assetUrl,
    publishedAt: latestRelease.publishedAt,
    isDowngrade,
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
    const response = await fetch(getChangelogRawUrl(), {
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
