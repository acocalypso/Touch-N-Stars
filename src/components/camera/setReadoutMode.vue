<template>
  <div class="flex flex-col items-center gap-2 w-full">
    <div class="flex flex-col border border-slate-600/40 p-3 rounded-lg w-full">
      <div
        v-if="!store.checkVersionNewerOrEqual(store.currentApiVersion, '2.2.14.3')"
        class="flex items-center justify-between mb-2 border border-gray-500 p-1 md:p-2 rounded-lg"
      >
        <label for="setReadoutMode" class="text-xs md:text-sm text-gray-200 font-medium">
          {{ $t('components.camera.readout_mode') }}
        </label>
        <select
          @change="setReadoutMode"
          id="setReadoutMode"
          v-model="cameraStore.readoutMode"
          class="default-select h-7 md:h-8 w-20 md:w-28"
        >
          <option
            v-for="(mode, index) in store.cameraInfo.ReadoutModes"
            :key="index"
            :value="index"
          >
            {{ mode }}
          </option>
        </select>
      </div>
      <div v-else>
        <div class="flex flex-col justify-between sm:flex-row gap-2">
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
              <option
                v-for="(mode, index) in store.cameraInfo.ReadoutModes"
                :key="index"
                :value="index"
              >
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
              <option
                v-for="(mode, index) in store.cameraInfo.ReadoutModes"
                :key="index"
                :value="index"
              >
                {{ mode }}
              </option>
            </select>
          </div>
        </div>
      </div>
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

  const readoutMode = store.cameraInfo.ReadoutMode ?? 0; // Falls undefined -> Standardwert 0
  cameraStore.readoutMode = readoutMode;

  readoutModeImage.value = store.profileInfo.CameraSettings.ReadoutModeForNormalImages;
  readoutModeSnap.value = store.profileInfo.CameraSettings.ReadoutModeForSnapImages;
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

async function setReadoutModeImage() {
  try {
    const response = await apiService.setReadoutModeType('image', readoutModeImage.value);
    console.log('[setReadoutMode] ', response);
    await apiService.profileChangeValue(
      'CameraSettings-ReadoutModeForNormalImages',
      readoutModeImage.value
    );
  } catch (error) {
    console.log('Error while setting readoutMode');
  }
}

async function setReadoutModeSnap() {
  try {
    const response = await apiService.setReadoutModeType('snapshot', readoutModeSnap.value);
    console.log('[setReadoutMode] ', response);
    await apiService.profileChangeValue(
      'CameraSettings-ReadoutModeForSnapImages',
      readoutModeSnap.value
    );
  } catch (error) {
    console.log('Error while setting readoutMode');
  }
}
</script>
