<template>
  <div class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg">
    <label for="gain" class="text-sm mr-3 mb-1 text-gray-400">
      {{ $t('components.camera.gain_iso') }}
    </label>
    <select
      v-if="store.cameraInfo.Gains && store.cameraInfo.Gains.length > 0"
      id="gain"
      v-model.number="settingsStore.camera.gain"
      class="default-select ml-auto h-8 w-28"
    >
      <option v-for="(value, key) in store.cameraInfo.Gains" :key="key" :value="value">
        {{ value }}
      </option>
    </select>
    <input
      v-else
      id="gain"
      v-model.number="settingsStore.camera.gain"
      type="number"
      class="default-input ml-auto h-8 w-28"
      placeholder="1"
    />
  </div>
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';

const settingsStore = useSettingsStore();
const store = apiStore();
</script>
