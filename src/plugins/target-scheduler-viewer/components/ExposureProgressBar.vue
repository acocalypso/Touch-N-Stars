<script setup>
import { computed } from 'vue';
import { THEME } from '../theme';

const props = defineProps({
  plan: { type: Object, required: true },
});

const acceptedPct = computed(() => {
  if (!props.plan.Desired) return 0;
  return Math.min(100, (props.plan.Accepted / props.plan.Desired) * 100);
});

const pendingPct = computed(() => {
  if (!props.plan.Desired) return 0;
  const pending = Math.max(0, props.plan.Acquired - props.plan.Accepted);
  return Math.min(100 - acceptedPct.value, (pending / props.plan.Desired) * 100);
});
</script>

<template>
  <div class="flex items-center gap-2 text-xs">
    <span class="w-24 shrink-0 truncate font-medium" :style="{ color: THEME.inkSecondary }">
      {{ plan.FilterName }}
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
    <span
      class="w-20 shrink-0 text-right tabular-nums"
      :style="{ color: THEME.inkSecondary }"
    >
      {{ plan.Accepted }}/{{ plan.Desired }}
    </span>
  </div>
</template>
