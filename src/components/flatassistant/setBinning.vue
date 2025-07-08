<template>
  <div class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg">
    <label for="gain" class="text-sm mr-3 mb-1 text-gray-400">
      {{ $t('components.camera.binning_mode') }}
    </label>
    <select
      @change="setBinnig"
      id="binning"
      v-model="cameraStore.binningMode"
      class="default-select ml-auto h-8 w-28"
    >
      <option v-for="mode in store.cameraInfo.BinningModes" :key="mode.Name" :value="mode.Name">
        {{ mode.Name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { apiStore } from '@/store/store';
import { useCameraStore } from '@/store/cameraStore';
import apiService from '@/services/apiService';

const store = apiStore();
const cameraStore = useCameraStore();

onMounted(() => {
  initializeBinningMode();
});

// Setzt den initialen Binning Mode aus BinX und BinY
const initializeBinningMode = () => {
  if (!store.cameraInfo) {
    console.warn('Kamera-Info nicht geladen');
    return;
  }

  const binX = store.cameraInfo.BinX ?? 1; // Falls undefined -> Standardwert 1
  const binY = store.cameraInfo.BinY ?? 1;
  cameraStore.binningMode = `${binX}x${binY}`;
};

async function setBinnig() {
  console.log('Set binning to: ', cameraStore.binningMode);
  try {
    const data = await apiService.setBinningMode(cameraStore.binningMode);
    console.log(data);
  } catch (error) {
    console.log('Fehler beim setzten des binning');
  }
}
</script>
