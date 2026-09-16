<script setup>
import { computed } from 'vue';
import { THEME } from '../theme';
import {
  computeExposureBarFill,
  planIntegrationSeconds,
  formatIntegrationTime,
} from '../calculations';

const props = defineProps({
  plan: { type: Object, required: true },
});

const fill = computed(() => computeExposureBarFill(props.plan));
const acceptedPct = computed(() => fill.value.acceptedPct);
const pendingPct = computed(() => fill.value.pendingPct);
const integrationSeconds = computed(() => planIntegrationSeconds(props.plan));
const integrationTime = computed(() => formatIntegrationTime(integrationSeconds.value));
</script>

<template>
  <div class="text-xs">
    <div class="flex items-center gap-2">
      <span class="w-28 shrink-0 break-words" :style="{ color: THEME.inkSecondary }">
        <span class="font-medium">{{ plan.FilterName }}</span>
        <span class="tabular-nums" :style="{ color: THEME.inkMuted }"> · {{ plan.Exposure }}s</span>
      </span>
      <div
        class="flex h-2 flex-1 gap-[2px] overflow-hidden rounded-full"
        :style="{ backgroundColor: THEME.track }"
        role="progressbar"
        :aria-valuenow="plan.Accepted"
        :aria-valuemin="0"
        :aria-valuemax="plan.Desired"
        :aria-label="`${plan.FilterName}: ${plan.Accepted} of ${plan.Desired} accepted`"
      >
        <div
          v-if="acceptedPct > 0"
          class="h-full rounded-full"
          :style="{ width: acceptedPct + '%', backgroundColor: THEME.good }"
        />
        <div
          v-if="pendingPct > 0"
          class="h-full rounded-full"
          :style="{ width: pendingPct + '%', backgroundColor: THEME.warning }"
        />
      </div>
      <span class="w-20 shrink-0 text-right tabular-nums" :style="{ color: THEME.inkSecondary }">
        {{ plan.Accepted }}/{{ plan.Desired }}
      </span>
    </div>
    <p
      v-if="integrationSeconds > 0"
      class="mt-0.5 text-right text-[10px]"
      :style="{ color: THEME.inkMuted }"
    >
      {{ integrationTime }} integrated
    </p>
  </div>
</template>
