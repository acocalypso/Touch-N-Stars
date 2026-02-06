<template>
  <div
    class="flex items-center justify-between w-full border border-gray-500 p-1 md:p-2 rounded-lg"
  >
    <label for="binning" class="text-xs md:text-sm text-gray-200 font-medium">
      {{ $t('components.camera.binning_mode') }}
    </label>
    <select
      @change="setBinnig"
      id="binning"
      v-model="cameraStore.binningMode"
      class="default-select h-7 md:h-8 w-20 md:w-28"
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
    console.warn('Camera info not loaded');
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
    console.log('Error while setting binning');
  }
}
</script>
