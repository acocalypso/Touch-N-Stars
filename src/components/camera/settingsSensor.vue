<template>
  <div>
    <div class="space-y-1 border border-gray-500 p-1 md:p-2 pb-2 rounded-lg">
      <label for="Cooler" class="text-xs mb-1 text-gray-200"
        >{{ $t('components.camera.chip_settings.title') }}
      </label>

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

        <NumberInputPicker
          v-model="focalLength"
          :label="$t('components.camera.chip_settings.focal_length')"
          labelKey="components.camera.chip_settings.focal_length"
          :min="10"
          :max="5000"
          :step="1"
          :decimalPlaces="0"
          inputId="focal-length"
          @change="updateFocalLength"
        />
      </div>
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
const focalLength = ref(0);
const chipHigh = ref(0);
const chipWidth = ref(0);

async function updatePixelSize() {
  try {
    await apiService.profileChangeValue('CameraSettings-PixelSize', pixelSize.value);
  } catch (error) {
    console.error('Error updating PixelSize:', error);
  }
}

async function updateFocalLength() {
  try {
    await apiService.profileChangeValue('TelescopeSettings-FocalLength', focalLength.value);
  } catch (error) {
    console.error('Error updating FocalLength:', error);
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
  focalLength.value = profile?.TelescopeSettings?.FocalLength || 500;
  chipHigh.value = profile?.FramingAssistantSettings?.CameraHeight || 1501;
  chipWidth.value = profile?.FramingAssistantSettings?.CameraWidth || 3001;
});
</script>
