export function formatDuration(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatDurationH(seconds) {
  if (!seconds) return '0m';
  const h = seconds / 3600;
  if (h >= 1) return `${h.toFixed(1)}h`;
  return `${Math.round(seconds / 60)}m`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatHistoryDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatSessionLabel(s) {
  if (!s) return '';
  const date = s.SessionDate ? new Date(s.SessionDate).toLocaleDateString() : s.SessionId;
  const label = s.DisplayLabel || s.Title || date;
  return label.length > 80 ? label.substring(0, 80) + '…' : label;
}

export function formatRA(hours) {
  const h = Math.floor(hours);
  const mFrac = (hours - h) * 60;
  const m = Math.floor(mFrac);
  const s = Math.round((mFrac - m) * 60);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export function formatDec(deg) {
  const sign = deg >= 0 ? '+' : '-';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mFrac = (abs - d) * 60;
  const m = Math.floor(mFrac);
  const s = Math.round((mFrac - m) * 60);
  return `${sign}${String(d).padStart(2, '0')}° ${String(m).padStart(2, '0')}′ ${String(s).padStart(2, '0')}″`;
}

export function isBroadband(f) {
  return /^[LRGB]/i.test(f || '');
}

export function isNarrowband(f) {
  return /^[HSON]/i.test(f || '');
}

export function cmpFilters(a, b, filterNames) {
  const ia = filterNames.indexOf(a);
  const ib = filterNames.indexOf(b);
  if (ia >= 0 && ib >= 0) return ia - ib;
  if (ia >= 0) return -1;
  if (ib >= 0) return 1;
  return (a ?? '').localeCompare(b ?? '');
}

export function avgArr(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function cv(arr) {
  if (arr.length < 2) return null;
  const mean = avgArr(arr);
  if (mean === 0) return null;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
  return (Math.sqrt(variance) / mean) * 100;
}

export function iqStat(arr, unit = '') {
  if (!arr.length) return null;
  const mean = avgArr(arr);
  const cvVal = cv(arr);
  return {
    min: Math.min(...arr).toFixed(2) + unit,
    max: Math.max(...arr).toFixed(2) + unit,
    mean: mean.toFixed(2) + unit,
    cv: cvVal !== null ? cvVal.toFixed(0) + '%' : '—',
  };
}

export function buildIqRows(images, filterNames) {
  const rows = [];
  const byFilter = (imgs, fieldFn, unit) => {
    const groups = {};
    for (const img of imgs) {
      const f = img.Filter || '(no filter)';
      if (!groups[f]) groups[f] = [];
      const v = fieldFn(img);
      if (v > 0) groups[f].push(v);
    }
    return Object.entries(groups)
      .filter(([, vs]) => vs.length > 0)
      .sort(([a], [b]) => cmpFilters(a, b, filterNames))
      .map(([filter, vs]) => ({ filter, count: vs.length, ...iqStat(vs, unit) }));
  };
  const hfrImgs = images.filter((i) => i.HFR > 0);
  const fwhmImgs = images.filter((i) => i.FWHM > 0);
  const eccs = images.filter((i) => i.Eccentricity > 0).map((i) => i.Eccentricity);
  const rmss = images.filter((i) => i.GuidingRMSTotal > 0).map((i) => i.GuidingRMSTotal);
  if (hfrImgs.length) {
    const fr = byFilter(hfrImgs, (i) => i.HFR, 'px');
    rows.push({
      label: 'HFR',
      ...iqStat(
        hfrImgs.map((i) => i.HFR),
        'px'
      ),
      filterRows: fr.length > 1 ? fr : [],
    });
  }
  if (fwhmImgs.length) {
    const fr = byFilter(fwhmImgs, (i) => i.FWHM, '"');
    rows.push({
      label: 'FWHM',
      ...iqStat(
        fwhmImgs.map((i) => i.FWHM),
        '"'
      ),
      filterRows: fr.length > 1 ? fr : [],
    });
  }
  if (eccs.length) rows.push({ label: 'Eccentricity', ...iqStat(eccs), filterRows: [] });
  if (rmss.length) rows.push({ label: 'Guiding RMS', ...iqStat(rmss, '"'), filterRows: [] });
  return rows;
}
