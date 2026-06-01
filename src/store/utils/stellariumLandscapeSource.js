function normalizeLandscapeUrl(rawUrl, baseUrl) {
  const trimmedUrl = (rawUrl || '').trim();
  if (!trimmedUrl) return '';

  if (/^https?:\/\//i.test(trimmedUrl) || trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }

  return `${baseUrl}${trimmedUrl.replace(/^\.\//, '')}`;
}

export function resolveLandscapeSource(stellariumSettings, baseUrl) {
  if (!stellariumSettings?.landscapesVisible) {
    return {
      visible: false,
      source: null,
    };
  }

  if (stellariumSettings.landscapeSourceMode === 'neutral') {
    return {
      visible: true,
      source: {
        url: `${baseUrl}landscapes/gray`,
        key: 'gray',
      },
    };
  }

  if (stellariumSettings.landscapeSourceMode === 'custom') {
    const customUrl = normalizeLandscapeUrl(stellariumSettings.customLandscapeUrl, baseUrl);
    const customKey = (stellariumSettings.customLandscapeKey || 'custom').trim() || 'custom';

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
      url: `${baseUrl}landscapes/guereins`,
      key: 'guereins',
    },
  };
}
