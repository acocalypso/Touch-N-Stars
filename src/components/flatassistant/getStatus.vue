<template>
  <div class="w-full space-y-2">
    <!-- Running: spinner + progress bar -->
    <template v-if="flatsStore.status.State === 'Running'">
      <!-- Queue position indicator (only when multiple filters are queued) -->
      <div
        v-if="flatsStore.filterQueue.length > 1 && flatsStore.filterQueueIndex >= 0"
        class="text-xs font-medium text-cyan-400"
      >
        {{
          $t('components.flatassistant.filter_queue_progress', {
            current: flatsStore.filterQueueIndex + 1,
            total: flatsStore.filterQueue.length,
            name: flatsStore.filterQueue[flatsStore.filterQueueIndex]?.name ?? '',
          })
        }}
      </div>
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
      <!-- Multi-filter breakdown -->
      <template v-if="flatsStore.lastRun.filterResults">
        <div v-for="(r, i) in flatsStore.lastRun.filterResults" :key="i" class="space-y-0.5">
          <div
            class="flex items-center gap-2 text-sm"
            :class="
              r.success ? 'text-green-400' : r.completed > 0 ? 'text-yellow-400' : 'text-red-400'
            "
          >
            <span class="text-base shrink-0">{{
              r.success ? '✓' : r.completed > 0 ? '⚠' : '✗'
            }}</span>
            <span class="font-medium">{{
              r.filterName ?? $t('components.flatassistant.no_filter')
            }}</span>
            <span class="text-xs opacity-75">
              {{
                r.success
                  ? $t('components.flatassistant.status_success', { count: r.total })
                  : r.completed > 0
                    ? $t('components.flatassistant.status_stopped', {
                        completed: r.completed,
                        total: r.total,
                      })
                    : $t('components.flatassistant.status_failed')
              }}
            </span>
          </div>
          <div v-if="!r.success && r.lastADU !== null" class="text-xs text-gray-400 pl-6">
            {{ $t('components.flatassistant.status_adu_live', { adu: r.lastADU }) }}
          </div>
        </div>
      </template>

      <!-- Single-filter outcome -->
      <template v-else>
        <!-- All flats captured -->
        <div
          v-if="flatsStore.lastRun.success"
          class="flex items-center gap-2 text-sm text-green-400"
        >
          <span class="text-base">✓</span>
          <span>{{
            $t('components.flatassistant.status_success', { count: flatsStore.lastRun.total })
          }}</span>
        </div>
        <!-- Stopped part-way through -->
        <div
          v-else-if="flatsStore.lastRun.completed > 0"
          class="flex items-center gap-2 text-sm text-yellow-400"
        >
          <span class="text-base">⚠</span>
          <span>{{
            $t('components.flatassistant.status_stopped', {
              completed: flatsStore.lastRun.completed,
              total: flatsStore.lastRun.total,
            })
          }}</span>
        </div>
        <!-- Zero flats taken -->
        <div v-else class="space-y-1">
          <div class="flex items-center gap-2 text-sm text-red-400">
            <span class="text-base">✗</span>
            <span>{{ $t('components.flatassistant.status_failed') }}</span>
          </div>
          <div v-if="flatsStore.lastRun.lastADU !== null" class="text-xs text-gray-400 pl-5">
            {{
              $t('components.flatassistant.status_adu_live', { adu: flatsStore.lastRun.lastADU })
            }}
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useFlatassistantStore } from '@/store/flatassistantStore';

const flatsStore = useFlatassistantStore();

const progressPercent = computed(() => {
  const { TotalIterations, CompletedIterations } = flatsStore.status;
  if (TotalIterations <= 0 || CompletedIterations < 0) return 0;
  return Math.min(100, Math.round((CompletedIterations / TotalIterations) * 100));
});

onMounted(() => {
  flatsStore.startFetchingFlats();
});

onBeforeUnmount(() => {
  flatsStore.stopFetchingFlats();
});
</script>
