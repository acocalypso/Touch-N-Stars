<script setup>
import { computed, ref } from 'vue';
import ExposureProgressBar from './ExposureProgressBar.vue';
import { targetSchedulerApi } from '../services/targetSchedulerApi';
import { THEME } from '../theme';
import {
  formatRa,
  formatDec,
  autoAcceptStatus,
  exposureDurationsByFilter,
  computeTargetIntegration,
} from '../calculations';

const props = defineProps({
  target: { type: Object, required: true },
});

const showStats = ref(false);
const stats = ref(null);
const statsLoading = ref(false);
const statsError = ref('');

const autoAccept = autoAcceptStatus;

const exposureByFilter = computed(() => exposureDurationsByFilter(props.target.ExposurePlan));

const integration = computed(() => computeTargetIntegration(props.target));

const activeStyle = computed(() => (props.target.Active ? THEME.good : THEME.warning));

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
  <div class="rounded-md p-3" :style="{ backgroundColor: THEME.surface1 }">
    <div class="flex items-start justify-between gap-2">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <span
          class="h-2 w-2 shrink-0 rounded-full"
          :style="{ backgroundColor: activeStyle }"
          :title="target.Active ? 'Active' : 'Inactive'"
        />
        <span class="break-words font-semibold">{{ target.Name }}</span>
      </div>
      <button
        class="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors hover:brightness-125"
        :style="{ backgroundColor: THEME.track, color: THEME.inkSecondary }"
        @click="toggleStats"
      >
        <svg
          class="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 3v18h18M8 17V9m4 8V5m4 12v-6"
          />
        </svg>
        {{ showStats ? 'Hide' : 'Stats' }}
      </button>
    </div>

    <div class="mt-0.5 text-[11px]" :style="{ color: THEME.inkMuted }">
      RA {{ formatRa(target.RA) }} &middot; Dec {{ formatDec(target.Dec) }} &middot; rotation
      {{ target.Rotation }}° &middot; {{ target.Epoch }} &middot; ROI {{ target.ROI }}%
      <span v-if="integration.integrationSeconds > 0">
        &middot; {{ integration.integrationTime }} / {{ integration.expectedIntegrationTime }}
        integrated
      </span>
      <span v-if="integration.remainingIntegrationSeconds > 0">
        &middot; {{ integration.remainingIntegrationTime }} remaining
      </span>
    </div>

    <div class="mt-2 space-y-1.5">
      <ExposureProgressBar
        v-for="plan in target.ExposurePlan"
        :key="plan.FilterName"
        :plan="plan"
      />
    </div>

    <div
      v-if="showStats"
      class="mt-2 border-t pt-2 text-[11px]"
      :style="{ borderColor: THEME.border }"
    >
      <div v-if="statsLoading" :style="{ color: THEME.inkMuted }">Loading stats…</div>
      <div v-else-if="statsError" :style="{ color: THEME.critical }">{{ statsError }}</div>
      <div v-else-if="stats && stats.length" class="overflow-x-auto">
        <table class="w-full text-left">
          <thead :style="{ color: THEME.inkMuted }">
            <tr>
              <th class="pr-2 font-normal">Filter</th>
              <th class="pr-2 font-normal">Exp</th>
              <th class="pr-2 font-normal">HFR</th>
              <th class="pr-2 font-normal">FWHM</th>
              <th class="font-normal">Ecc.</th>
            </tr>
          </thead>
          <tbody class="tabular-nums">
            <tr v-for="s in stats" :key="s.FilterName">
              <td class="whitespace-nowrap pr-2 py-0.5">{{ s.FilterName }}</td>
              <td class="pr-2" :style="{ color: THEME.inkMuted }">
                {{
                  exposureByFilter.get(s.FilterName)
                    ? exposureByFilter.get(s.FilterName) + 's'
                    : '—'
                }}
              </td>
              <td class="whitespace-nowrap pr-2">
                {{ s.HFRMean.toFixed(2) }} ± {{ s.HFRStdDev.toFixed(2) }}
                <span
                  v-if="autoAccept(s.HFRBelowAutoAcceptLevel) !== null"
                  class="ml-1"
                  :title="
                    autoAccept(s.HFRBelowAutoAcceptLevel)
                      ? 'Below auto-accept threshold (unconfirmed field semantics)'
                      : 'Above auto-accept threshold (unconfirmed field semantics)'
                  "
                  :style="{
                    color: autoAccept(s.HFRBelowAutoAcceptLevel) ? THEME.good : THEME.warning,
                  }"
                  >{{ autoAccept(s.HFRBelowAutoAcceptLevel) ? '✓' : '✕' }}</span
                >
              </td>
              <td class="whitespace-nowrap pr-2">
                {{ s.FWHMMean.toFixed(2) }} ± {{ s.FWHMStdDev.toFixed(2) }}
                <span
                  v-if="autoAccept(s.FWHMBelowAutoAcceptLevel) !== null"
                  class="ml-1"
                  :title="
                    autoAccept(s.FWHMBelowAutoAcceptLevel)
                      ? 'Below auto-accept threshold (unconfirmed field semantics)'
                      : 'Above auto-accept threshold (unconfirmed field semantics)'
                  "
                  :style="{
                    color: autoAccept(s.FWHMBelowAutoAcceptLevel) ? THEME.good : THEME.warning,
                  }"
                  >{{ autoAccept(s.FWHMBelowAutoAcceptLevel) ? '✓' : '✕' }}</span
                >
              </td>
              <td class="whitespace-nowrap">
                {{ s.EccentricityMean.toFixed(2) }} ± {{ s.EccentricityStdDev.toFixed(2) }}
                <span
                  v-if="autoAccept(s.EccentricityBelowAutoAcceptLevel) !== null"
                  class="ml-1"
                  :title="
                    autoAccept(s.EccentricityBelowAutoAcceptLevel)
                      ? 'Below auto-accept threshold (unconfirmed field semantics)'
                      : 'Above auto-accept threshold (unconfirmed field semantics)'
                  "
                  :style="{
                    color: autoAccept(s.EccentricityBelowAutoAcceptLevel)
                      ? THEME.good
                      : THEME.warning,
                  }"
                  >{{ autoAccept(s.EccentricityBelowAutoAcceptLevel) ? '✓' : '✕' }}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else :style="{ color: THEME.inkMuted }">No accepted frames yet.</div>
    </div>
  </div>
</template>
