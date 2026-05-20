<template>
  <div
    v-if="targetDetails.length"
    class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
  >
    <div class="px-4 py-3 border-b border-gray-700">
      <h3 class="text-white font-medium">Targets Imaged</h3>
    </div>
    <div class="divide-y divide-gray-700">
      <div v-for="t in targetDetails" :key="t.target" class="px-4 py-4">
        <!-- Target heading -->
        <div class="mb-3">
          <h4 class="text-white font-semibold text-base">{{ t.target || '—' }}</h4>
          <p class="text-gray-400 text-xs mt-0.5">
            Start: {{ formatTime(t.firstImage) }} → End: {{ formatTime(t.lastImage) }}
            <template v-if="t.raStr">
              &nbsp;·&nbsp; R.A. {{ t.raStr }} &nbsp;·&nbsp; Dec. {{ t.decStr }}
            </template>
          </p>
        </div>

        <!-- Filter × ExposureDuration table -->
        <div class="overflow-x-auto mb-3">
          <table class="w-full text-sm border border-gray-700 rounded">
            <thead>
              <tr class="text-gray-400 bg-gray-900/50 text-xs uppercase tracking-wide">
                <th class="text-left px-3 py-2">Filter</th>
                <th class="text-right px-3 py-2">Images</th>
                <th class="text-right px-3 py-2">Exposure</th>
                <th class="text-right px-3 py-2">Total Time</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, ri) in t.filterRows"
                :key="ri"
                :class="ri % 2 === 1 ? 'bg-gray-900/30' : ''"
                class="border-t border-gray-700/50 text-gray-300"
              >
                <td class="px-3 py-1.5">{{ row.filter || '—' }}</td>
                <td class="px-3 py-1.5 text-right">{{ row.count }}</td>
                <td class="px-3 py-1.5 text-right">{{ row.expDur.toFixed(0) }}s</td>
                <td class="px-3 py-1.5 text-right">{{ formatDuration(row.totalSec) }}</td>
              </tr>
              <tr class="border-t border-gray-600 bg-gray-900/50 text-white font-semibold">
                <td class="px-3 py-1.5">Total</td>
                <td class="px-3 py-1.5 text-right">{{ t.totalCount }}</td>
                <td class="px-3 py-1.5 text-right"></td>
                <td class="px-3 py-1.5 text-right">{{ formatDuration(t.totalExp) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Star Count CV -->
        <div
          v-if="
            (t.starCvBB !== null || t.starCvNB !== null) &&
            store.settings?.ReportDetailLevel >= 1 &&
            store.settings?.ShowStarCountCV
          "
          class="mb-3 text-sm"
        >
          <p class="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">
            Star Count Consistency (CV)
          </p>
          <div class="flex gap-4 text-sm">
            <span class="text-gray-300"
              >Broadband:
              <span class="text-white font-medium">{{
                t.starCvBB !== null ? t.starCvBB.toFixed(0) + '%' : '—'
              }}</span></span
            >
            <span class="text-gray-300"
              >Narrowband:
              <span class="text-white font-medium">{{
                t.starCvNB !== null ? t.starCvNB.toFixed(0) + '%' : '—'
              }}</span></span
            >
          </div>
        </div>

        <!-- Per-target IQ -->
        <div
          v-if="
            t.iq.rows.length &&
            store.settings?.ReportDetailLevel >= 1 &&
            targetDetails.length > 1 &&
            store.settings?.ShowPerTargetIQ
          "
        >
          <p class="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">
            Image Quality
          </p>
          <IqTable :rows="t.iq.rows" />
        </div>

        <!-- Session History -->
        <div
          v-if="
            store.settings?.ReportDetailLevel >= 2 &&
            store.settings?.ShowSessionHistory &&
            (store.sessionDetail?.SessionHistory?.[t.target]?.length ?? 0) > 0
          "
          class="mt-3"
        >
          <details class="border border-gray-700 rounded overflow-hidden">
            <summary
              class="px-3 py-2 bg-gray-900/50 text-gray-400 text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-gray-700/30 list-none flex items-center justify-between"
            >
              <span>Session History</span>
              <span class="text-gray-600">
                {{ store.sessionDetail.SessionHistory[t.target].length }} previous session{{
                  store.sessionDetail.SessionHistory[t.target].length === 1 ? '' : 's'
                }}
                ▾
              </span>
            </summary>
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-gray-500 bg-gray-900/70 uppercase tracking-wide">
                    <th class="text-left px-3 py-2">Date</th>
                    <th class="text-right px-3 py-2">Integration</th>
                    <th class="text-right px-3 py-2">Avg HFR</th>
                    <th class="text-right px-3 py-2">Avg FWHM</th>
                    <th class="text-right px-3 py-2">Avg Guiding RMS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(h, hi) in store.sessionDetail.SessionHistory[t.target]"
                    :key="hi"
                    :class="hi % 2 === 1 ? 'bg-gray-900/30' : ''"
                    class="border-t border-gray-700/40 text-gray-400"
                  >
                    <td class="px-3 py-1.5 text-gray-300">
                      {{ formatHistoryDate(h.SessionStart) }}
                    </td>
                    <td class="px-3 py-1.5 text-right">
                      {{ formatDurationH(h.IntegrationSeconds) }}
                    </td>
                    <td class="px-3 py-1.5 text-right">
                      {{ h.AvgHFR > 0 ? h.AvgHFR.toFixed(2) + 'px' : '—' }}
                    </td>
                    <td class="px-3 py-1.5 text-right">
                      {{ h.AvgFWHM > 0 ? h.AvgFWHM.toFixed(2) + '"' : '—' }}
                    </td>
                    <td class="px-3 py-1.5 text-right">
                      {{ h.AvgGuidingRMS > 0 ? h.AvgGuidingRMS.toFixed(2) + '"' : '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNightSummaryStore } from '../store/nightsummaryStore';
import IqTable from './IqTable.vue';
import {
  formatTime,
  formatDuration,
  formatDurationH,
  formatHistoryDate,
  formatRA,
  formatDec,
  buildIqRows,
  isBroadband,
  isNarrowband,
  cmpFilters,
  cv,
} from '../utils/sessionFormatters';

const store = useNightSummaryStore();

const targetDetails = computed(() => {
  if (!store.sessionDetail?.Images?.length) return [];
  const light = store.sessionDetail.Images.filter((i) => !i.ImageType || i.ImageType === 'LIGHT');
  const targetMap = new Map();
  for (const img of light) {
    const key = img.TargetName || '';
    if (!targetMap.has(key)) targetMap.set(key, []);
    targetMap.get(key).push(img);
  }
  return [...targetMap.entries()].map(([target, imgs]) => {
    const sorted = [...imgs].sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
    const firstImage = sorted[0]?.Timestamp;
    const lastImage = sorted[sorted.length - 1]?.Timestamp;

    const coordImg = sorted.find((i) => i.RaHours || i.DecDegrees);
    const raStr = coordImg ? formatRA(coordImg.RaHours) : null;
    const decStr = coordImg ? formatDec(coordImg.DecDegrees) : null;

    const fMap = new Map();
    for (const img of sorted) {
      const key = `${img.Filter ?? ''}|${img.ExposureDuration ?? 0}`;
      if (!fMap.has(key))
        fMap.set(key, { filter: img.Filter ?? '', expDur: img.ExposureDuration ?? 0, count: 0 });
      fMap.get(key).count++;
    }
    const filterNames = store.filterNames;
    const filterRows = [...fMap.values()]
      .sort((a, b) => cmpFilters(a.filter, b.filter, filterNames) || a.expDur - b.expDur)
      .map((r) => ({ ...r, totalSec: r.count * r.expDur }));

    const totalCount = sorted.length;
    const totalExp = sorted.reduce((s, i) => s + (i.ExposureDuration || 0), 0);
    const iq = { rows: buildIqRows(sorted, filterNames) };

    const bbStars = sorted
      .filter((i) => isBroadband(i.Filter) && i.StarCount > 0)
      .map((i) => i.StarCount);
    const nbStars = sorted
      .filter((i) => isNarrowband(i.Filter) && i.StarCount > 0)
      .map((i) => i.StarCount);
    const starCvBB = bbStars.length >= 2 ? cv(bbStars) : null;
    const starCvNB = nbStars.length >= 2 ? cv(nbStars) : null;

    return {
      target,
      firstImage,
      lastImage,
      raStr,
      decStr,
      filterRows,
      totalCount,
      totalExp,
      iq,
      starCvBB,
      starCvNB,
    };
  });
});
</script>
