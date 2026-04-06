<template>
  <div
    v-if="camera"
    class="monitor-control-bar flex items-center justify-between px-3 py-2 bg-gray-900 bg-opacity-80 backdrop-blur-md border-t border-gray-800 shadow-lg"
  >
    <!-- Left: Last Update -->
    <div class="flex flex-col min-w-0">
      <span class="text-[10px] text-gray-500 font-mono whitespace-nowrap">{{
        lastUpdateTime
      }}</span>
    </div>

    <!-- Right: Auto-Refresh + Manual Refresh -->
    <div class="flex items-center space-x-2 shrink-0">
      <button
        @click="store.updateCamera(cameraId, { autoRefresh: !camera.autoRefresh })"
        class="flex items-center px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300"
        :class="
          camera.autoRefresh
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        "
        title="Auto-Refresh umschalten"
      >
        <span class="h-2 w-2 rounded-full shrink-0" :class="ledClass"></span>
        <span class="hidden sm:inline ml-2">Auto-Refresh</span>
      </button>

      <div class="w-px h-5 bg-gray-700"></div>

      <button
        @click="store.refreshCamera(cameraId)"
        class="p-1.5 rounded-md bg-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white transition-colors duration-200"
        title="Sofort aktualisieren"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useImageMonitorStore } from '../store/imageMonitorStore';

const props = defineProps({
  cameraId: { type: String, required: true },
});

const store = useImageMonitorStore();
const camera = computed(() => store.getCameraById(props.cameraId));
const status = computed(() => store.getCameraStatus(props.cameraId));

const lastUpdateTime = computed(() => {
  if (!status.value.lastUpdate) return '--:--:--';
  return new Date(status.value.lastUpdate).toLocaleTimeString();
});

const ledClass = computed(() => {
  if (!camera.value.autoRefresh) return 'bg-gray-500';
  if (status.value.isConnected) return 'bg-green-400 animate-pulse';
  return 'bg-orange-400 animate-pulse';
});
</script>
