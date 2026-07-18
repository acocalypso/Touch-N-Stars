import { canonicalizeCelestiaAtlasDataUrl } from './celestiaAtlasSettingsMigration';

function normalizeBaseUrl(baseUrl) {
  const safeBaseUrl = (baseUrl || '').trim();
  if (!safeBaseUrl) return '';

  return safeBaseUrl.endsWith('/') ? safeBaseUrl : `${safeBaseUrl}/`;
}

function buildRelativeUrl(baseUrl, relativePath) {
  const normalizedRelative = (relativePath || '').replace(/^\.\//, '').replace(/^\//, '');
  return `${normalizeBaseUrl(baseUrl)}${normalizedRelative}`;
}

function normalizeLandscapeUrl(rawUrl, baseUrl) {
  const trimmedUrl = (rawUrl || '').trim();
  if (!trimmedUrl) return '';

  const canonicalUrl = canonicalizeCelestiaAtlasDataUrl(trimmedUrl);

  if (/^https?:\/\//i.test(canonicalUrl) || canonicalUrl.startsWith('/')) {
    return canonicalUrl;
  }

  return buildRelativeUrl(baseUrl, canonicalUrl);
}

export function resolveLandscapeSource(atlasSettings, baseUrl) {
  if (!atlasSettings?.landscapesVisible) {
    return {
      visible: false,
      source: null,
    };
  }

  if (atlasSettings.landscapeSourceMode === 'neutral') {
    return {
      visible: true,
      source: {
        url: buildRelativeUrl(baseUrl, 'landscapes/gray'),
        key: 'gray',
      },
    };
  }

  if (atlasSettings.landscapeSourceMode === 'custom') {
    const customUrl = normalizeLandscapeUrl(atlasSettings.customLandscapeUrl, baseUrl);
    const customKey = (atlasSettings.customLandscapeKey || 'custom').trim() || 'custom';

    if (customUrl) {
      return {
        visible: true,
        source: {
          url: customUrl,
          key: customKey,
        },
      };
    }
  }

  return {
    visible: true,
    source: {
      url: buildRelativeUrl(baseUrl, 'landscapes/guereins'),
      key: 'guereins',
    },
  };
}
