<template>
  <div class="guider-status">
    <div class="flex items-center gap-3">
      <div class="status-indicator" :class="statusClasses">
        <div class="status-dot"></div>
      </div>
      <div>
        <p class="font-semibold text-sm">{{ $t('components.guider.statusLabel') }}</p>
        <p class="text-lg font-bold" :class="statusTextClasses">{{ statusText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { apiStore } from '@/store/store';
import { useI18n } from 'vue-i18n';

const store = apiStore();
const { t: $t } = useI18n();

const statusText = computed(() => {
  const state = store.guiderInfo?.State;
  if (!state) return $t('components.guider.status.unknown');
  
  switch (state) {
    case 'Looping': return $t('components.guider.status.looping');
    case 'LostLock': return $t('components.guider.status.lostLock');
    case 'Guiding': return $t('components.guider.status.guiding');
    case 'Stopped': return $t('components.guider.status.stopped');
    case 'Calibrating': return $t('components.guider.status.calibrating');
    default: return state;
  }
});

const statusClasses = computed(() => {
  const state = store.guiderInfo?.State;
  
  return {
    'status-guiding': state === 'Guiding',
    'status-calibrating': state === 'Calibrating',
    'status-looping': state === 'Looping',
    'status-error': state === 'LostLock',
    'status-stopped': state === 'Stopped',
    'status-unknown': !state
  };
});

const statusTextClasses = computed(() => {
  const state = store.guiderInfo?.State;
  
  return {
    'text-green-400': state === 'Guiding',
    'text-blue-400': state === 'Calibrating',
    'text-yellow-400': state === 'Looping',
    'text-red-400': state === 'LostLock',
    'text-gray-400': state === 'Stopped',
    'text-gray-500': !state
  };
});
</script>

<style scoped>
.guider-status {
  @apply p-4 bg-gray-800/50 rounded-lg border border-gray-700/50;
}

.status-indicator {
  @apply relative w-4 h-4 rounded-full flex items-center justify-center;
}

.status-dot {
  @apply w-3 h-3 rounded-full animate-pulse;
}

.status-guiding .status-dot {
  @apply bg-green-500 shadow-lg shadow-green-500/50;
}

.status-calibrating .status-dot {
  @apply bg-blue-500 shadow-lg shadow-blue-500/50;
}

.status-looping .status-dot {
  @apply bg-yellow-500 shadow-lg shadow-yellow-500/50;
}

.status-error .status-dot {
  @apply bg-red-500 shadow-lg shadow-red-500/50;
}

.status-stopped .status-dot {
  @apply bg-gray-500 shadow-lg shadow-gray-500/50;
  animation: none;
}

.status-unknown .status-dot {
  @apply bg-gray-600 shadow-lg shadow-gray-600/50;
  animation: none;
}
</style>