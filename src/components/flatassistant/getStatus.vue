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
        <span>{{
          $t('components.flatassistant.status_running', {
            completed: flatsStore.status.CompletedIterations,
            total: flatsStore.status.TotalIterations,
          })
        }}</span>
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

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useFlatassistantStore } from '@/store/flatassistantStore';

const flatsStore = useFlatassistantStore();

const progressPercent = computed(() => {
  const { TotalIterations, CompletedIterations } = flatsStore.status;
  if (TotalIterations <= 0 || CompletedIterations < 0) return 0;
  return Math.min(100, Math.round((CompletedIterations / TotalIterations) * 100));
});
</script>
