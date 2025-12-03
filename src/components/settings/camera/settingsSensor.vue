<template>
  <div
    class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
  >
    <h3 class="font-bold text-base text-cyan-400">
      {{ $t('components.camera.chip_settings.title') }}
    </h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <NumberInputPicker
        v-model="pixelSize"
        :label="$t('components.camera.chip_settings.pixel_size')"
        labelKey="components.camera.chip_settings.pixel_size"
        :min="0.01"
        :max="50"
        :step="0.01"
        :decimalPlaces="2"
        inputId="pixel-size"
        @change="updatePixelSize"
      />

      <NumberInputPicker
        v-model="chipHigh"
        :label="$t('components.camera.chip_settings.height')"
        labelKey="components.camera.chip_settings.height"
        :min="100"
        :max="10000"
        :step="1"
        :decimalPlaces="0"
        inputId="chip-high"
        @change="updateChipHigh"
      />

      <NumberInputPicker
        v-model="chipWidth"
        :label="$t('components.camera.chip_settings.width')"
        labelKey="components.camera.chip_settings.width"
        :min="100"
        :max="10000"
        :step="1"
        :decimalPlaces="0"
        inputId="chip-width"
        @change="updateChipWidth"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const store = apiStore();

const pixelSize = ref(0);
const chipHigh = ref(0);
const chipWidth = ref(0);

async function updatePixelSize() {
  try {
    await apiService.profileChangeValue('CameraSettings-PixelSize', pixelSize.value);
  } catch (error) {
    console.error('Error updating PixelSize:', error);
  }
}

async function updateChipHigh() {
  try {
    await apiService.profileChangeValue('FramingAssistantSettings-CameraHeight', chipHigh.value);
  } catch (error) {
    console.error('Error updating ChipHigh:', error);
  }
}

async function updateChipWidth() {
  try {
    await apiService.profileChangeValue('FramingAssistantSettings-CameraWidth', chipWidth.value);
  } catch (error) {
    console.error('Error updating ChipWidth:', error);
  }
}

onMounted(() => {
  const profile = store.profileInfo;
  pixelSize.value = profile?.CameraSettings?.PixelSize || 5.0;
  chipHigh.value = profile?.FramingAssistantSettings?.CameraHeight || 1501;
  chipWidth.value = profile?.FramingAssistantSettings?.CameraWidth || 3001;
});
</script>
