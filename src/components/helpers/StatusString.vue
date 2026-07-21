<template>
  <!-- Default: stat tile (status bar detail panels). Compact: chrome-less
       key-over-value block for the device pages, where the info block must
       not crowd out the actions. `secondary` dampens rarely-read values. -->
  <!-- Compact basis: two columns inside the flex-wrap container (gap-x-5). -->
  <div
    v-if="isEnabled"
    :class="
      compact ? 'flex min-w-0 flex-col gap-0.5 flex-[0_0_calc(50%-0.625rem)]' : 'tns-stat-tile'
    "
  >
    <span class="tns-stat-label" :title="Name">{{ Name }}</span>
    <span :class="valueClasses">
      <span class="truncate">{{ Value }}</span>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isEnabled: {
    type: Boolean,
    default: true,
  },
  Name: {
    type: String,
    default: 'Name:',
  },
  Value: {
    type: [String, Number],
    default: '1234',
  },
  compact: {
    type: Boolean,
    default: false,
  },
  // Compact only: one step smaller and muted (e.g. meridian flip, pier side).
  secondary: {
    type: Boolean,
    default: false,
  },
});

const valueClasses = computed(() => {
  if (!props.compact) return 'tns-stat-value';
  return props.secondary
    ? 'flex min-w-0 items-center gap-1.5 text-xs font-medium leading-tight tabular-nums text-content-muted'
    : 'flex min-w-0 items-center gap-1.5 text-sm font-semibold leading-tight tabular-nums text-content';
});
</script>

<style scoped></style>
