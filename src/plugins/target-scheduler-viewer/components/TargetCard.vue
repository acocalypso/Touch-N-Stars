<script setup>
import { ref } from 'vue';
import ExposureProgressBar from './ExposureProgressBar.vue';
import { targetSchedulerApi } from '../services/targetSchedulerApi';

const props = defineProps({
  target: { type: Object, required: true },
});

const showStats = ref(false);
const stats = ref(null);
const statsLoading = ref(false);
const statsError = ref('');

function formatRa(hours) {
  const h = Math.floor(hours);
  const mFloat = (hours - h) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${h}h ${m}m ${s}s`;
}

function formatDec(deg) {
  const sign = deg < 0 ? '-' : '+';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${sign}${d}° ${m}' ${s}"`;
}

async function toggleStats() {
  showStats.value = !showStats.value;
  if (showStats.value && !stats.value) {
    statsLoading.value = true;
    statsError.value = '';
    try {
      stats.value = await targetSchedulerApi.getStatistics(props.target.Id);
    } catch (e) {
      statsError.value = e.message;
    } finally {
      statsLoading.value = false;
    }
  }
}
</script>

<template>
  <div class="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
    <div class="flex items-start justify-between gap-2">
      <div>
        <div class="flex items-center gap-2">
          <span class="font-semibold">{{ target.Name }}</span>
          <span
            v-if="!target.Active"
            class="rounded bg-gray-600 px-1.5 py-0.5 text-[10px] uppercase text-gray-200"
          >
            inactive
          </span>
        </div>
        <div class="text-[11px] text-gray-400">
          RA {{ formatRa(target.RA) }} &middot; Dec {{ formatDec(target.Dec) }}
        </div>
      </div>
      <button
        class="shrink-0 rounded bg-gray-700 px-2 py-1 text-[11px] hover:bg-gray-600"
        @click="toggleStats"
      >
        {{ showStats ? 'Hide stats' : 'Stats' }}
      </button>
    </div>

    <div class="mt-2 space-y-1.5">
      <ExposureProgressBar
        v-for="plan in target.ExposurePlan"
        :key="plan.FilterName"
        :plan="plan"
      />
    </div>

    <div v-if="showStats" class="mt-2 border-t border-gray-700 pt-2 text-[11px]">
      <div v-if="statsLoading" class="text-gray-400">Loading stats…</div>
      <div v-else-if="statsError" class="text-red-400">{{ statsError }}</div>
      <table v-else-if="stats && stats.length" class="w-full text-left">
        <thead class="text-gray-400">
          <tr>
            <th class="pr-2">Filter</th>
            <th class="pr-2">HFR</th>
            <th class="pr-2">FWHM</th>
            <th>Ecc.</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in stats" :key="s.FilterName">
            <td class="pr-2">{{ s.FilterName }}</td>
            <td class="pr-2">{{ s.HFRMean.toFixed(2) }} ± {{ s.HFRStdDev.toFixed(2) }}</td>
            <td class="pr-2">{{ s.FWHMMean.toFixed(2) }} ± {{ s.FWHMStdDev.toFixed(2) }}</td>
            <td>{{ s.EccentricityMean.toFixed(2) }} ± {{ s.EccentricityStdDev.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="text-gray-500">No accepted frames yet.</div>
    </div>
  </div>
</template>
