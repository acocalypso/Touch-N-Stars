<template>
  <div
    v-if="
      overheadCategories.length &&
      store.settings?.ReportDetailLevel >= 2 &&
      store.settings?.ShowOverheadBreakdown
    "
    class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
  >
    <div class="px-4 py-3 border-b border-gray-700">
      <h3 class="text-white font-medium">Yield and Imaging Overhead Analysis</h3>
    </div>
    <div class="p-4 space-y-4">
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-3">
          <p class="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Overhead</p>
          <p class="text-white text-lg font-semibold">
            {{ formatDuration(overheadStats.mergedOverheadSec) }}
          </p>
        </div>
        <div class="bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-3">
          <p class="text-gray-400 text-xs uppercase tracking-wide mb-1">Overhead Accounted</p>
          <p class="text-white text-lg font-semibold">
            {{
              overheadStats.impliedOverheadSec > 0
                ? overheadStats.coveragePct.toFixed(1) + '%'
                : '—'
            }}
          </p>
        </div>
        <div class="bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-3">
          <template v-if="overheadStats.unaccountedSec > 10">
            <p class="text-gray-400 text-xs uppercase tracking-wide mb-1">Unaccounted</p>
            <p class="text-white text-lg font-semibold">
              {{ formatDuration(overheadStats.unaccountedSec) }}
            </p>
          </template>
          <template v-else>
            <p class="text-gray-400 text-xs uppercase tracking-wide mb-1">Categories</p>
            <p class="text-white text-lg font-semibold">{{ overheadCategories.length }}</p>
          </template>
        </div>
      </div>
      <div class="flex h-4 rounded overflow-hidden">
        <div
          v-for="row in overheadCategories"
          :key="row.type"
          :style="{ width: row.pct + '%', backgroundColor: OVERHEAD_COLORS[row.type] ?? '#6b7280' }"
          :title="row.label + ': ' + formatDuration(row.totalSec)"
        ></div>
      </div>
    </div>
    <div class="overflow-x-auto px-4 pb-4">
      <table class="w-full text-sm border border-gray-700 rounded">
        <thead>
          <tr class="text-gray-400 bg-gray-900/50 text-xs uppercase tracking-wide">
            <th class="text-left px-3 py-2">Category</th>
            <th class="text-right px-3 py-2">Count</th>
            <th class="text-right px-3 py-2">Total</th>
            <th class="text-right px-3 py-2">Avg</th>
            <th class="text-right px-3 py-2">% of Overhead</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, ri) in overheadCategories"
            :key="row.type"
            :class="ri % 2 === 1 ? 'bg-gray-900/30' : ''"
            class="border-t border-gray-700/50 text-gray-300"
          >
            <td class="px-3 py-2 text-gray-200">{{ row.label }}</td>
            <td class="px-3 py-2 text-right">{{ row.count }}</td>
            <td class="px-3 py-2 text-right">{{ formatDuration(row.totalSec) }}</td>
            <td class="px-3 py-2 text-right">{{ row.avgSec.toFixed(1) }}s</td>
            <td class="px-3 py-2 text-right">{{ row.pct.toFixed(1) }}%</td>
          </tr>
        </tbody>
      </table>
      <p class="text-gray-500 text-xs mt-2">
        Category totals may exceed overall overhead because some operations run concurrently.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNightSummaryStore } from '../store/nightsummaryStore';
import { formatDuration } from '../utils/sessionFormatters';

const store = useNightSummaryStore();

const OVERHEAD_COLORS = {
  CameraDownload: '#4a9eff',
  FilterChange: '#f59e0b',
  Dither: '#10b981',
  TempCompFocus: '#8b5cf6',
  Autofocus: '#ef4444',
  PlateSolve: '#06b6d4',
  ImageSave: '#f97316',
  Centering: '#6366f1',
  MeridianFlip: '#14b8a6',
  Slew: '#a855f7',
  DomeSync: '#2dd4bf',
  DomeOps: '#0d9488',
  FlatPanel: '#fbbf24',
  CameraTemp: '#60a5fa',
  MountOps: '#c084fc',
  Guiding: '#34d399',
  SafetyWait: '#f472b6',
  FocuserMove: '#a78bfa',
  Rotator: '#818cf8',
  Switch: '#94a3b8',
  AbortedExposure: '#fb7185',
};

function timingEventLabel(type) {
  const map = {
    CameraDownload: 'Camera Download',
    FilterChange: 'Filter Change',
    TempCompFocus: 'Temp Comp Focus',
    PlateSolve: 'Plate Solve',
    ImageSave: 'Image Save',
    MeridianFlip: 'Meridian Flip',
    DomeSync: 'Dome Sync',
    DomeOps: 'Dome',
    FlatPanel: 'Flat Panel',
    CameraTemp: 'Camera Temp',
    MountOps: 'Mount',
    SafetyWait: 'Safety Wait',
    FocuserMove: 'Focuser Move',
    AbortedExposure: 'Skipped Exposure',
    Guiding: 'Guiding',
    Dither: 'Dither',
    Autofocus: 'Autofocus',
    Centering: 'Centering',
    Slew: 'Slew',
    Rotator: 'Rotator',
  };
  return map[type] ?? type;
}

const overheadCategories = computed(() => {
  const te = store.sessionDetail?.TimingEvents;
  if (!te?.length) return [];
  const overhead = te.filter((e) => e.EventType !== 'Exposure' && e.DurationSeconds > 0);
  if (!overhead.length) return [];
  const map = {};
  for (const e of overhead) {
    if (!map[e.EventType]) map[e.EventType] = { type: e.EventType, count: 0, totalSec: 0 };
    map[e.EventType].count++;
    map[e.EventType].totalSec += e.DurationSeconds;
  }
  const rows = Object.values(map)
    .filter((r) => r.totalSec >= 1)
    .sort((a, b) => b.totalSec - a.totalSec);
  const grandTotal = rows.reduce((s, r) => s + r.totalSec, 0);
  return rows.map((r) => ({
    ...r,
    label: timingEventLabel(r.type),
    avgSec: r.totalSec / r.count,
    pct: grandTotal > 0 ? (r.totalSec / grandTotal) * 100 : 0,
  }));
});

const overheadStats = computed(() => {
  const te = store.sessionDetail?.TimingEvents;
  const images =
    store.sessionDetail?.Images?.filter((i) => !i.ImageType || i.ImageType === 'LIGHT') ?? [];
  const empty = { mergedOverheadSec: 0, impliedOverheadSec: 0, coveragePct: 0, unaccountedSec: 0 };
  if (!te?.length) return empty;
  const overhead = te.filter(
    (e) => e.EventType !== 'Exposure' && e.DurationSeconds > 0 && e.StartTime && e.EndTime
  );
  const intervals = overhead
    .map((e) => [new Date(e.StartTime).getTime(), new Date(e.EndTime).getTime()])
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [s, e] of intervals) {
    if (!merged.length || s > merged[merged.length - 1][1]) merged.push([s, e]);
    else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
  }
  const mergedOverheadSec = merged.reduce((sum, [s, e]) => sum + (e - s) / 1000, 0);
  const allEvents = te.filter(
    (e) => e.StartTime && e.EndTime && e.DurationSeconds > 0 && e.EventType !== 'AbortedExposure'
  );
  if (!allEvents.length) return { ...empty, mergedOverheadSec };
  const windowStart = Math.min(...allEvents.map((e) => new Date(e.StartTime).getTime()));
  const windowEnd = Math.max(...allEvents.map((e) => new Date(e.EndTime).getTime()));
  const windowSec = (windowEnd - windowStart) / 1000;
  const totalIntegrationSec = images.reduce((s, i) => s + (i.ExposureDuration || 0), 0);
  const impliedOverheadSec = Math.max(0, windowSec - totalIntegrationSec);
  const coveragePct =
    impliedOverheadSec > 0 ? Math.min((mergedOverheadSec / impliedOverheadSec) * 100, 100) : 0;
  const unaccountedSec = Math.max(0, impliedOverheadSec - mergedOverheadSec);
  return { mergedOverheadSec, impliedOverheadSec, coveragePct, unaccountedSec };
});
</script>
