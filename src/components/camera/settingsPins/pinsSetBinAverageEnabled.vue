<template>
  <div class="w-full">
    <div class="flex items-center justify-between border border-gray-500 p-1 md:p-2 rounded-lg">
      <label for="BinAverageEnabled" class="text-xs md:text-sm text-gray-200 font-medium">
        {{ $t('components.camera.BinAverageEnabled') }}
      </label>
      <toggleButton
        @click="toggleMode"
        :status-value="cameraStore.cameraSettings.BinAverageEnabled"
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
  if (cameraStore.cameraSettings.BinAverageEnabled) {
    try {
      await apiService.cameraAction(`set-setting?settingName=BinAverageEnabled&newValue=false`);
    } catch (error) {
      console.log('Error:', error);
    }
  } else {
    try {
      await apiService.cameraAction(`set-setting?settingName=BinAverageEnabled&newValue=true`);
    } catch (error) {
      console.log('Error:', error);
    }
  }
  await cameraStore.readSettings();
}
</script>
