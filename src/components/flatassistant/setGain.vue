<template>
  <div
    v-if="store.cameraInfo.Gains && store.cameraInfo.Gains.length > 0"
    class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg"
  >
    <label for="gain" class="text-sm mr-3 mb-1 text-gray-400">
      {{ $t('components.camera.gain_iso') }}
    </label>
    <select
      id="gain"
      v-model.number="settingsStore.camera.gain"
      class="default-select ml-auto h-8 w-28"
    >
      <option v-for="(value, key) in store.cameraInfo.Gains" :key="key" :value="value">
        {{ value }}
      </option>
    </select>
  </div>
  <NumberInputPicker
    v-else
    v-model="settingsStore.camera.gain"
    :label="$t('components.camera.gain_iso')"
    labelKey="components.camera.gain_iso"
    :min="0"
    :max="9999"
    :step="1"
    :decimalPlaces="0"
    placeholder="1"
    inputId="gain"
  />
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const settingsStore = useSettingsStore();
const store = apiStore();
</script>
