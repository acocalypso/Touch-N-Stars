<template>
  <div
    class="flex flex-row sm:flex-col w-full sm:w-auto items-center min-w-28 border border-gray-500 p-1 md:p-2 rounded-lg"
  >
    <label for="gain" class="text-xs md:text-sm mr-3 mb-1 text-gray-200">
      {{ $t('components.camera.readout_mode') }}
    </label>
    <select
      @change="setReadoutMode"
      id="setReadoutMode"
      v-model="cameraStore.readoutMode"
      class="default-select ml-auto h-7 md:h-8 w-20 md:w-28"
    >
      <option v-for="(mode, index) in store.cameraInfo.ReadoutModes" :key="index" :value="index">
        {{ mode }}
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
  initializeReadoutMode();
});

const initializeReadoutMode = () => {
  if (!store.cameraInfo) {
    console.warn('Camera info not loaded');
    return;
  }

  const readoutMode = store.cameraInfo.ReadoutMode ?? 0; // Falls undefined -> Standardwert 0
  cameraStore.readoutMode = readoutMode;
};

async function setReadoutMode() {
  console.log('Set Readout to: ', cameraStore.readoutMode);
  try {
    const data = await apiService.setReadoutMode(cameraStore.readoutMode);
    console.log(data);
  } catch (error) {
    console.log('Error while setting readoutMode');
  }
}
</script>
