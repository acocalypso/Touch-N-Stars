<template>
  <div class="flex flex-col gap-3 p-3 bg-gray-800/50 rounded-lg">
    <div class="text-xs text-gray-400 font-semibold">Graph Data Sources</div>

    <div class="grid grid-cols-2 gap-3">
      <!-- First Data Source -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-400">Source 1</label>
        <select
          :value="dataSource1"
          @change="updateDataSource1"
          class="w-full px-2 py-1 text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded hover:bg-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
        >
          <option v-for="source in availableSources" :key="source" :value="source">
            {{ source }}
          </option>
        </select>
      </div>

      <!-- Second Data Source -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-400">Source 2</label>
        <select
          :value="dataSource2"
          @change="updateDataSource2"
          class="w-full px-2 py-1 text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded hover:bg-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
        >
          <option v-for="source in availableSources" :key="source" :value="source">
            {{ source }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '@/store/settingsStore';

const settingsStore = useSettingsStore();

const availableSources = [
  'Stars',
  'HFR',
  'Median',
  'Mean',
  'StDev',
  'Min',
  'Max',
  'Temperature',
  'Gain',
  'Offset',
  'ExposureTime',
];

const dataSource1 = computed(() => settingsStore.monitorViewSetting.graphDataSource1);
const dataSource2 = computed(() => settingsStore.monitorViewSetting.graphDataSource2);

function updateDataSource1(event) {
  settingsStore.setGraphDataSource1(event.target.value);
}

function updateDataSource2(event) {
  settingsStore.setGraphDataSource2(event.target.value);
}
</script>

<style scoped></style>
