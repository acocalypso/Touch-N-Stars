<script setup>
import { computed } from 'vue';

const props = defineProps({
  plan: { type: Object, required: true },
});

const pct = computed(() => {
  if (!props.plan.Desired) return 0;
  return Math.min(100, Math.round((props.plan.Accepted / props.plan.Desired) * 100));
});

const pendingPct = computed(() => {
  if (!props.plan.Desired) return 0;
  const acquiredNotAccepted = Math.max(0, props.plan.Acquired - props.plan.Accepted);
  return Math.min(100 - pct.value, Math.round((acquiredNotAccepted / props.plan.Desired) * 100));
});
</script>

<template>
  <div class="flex items-center gap-2 text-xs">
    <span class="w-24 shrink-0 truncate font-medium">{{ plan.FilterName }}</span>
    <div class="h-2 flex-1 overflow-hidden rounded bg-gray-700">
      <div class="flex h-full">
        <div class="h-full bg-green-500" :style="{ width: pct + '%' }" />
        <div class="h-full bg-yellow-500/70" :style="{ width: pendingPct + '%' }" />
      </div>
    </div>
    <span class="w-20 shrink-0 text-right tabular-nums text-gray-300">
      {{ plan.Accepted }}/{{ plan.Desired }}
    </span>
  </div>
</template>
