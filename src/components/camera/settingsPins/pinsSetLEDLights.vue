<template>
  <div v-if="cameraStore.cameraSettings.CanSetLEDLights" class="w-full">
    <div class="flex items-center justify-between border border-gray-500 p-1 md:p-2 rounded-lg">
      <label for="LEDLights" class="text-xs md:text-sm text-gray-200 font-medium">
        {{ $t('components.camera.LEDLights') }}
      </label>
      <toggleButton
        @click="toggleMode"
        :status-value="cameraStore.cameraSettings.LEDLights"
        class="h-7 md:h-8"
      />
    </div>
  </div>
</template>
<script setup>
import apiService from '@/services/apiService';
import { useCameraStore } from '@/store/cameraStore';
import toggleButton from '@/components/helpers/toggleButton.vue';

const cameraStore = useCameraStore();

async function toggleMode() {
  if (cameraStore.cameraSettings.LEDLights) {
    try {
      const data = await apiService.cameraAction(
        `set-setting?settingName=LEDLights&newValue=false`
      );
    } catch (error) {
      console.log('Error:', error);
    }
  } else {
    try {
      const data = await apiService.cameraAction(
        `set-setting?settingName=LowNoiseMode&newValue=true`
      );
    } catch (error) {
      console.log('Error:', error);
    }
  }
  await cameraStore.readSettings();
}
</script>
