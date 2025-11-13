<template>
  <div class="flex flex-col gap-3 p-3 bg-gray-800/50 rounded-lg">
    <!-- Range Slider Bar mit zwei Griffen -->
    <div v-if="dataLength > 0" class="flex flex-col gap-3">
      <!-- Time Display -->
      <div class="flex justify-between items-center text-xs text-gray-400">
        <span>{{ formatTime(currentStartIndex) }}</span>
        <span class="text-cyan-400">{{ displayedCount }} / {{ dataLength }}</span>
        <span>{{ formatTime(currentEndIndexValue) }}</span>
      </div>

      <!-- Dual Range Slider -->
      <div class="relative pt-2 pb-2 px-3">
        <!-- Background Track -->
        <div class="absolute top-1/2 left-0 right-0 h-2 bg-gray-700 rounded-full -translate-y-1/2"></div>

        <!-- Highlight Track (selected range) -->
        <div
          class="absolute top-1/2 h-2 bg-cyan-800 rounded-full pointer-events-none -translate-y-1/2"
          :style="{
            left: dataLength > 1 ? `${(currentStartIndex / (dataLength - 1)) * 100}%` : '0%',
            right: dataLength > 1 ? `${((dataLength - 1 - currentEndIndexValue) / (dataLength - 1)) * 100}%` : '0%',
          }"
        ></div>

        <!-- Start Thumb (visual only) -->
        <div
          class="absolute top-1/2 w-6 h-6 bg-cyan-600 rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none shadow-lg"
          :style="{
            left: dataLength > 1 ? `${(currentStartIndex / (dataLength - 1)) * 100}%` : '0%',
          }"
        ></div>

        <!-- End Thumb (visual only) -->
        <div
          class="absolute top-1/2 w-6 h-6 bg-cyan-600 rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none shadow-lg"
          :style="{
            left: dataLength > 1 ? `${(currentEndIndexValue / (dataLength - 1)) * 100}%` : '0%',
          }"
        ></div>

        <!-- Start Slider (invisible, for input) -->
        <input
          type="range"
          min="0"
          :max="dataLength - 1"
          :value="currentStartIndex"
          @input="updateStartIndex"
          class="absolute w-full top-1/2 -translate-y-1/2 h-8 appearance-none bg-transparent rounded-full cursor-pointer slider-input"
          style="z-index: 5"
        />

        <!-- End Slider (invisible, for input) -->
        <input
          type="range"
          min="0"
          :max="dataLength - 1"
          :value="currentEndIndexValue"
          @input="updateEndIndex"
          class="absolute w-full top-1/2 -translate-y-1/2 h-8 appearance-none bg-transparent rounded-full cursor-pointer slider-input"
          style="z-index: 4"
        />
      </div>

      <!-- Reset Button -->
      <button
        v-if="currentStartIndex !== 0 || currentEndIndex !== null"
        @click="resetTimeRange"
        class="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-all duration-150"
      >
        Reset
      </button>
    </div>

    <div v-else class="text-xs text-gray-500">No data available</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';

const settingsStore = useSettingsStore();
const apiStoreInstance = apiStore();

const dataLength = computed(() => apiStoreInstance.imageHistoryInfo?.length ?? 0);

const currentStartIndex = computed(
  () => settingsStore.monitorViewSetting.historyTimeRange.startIndex
);

const currentEndIndex = computed(() => settingsStore.monitorViewSetting.historyTimeRange.endIndex);

const currentEndIndexValue = computed(() => (currentEndIndex.value !== null ? currentEndIndex.value : dataLength.value - 1));

const displayedCount = computed(() => {
  return currentEndIndexValue.value - currentStartIndex.value + 1;
});

function updateStartIndex(event) {
  const newStart = parseInt(event.target.value, 10);
  // Wenn Start über End geht, swap sie
  if (newStart > currentEndIndexValue.value) {
    settingsStore.setHistoryTimeRange(currentEndIndexValue.value, newStart);
  } else {
    settingsStore.setHistoryTimeRange(newStart, currentEndIndex.value);
  }
}

function updateEndIndex(event) {
  const newEnd = parseInt(event.target.value, 10);
  // Wenn End unter Start geht, swap sie
  if (newEnd < currentStartIndex.value) {
    settingsStore.setHistoryTimeRange(newEnd, currentStartIndex.value);
  } else {
    settingsStore.setHistoryTimeRange(currentStartIndex.value, newEnd);
  }
}

function resetTimeRange() {
  settingsStore.resetHistoryTimeRange();
}

function formatTime(index) {
  const allData = apiStoreInstance.imageHistoryInfo || [];
  if (index >= 0 && index < allData.length) {
    return new Date(allData[index].Date).toLocaleTimeString();
  }
  return '';
}
</script>

<style scoped>
/* Custom dual range slider styling */
.slider-input {
  -webkit-appearance: none;
  appearance: none;
  pointer-events: none;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  pointer-events: all;
}

.slider-input::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  border: none;
  pointer-events: all;
}

/* Remove default track styling */
.slider-input::-webkit-slider-runnable-track {
  background: transparent;
  height: 8px;
  border: none;
}

.slider-input::-moz-range-track {
  background: transparent;
  border: none;
}

.slider-input::-moz-range-progress {
  background: transparent;
}
</style>
