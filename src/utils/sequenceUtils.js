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
  const target = coords.Coordinates || coords;
  if (coords.AltDegrees) {
    return `Altitude: ${coords.AltDegrees ?? 0}d ${coords.AltMinutes ?? 0}m ${coords.AltSeconds ?? 0}s`;
  }
  return (
    `RA: ${target.RAString} ` ||
    `RA: ${target.RAHours ?? 0}h ${target.RAMinutes ?? 0}m ${target.RASeconds ?? 0}s`
  );
}

export function formatDec(coords) {
  const target = coords.Coordinates || coords;
  const sign = target.NegativeDec ? 'S' : 'N';
  if (coords.AzDegrees) {
    return `Azimuth: ${coords.AzDegrees ?? 0}d ${coords.AzMinutes ?? 0}m ${coords.AzSeconds ?? 0}s`;
  }
  return (
    `DEC: ${target.DecString}` ||
    `DEC: ${target.DecDegrees ?? 0}° ${target.DecMinutes ?? 0}' ${target.DecSeconds ?? 0}" ${sign}`
  );
}

export function hasRunningChildren(item) {
  return item.Items?.some((child) => child.Status === 'RUNNING' || hasRunningChildren(child));
}
