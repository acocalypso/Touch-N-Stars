<template>
  <div v-if="metricChartSvg" class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
    <div class="px-4 py-3 border-b border-gray-700">
      <h3 class="text-white font-medium">{{ chartTitle }}</h3>
    </div>
    <div class="p-4" v-html="metricChartSvg"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNightSummaryStore } from '../store/nightsummaryStore';

const store = useNightSummaryStore();

const METRIC_FIELDS = [
  'HFR',
  'FWHM',
  'GuidingRMSTotal',
  'FocuserTemp',
  'AmbientTemp',
  'Eccentricity',
  'Altitude',
  'Airmass',
  'Humidity',
  'FocuserPosition',
  'SkyQuality',
  'CloudCover',
  'CameraTemp',
  'DewPoint',
  'WindSpeed',
  'Pressure',
  'StarCount',
  'Azimuth',
  'SeeingFWHM',
  'StatMedian',
];

const METRIC_Y_LABELS = [
  'HFR (px)',
  'FWHM (")',
  'Guiding RMS (")',
  'Focuser Temp (°C)',
  'Ambient Temp (°C)',
  'Eccentricity',
  'Altitude (°)',
  'Airmass',
  'Humidity (%)',
  'Focuser Pos (steps)',
  'Sky Quality',
  'Cloud Cover (%)',
  'Camera Temp (°C)',
  'Dew Point (°C)',
  'Wind Speed (m/s)',
  'Pressure (hPa)',
  'Star Count',
  'Azimuth (°)',
  'Seeing FWHM (")',
  'Median ADU',
];

function niceScale(values) {
  if (!values.length) return { min: 0, max: 1, step: 0.5 };
  const lo = Math.min(...values),
    hi = Math.max(...values);
  const range = hi - lo || 1;
  const rawStep = range / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = Math.ceil(rawStep / mag) * mag || mag;
  return { min: Math.floor(lo / step) * step, max: Math.ceil(hi / step) * step, step };
}

function extractMetricPts(images, idx) {
  const field = METRIC_FIELDS[idx];
  if (!field) return [];
  return images
    .map((i) => ({ t: new Date(i.Timestamp).getTime(), v: i[field] }))
    .filter((p) => p.v != null && !isNaN(p.v) && +p.v > 0)
    .sort((a, b) => a.t - b.t);
}

const chartTitle = computed(() => {
  const pri = store.settings?.ChartPrimaryMetric ?? 0;
  const sec = store.settings?.ChartSecondaryMetric ?? 0;
  const priName = (METRIC_Y_LABELS[pri] || 'HFR').split(' ')[0];
  if (sec === 0) return `${priName} vs. Time`;
  const secName = (METRIC_Y_LABELS[sec - 1] || '').split(' ')[0];
  return `${priName} and ${secName} vs. Time`;
});

const metricChartSvg = computed(() => {
  if (!store.settings?.ShowHFRGraph || (store.settings?.ReportDetailLevel ?? 0) < 2) return null;
  const images = store.sessionDetail?.Images?.filter(
    (i) => !i.ImageType || i.ImageType === 'LIGHT'
  );
  if (!images?.length) return null;

  const primaryIdx = store.settings?.ChartPrimaryMetric ?? 0;
  const secIdx = store.settings?.ChartSecondaryMetric ?? 0;
  const secPriIdx = secIdx > 0 ? secIdx - 1 : -1;

  const primaryPts = extractMetricPts(images, primaryIdx);
  const secondaryPts = secPriIdx >= 0 ? extractMetricPts(images, secPriIdx) : [];
  if (primaryPts.length < 2) return null;

  const hasSec = secondaryPts.length >= 2;
  const W = 760,
    H = 260,
    padL = 52,
    padT = 20,
    padB = 40;
  const padR = hasSec ? 60 : 16;
  const plotW = W - padL - padR,
    plotH = H - padT - padB;

  const allT = [...primaryPts, ...secondaryPts].map((p) => p.t);
  const minT = Math.min(...allT),
    maxT = Math.max(...allT);
  const tRange = Math.max(maxT - minT, 1);
  const toXPx = (t) => padL + ((t - minT) / tRange) * plotW;

  const { min: yMin, max: yMax, step: yStep } = niceScale(primaryPts.map((p) => p.v));
  const yRange = yMax - yMin || 1;
  const toYL = (v) => padT + plotH - ((v - yMin) / yRange) * plotH;

  let toYR = null,
    yMinR = 0,
    yMaxR = 1,
    yStepR = 0.5;
  if (hasSec) {
    ({ min: yMinR, max: yMaxR, step: yStepR } = niceScale(secondaryPts.map((p) => p.v)));
    const yRangeR = yMaxR - yMinR || 1;
    toYR = (v) => padT + plotH - ((v - yMinR) / yRangeR) * plotH;
  }

  const fmtV = (v) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
  const fmtTime = (ms) =>
    new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;display:block;">`;
  s += `<rect width="${W}" height="${H}" fill="#111827" rx="6"/>`;

  for (let v = yMin; v <= yMax + yStep * 0.001; v = +(v + yStep).toFixed(10)) {
    const y = toYL(v).toFixed(1);
    s += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#374151" stroke-width="1"/>`;
    s += `<text x="${padL - 4}" y="${(+y + 4).toFixed(1)}" fill="#9ca3af" font-size="10" text-anchor="end">${fmtV(v)}</text>`;
  }
  if (toYR) {
    for (let v = yMinR; v <= yMaxR + yStepR * 0.001; v = +(v + yStepR).toFixed(10)) {
      const y = toYR(v).toFixed(1);
      s += `<text x="${W - padR + 4}" y="${(+y + 4).toFixed(1)}" fill="#f59e0b" font-size="10" text-anchor="start">${fmtV(v)}</text>`;
    }
    s += `<line x1="${W - padR}" y1="${padT}" x2="${W - padR}" y2="${padT + plotH}" stroke="#4b5563" stroke-width="1"/>`;
    const rx = W - 10,
      ry = H / 2;
    s += `<text x="${rx}" y="${ry}" fill="#f59e0b" font-size="10" text-anchor="middle" transform="rotate(90,${rx},${ry})">${METRIC_Y_LABELS[secPriIdx] || ''}</text>`;
  }
  for (let i = 0; i <= 5; i++) {
    const xPx = (padL + (i / 5) * plotW).toFixed(1);
    const t = minT + (i / 5) * tRange;
    s += `<line x1="${xPx}" y1="${padT}" x2="${xPx}" y2="${padT + plotH}" stroke="#374151" stroke-width="1"/>`;
    s += `<text x="${xPx}" y="${H - 8}" fill="#9ca3af" font-size="10" text-anchor="middle">${fmtTime(t)}</text>`;
  }
  s += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#4b5563" stroke-width="1"/>`;
  s += `<line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="#4b5563" stroke-width="1"/>`;
  s += `<text x="11" y="${H / 2}" fill="#9ca3af" font-size="10" text-anchor="middle" transform="rotate(-90,11,${H / 2})">${METRIC_Y_LABELS[primaryIdx] || ''}</text>`;

  const events = store.sessionDetail?.Events || [];
  const addMkr = (color, lbl, ts) => {
    const xPx = toXPx(ts);
    if (xPx < padL || xPx > W - padR) return;
    s += `<line x1="${xPx.toFixed(1)}" y1="${padT}" x2="${xPx.toFixed(1)}" y2="${padT + plotH}" stroke="${color}" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>`;
    s += `<text x="${xPx.toFixed(1)}" y="${padT - 3}" fill="${color}" font-size="8" text-anchor="middle">${lbl}</text>`;
  };
  if (store.settings?.ShowChartAfMarkers)
    events
      .filter((e) => e.EventType === 'AutoFocus')
      .forEach((e) => addMkr('#a78bfa', 'AF', new Date(e.Timestamp).getTime()));
  if (store.settings?.ShowChartFlipMarkers)
    events
      .filter((e) => e.EventType === 'MeridianFlip')
      .forEach((e) => addMkr('#fbbf24', 'MF', new Date(e.Timestamp).getTime()));
  if (store.settings?.ShowChartRoofMarkers)
    events
      .filter((e) => e.EventType === 'RoofOpen' || e.EventType === 'RoofClosed')
      .forEach((e) =>
        addMkr(
          e.EventType === 'RoofOpen' ? '#34d399' : '#f87171',
          'R',
          new Date(e.Timestamp).getTime()
        )
      );

  if (toYR && secondaryPts.length >= 2) {
    const pts2 = secondaryPts
      .map((p) => `${toXPx(p.t).toFixed(1)},${toYR(p.v).toFixed(1)}`)
      .join(' ');
    s += `<polyline points="${pts2}" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,3"/>`;
    secondaryPts.forEach((p) => {
      s += `<circle cx="${toXPx(p.t).toFixed(1)}" cy="${toYR(p.v).toFixed(1)}" r="2.5" fill="#fcd34d"><title>${fmtTime(p.t)} — ${p.v.toFixed(2)}</title></circle>`;
    });
  }
  const pts1 = primaryPts.map((p) => `${toXPx(p.t).toFixed(1)},${toYL(p.v).toFixed(1)}`).join(' ');
  s += `<polyline points="${pts1}" fill="none" stroke="#7eb8f7" stroke-width="1.5"/>`;
  primaryPts.forEach((p) => {
    s += `<circle cx="${toXPx(p.t).toFixed(1)}" cy="${toYL(p.v).toFixed(1)}" r="3" fill="#a8d4ff"><title>${fmtTime(p.t)} — ${p.v.toFixed(2)}</title></circle>`;
  });

  s += `</svg>`;
  return s;
});
</script>
