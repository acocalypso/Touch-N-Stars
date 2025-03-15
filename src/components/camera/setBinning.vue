<template>
  <div
    class="flex flex-row sm:flex-col w-full sm:w-auto items-center min-w-28 border border-gray-500 p-1 rounded-lg"
  >
    <label for="binning" class="text-sm sm:text-xs mr-3 mb-1 text-gray-400">
      {{ $t('components.camera.binning_mode') }}
    </label>
    <select
      @change="setBinnig"
      id="binning"
      v-model="cameraStore.binningMode"
      class="ml-auto text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-700"
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
