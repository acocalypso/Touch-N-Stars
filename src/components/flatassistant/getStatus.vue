<template>
  <div class="w-full space-y-2">
    <!-- Running: spinner + progress bar -->
    <template v-if="flatsStore.status.State === 'Running'">
      <div class="flex items-center gap-2 text-sm text-gray-200">
        <svg
          class="animate-spin h-4 w-4 text-cyan-400 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span>{{ runningStatusText }}</span>
      </div>
      <div v-if="flatsStore.status.TotalFilters > 0" class="text-xs text-gray-400">
        {{
          $t('components.flatassistant.status_filter_progress', {
            completed: flatsStore.status.CompletedFilters + 1,
            total: flatsStore.status.TotalFilters,
          })
        }}
      </div>
      <div class="w-full bg-gray-700 rounded-full h-2">
        <div
          class="bg-cyan-500 h-2 rounded-full transition-all duration-500"
          :style="{ width: progressPercent + '%' }"
        />
      </div>
      <div v-if="flatsStore.currentADU !== null" class="text-xs text-gray-400">
        {{ $t('components.flatassistant.status_adu_live', { adu: flatsStore.currentADU }) }}
      </div>
    </template>

    <!-- Finished: show outcome -->
    <template v-else-if="flatsStore.lastRun">
      <!-- All flats captured -->
      <div v-if="flatsStore.lastRun.success" class="flex items-center gap-2 text-sm text-green-400">
        <span class="text-base">✓</span>
        <span>{{ successStatusText }}</span>
      </div>
      <!-- Stopped part-way through (user cancel or mid-run error) -->
      <div
        v-else-if="flatsStore.lastRun.completed > 0"
        class="flex items-center gap-2 text-sm text-yellow-400"
      >
        <span class="text-base">⚠</span>
        <span>{{ stoppedStatusText }}</span>
      </div>
      <!-- Zero flats taken — determination phase failed (e.g. too dim at max exposure) -->
      <div v-else class="space-y-1">
        <div class="flex items-center gap-2 text-sm text-red-400">
          <span class="text-base">✗</span>
          <span>{{ failedStatusText }}</span>
        </div>
        <div v-if="flatsStore.lastRun.lastADU !== null" class="text-xs text-gray-400 pl-5">
          {{ $t('components.flatassistant.status_adu_live', { adu: flatsStore.lastRun.lastADU }) }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useFlatassistantStore } from '@/store/flatassistantStore';
import { onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const flatsStore = useFlatassistantStore();
const { t } = useI18n();

const runningStatusText = computed(() =>
  t(
    flatsStore.currentRunType === 'darks'
      ? 'components.flatassistant.status_running_darks'
      : 'components.flatassistant.status_running_flats',
    {
      completed: flatsStore.status.CompletedIterations,
      total: flatsStore.status.TotalIterations,
    }
  )
);

const successStatusText = computed(() =>
  t(
    flatsStore.lastRun?.type === 'darks'
      ? 'components.flatassistant.status_success_darks'
      : 'components.flatassistant.status_success_flats',
    { count: flatsStore.lastRun?.total ?? 0 }
  )
);

const stoppedStatusText = computed(() =>
  t(
    flatsStore.lastRun?.type === 'darks'
      ? 'components.flatassistant.status_stopped_darks'
      : 'components.flatassistant.status_stopped_flats',
    {
      completed: flatsStore.lastRun?.completed ?? 0,
      total: flatsStore.lastRun?.total ?? 0,
    }
  )
);

const failedStatusText = computed(() =>
  t(
    flatsStore.lastRun?.type === 'darks'
      ? 'components.flatassistant.status_failed_darks'
      : 'components.flatassistant.status_failed_flats'
  )
);

const progressPercent = computed(() => {
  const { TotalIterations, CompletedIterations } = flatsStore.status;
  if (TotalIterations <= 0 || CompletedIterations < 0) return 0;
  return Math.min(100, Math.round((CompletedIterations / TotalIterations) * 100));
});
</script>
