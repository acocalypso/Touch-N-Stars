<template>
  <div class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg">
    <label for="count" class="text-sm mr-3 mb-1 text-gray-400">
      {{ $t('components.flatassistant.exposure_time') }}
    </label>
    <input
      id="count"
      v-model.number="settingsStore.flats.exposureTime"
      type="number"
      class="default-input ml-auto h-8 w-28"
    />
  </div>
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
const settingsStore = useSettingsStore();
</script>
