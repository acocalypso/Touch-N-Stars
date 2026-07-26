<template>
  <div
    class="flex items-center justify-between w-full border border-line-strong p-1 md:p-2 rounded-control"
  >
    <label for="binning" class="text-xs md:text-sm text-content font-medium">
      {{ $t('components.camera.binning_mode') }}
    </label>
    <select
      @change="setBinnig"
      id="binning"
      v-model="cameraStore.binningMode"
      class="tns-select w-20 md:w-28"
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
    const cameraResponse = await apiService.setBinningMode(cameraStore.binningMode);
    console.log('[setBinning Camera] ', cameraResponse);
    const [binX, binY] = cameraStore.binningMode.split('x').map(Number);
    const profileX = await apiService.profileChangeValue('CameraSettings-BinningX', binX);
    console.log('[setBinning Profile BinningX] ', profileX);
    const profileY = await apiService.profileChangeValue('CameraSettings-BinningY', binY);
    console.log('[setBinning Profile BinningY] ', profileY);
  } catch (error) {
    console.log('[setBinning] Error while setting binning', error);
  }
}
</script>
