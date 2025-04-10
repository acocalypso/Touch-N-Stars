<template>
  <div class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg">
    <label for="count" class="text-sm mr-3 mb-1 text-gray-400">
      {{ $t('components.flatassistant.brightness') }}
    </label>
    <input
      @blur="updatePixelSize"
      id="count"
      v-model.number="pixelSize"
      type="number"
      class="ml-auto text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-700"
    />
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { handleApiError } from '@/utils/utils';

const store = apiStore();
const pixelSize = ref(0);
const chipHigh = ref(0);
const chipWidth = ref(0);
const focalLength = ref(0);
const statusClassPixelSize = ref('');

async function updatePixelSize() {
  try {
    const response = await apiService.domeAction(`slew?azimuth=${azimuth.value}`);
    if (handleApiError(response, { title: 'Update Error' })) {
      return;
    }
  } catch (error) {
    isSlewing.value = false;
    console.error('Error udate settings:', error);
  }

  statusClassPixelSize.value = 'glow-green';
}

async function slewDome() {
  isSlewing.value = true;
  try {
    const response = await apiService.domeAction(`slew?azimuth=${azimuth.value}`);

    if (handleApiError(response, { title: 'Slew Error' })) {
      isSlewing.value = false;
      return;
    }

    if (store.domeInfo.Azimuth.toFixed(0) === azimuth.value.toFixed(0)) {
      console.log('Slewing to the same azimuth, stopping slew.');
      isSlewing.value = false;
    } else {
      console.log('Slewing to azimuth:', azimuth.value);
    }
  } catch (error) {
    isSlewing.value = false;
    console.error('Error stopping slew:', error);
  }
}

onMounted(() => {
  pixelSize.value = store.profileInfo.CameraSettings.PixelSize || 5.0;
  focalLength.value = store.profileInfo.TelescopeSettings.FocalLength || 500;
  chipHigh.value = store.profileInfo.FramingAssistantSettings.CameraHeight || 1500;
  chipWidth.value = store.profileInfo.FramingAssistantSettings.CameraWidth || 3000;
});
</script>
<style scoped>
.glow-green {
  box-shadow: 0 0 10px #00ff00; /* Grüner Schein */
}
</style>
