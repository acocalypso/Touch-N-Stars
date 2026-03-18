<template>
  <div class="flex flex-col gap-2 w-full">
    <div
      class="flex items-center justify-between flex-1 border border-gray-500 p-1 md:p-2 rounded-lg"
    >
      <label for="setReadoutModeImage" class="text-xs md:text-sm text-gray-200 font-medium">
        {{ $t('components.camera.readout_mode_image') }}
      </label>
      <select
        @change="setReadoutModeImage()"
        id="setReadoutModeImage"
        v-model="readoutModeImage"
        class="default-select h-7 md:h-8 w-20 md:w-28"
      >
        <option v-for="(mode, index) in store.cameraInfo.ReadoutModes" :key="index" :value="index">
          {{ mode }}
        </option>
      </select>
    </div>

    <div
      class="flex items-center justify-between flex-1 border border-gray-500 p-1 md:p-2 rounded-lg"
    >
      <label for="setReadoutModeSnap" class="text-xs md:text-sm text-gray-200 font-medium">
        {{ $t('components.camera.readout_mode_snap') }}
      </label>
      <select
        @change="setReadoutModeSnap()"
        id="setReadoutModeSnap"
        v-model="readoutModeSnap"
        class="default-select h-7 md:h-8 w-20 md:w-28"
      >
        <option v-for="(mode, index) in store.cameraInfo.ReadoutModes" :key="index" :value="index">
          {{ mode }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiStore } from '@/store/store';
import { useCameraStore } from '@/store/cameraStore';
import apiService from '@/services/apiService';

const store = apiStore();
const cameraStore = useCameraStore();
const readoutModeImage = ref('');
const readoutModeSnap = ref('');

onMounted(() => {
  initializeReadoutMode();
});

const initializeReadoutMode = () => {
  if (!store.cameraInfo) {
    console.warn('Camera info not loaded');
    return;
  }
  readoutModeImage.value = store.cameraInfo.ReadoutModeForNormalImages;
  readoutModeSnap.value = store.cameraInfo.ReadoutModeForSnapImages;
};

async function setReadoutModeImage() {
  try {
    const response = await apiService.cameraAction(
      `set-setting?settingName=ReadoutModeForNormalImages&newValue=${readoutModeImage.value}`
    );
    console.log('[setReadoutMode] ', response);
    await cameraStore.readSettings();
  } catch (error) {
    console.log('Error while setting readoutMode');
  }
}

async function setReadoutModeSnap() {
  try {
    const response = await apiService.cameraAction(
      `set-setting?settingName=ReadoutModeForSnapImages&newValue=${readoutModeSnap.value}`
    );
    console.log('[setReadoutMode] ', response);
    await cameraStore.readSettings();
  } catch (error) {
    console.log('Error while setting readoutMode');
  }
}
</script>
