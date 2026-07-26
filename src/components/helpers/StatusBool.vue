<template>
  <!-- Default: stat tile (status bar detail panels). Compact: inline state
       chip (dot + text) for the device pages — states are traffic lights,
       not measurements, so they share one quiet line there. -->
  <div :class="compact ? 'flex min-w-0 flex-none items-center' : ['tns-stat-tile', tileClass]">
    <span v-if="label && !compact" class="tns-stat-label" :title="label">{{ label }}</span>
    <span
      :class="[
        compact
          ? 'flex min-w-0 items-center gap-1.5 text-xs font-semibold leading-tight'
          : 'tns-stat-value',
        valueClass,
      ]"
    >
      <span class="tns-dot" :class="dotClass"></span>
      <span class="truncate">{{ isEnabled ? enabledText : disabledText }}</span>
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
  enabledText: {
    type: String,
    default: 'Ein',
  },
  disabledText: {
    type: String,
    default: 'Aus',
  },
  label: {
    type: String,
    default: '',
  },
  state: {
    type: String,
    default: null,
    validator: (value) => value === null || ['ok', 'idle', 'warn', 'danger'].includes(value),
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

const resolvedState = computed(() => props.state ?? (props.isEnabled ? 'ok' : 'idle'));

const tileClass = computed(() => {
  if (resolvedState.value === 'warn') return 'tns-stat-tile-warn';
  if (resolvedState.value === 'danger') return 'tns-stat-tile-danger';
  return '';
});

const dotClass = computed(() => {
  switch (resolvedState.value) {
    case 'ok':
      return 'bg-status-ok';
    case 'warn':
      return 'bg-status-warn';
    case 'danger':
      return 'bg-status-danger';
    default:
      return 'bg-content-faint';
  }
});

const valueClass = computed(() => {
  switch (resolvedState.value) {
    case 'warn':
      return 'text-status-warn';
    case 'danger':
      return 'text-status-danger';
    case 'idle':
      return 'text-content-muted';
    default:
      return '';
  }
});
</script>

<style scoped></style>
