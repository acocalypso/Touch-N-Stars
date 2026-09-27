// NINA-API can return Comparator either as numeric enum or as string name
// (e.g. "LESS_THAN"). Normalize to the numeric form used by the UI.
const COMPARATOR_NAME_TO_VALUE = {
  EQUALS: 0,
  LESS_THAN: 1,
  LESS_THAN_OR_EQUAL: 2,
  GREATER_THAN: 3,
  GREATER_THAN_OR_EQUAL: 4,
};

export function normalizeComparator(raw) {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    if (raw in COMPARATOR_NAME_TO_VALUE) return COMPARATOR_NAME_TO_VALUE[raw];
    const n = Number(raw);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

export function removeSuffix(name) {
  if (!name) return '';
  return name.replace(/_Trigger$|_Container$|_Conditions$|_Condition$/, '');
}

export function formatDuration(durationString) {
  const [h, m, s] = durationString.split('.')[0].split(':');
  return `${h}h ${m}m ${s}s`;
}

export function formatTimeSpan(timeSpan) {
  if (timeSpan === 24) {
    return '24h 00m 00s';
  }

  // Calculate duration in milliseconds
  const durationMs = timeSpan * 60 * 60 * 1000;

  // Get the hours, minutes, and seconds
  const hours = Math.floor(durationMs / (60 * 60 * 1000));
  const minutes = Math.floor((durationMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((durationMs % (60 * 1000)) / 1000);

  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

export function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatRA(coords) {
  if (!coords) return 'RA: undefined';
  const target = coords.Coordinates || coords;
  if (coords.AltDegrees !== undefined) {
    return `Altitude: ${coords.AltDegrees ?? 0}d ${coords.AltMinutes ?? 0}m ${coords.AltSeconds ?? 0}s`;
  }
  if (
    !target ||
    (target.RAHours === undefined &&
      target.RAMinutes === undefined &&
      target.RASeconds === undefined)
  ) {
    return 'RA: undefined';
  }
  return target.RAString
    ? `RA: ${target.RAString}`
    : `RA: ${target.RAHours ?? 0}h ${target.RAMinutes ?? 0}m ${target.RASeconds ?? 0}s`;
}

export function formatDec(coords) {
  if (!coords) return 'DEC: undefined';
  const target = coords.Coordinates || coords;
  if (coords.AzDegrees !== undefined) {
    return `Azimuth: ${coords.AzDegrees ?? 0}d ${coords.AzMinutes ?? 0}m ${coords.AzSeconds ?? 0}s`;
  }
  if (
    !target ||
    (target.DecDegrees === undefined &&
      target.DecMinutes === undefined &&
      target.DecSeconds === undefined)
  ) {
    return 'DEC: undefined';
  }
  const sign = target.NegativeDec ? 'S' : 'N';
  return target.DecString
    ? `DEC: ${target.DecString}`
    : `DEC: ${target.DecDegrees ?? 0}° ${target.DecMinutes ?? 0}' ${target.DecSeconds ?? 0}" ${sign}`;
}

// ninaAPI's /sequence/json flattens Smart Exposure and Take Many Exposures: the exposure
// settings of their hidden Take Exposure child are reported on the container itself. The
// /sequence/edit endpoint resolves paths against the real object tree, so those settings
// must be addressed on the child. NINA creates Smart Exposure as [SwitchFilter, TakeExposure]
// and Take Many Exposures as [TakeExposure]. Detection uses the reported keys because the
// item Name is localized by NINA.
const TAKE_EXPOSURE_KEYS = new Set(['ExposureTime', 'Gain', 'Offset']);

function takeExposureChildIndex(item) {
  if (item.DitherTargetExposures !== undefined) return 1;
  if (item.ExposureTime !== undefined && item.Iterations !== undefined && !item.Items) return 0;
  return null;
}

export function sequenceEditPath(item, key) {
  const childIndex = TAKE_EXPOSURE_KEYS.has(key) ? takeExposureChildIndex(item) : null;
  return childIndex === null ? `${item._path}-${key}` : `${item._path}-Items-${childIndex}-${key}`;
}

export function hasRunningChildren(item) {
  return item.Items?.some((child) => child.Status === 'RUNNING' || hasRunningChildren(child));
}
