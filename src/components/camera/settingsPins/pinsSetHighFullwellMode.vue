<template>
  <div v-if="cameraStore.cameraSettings.HasHighFullwell" class="w-full">
    <div class="flex items-center justify-between border border-gray-500 p-1 md:p-2 rounded-lg">
      <label for="DewHeater" class="text-xs md:text-sm text-gray-200 font-medium">
        {{ $t('components.camera.HighFullwellMode') }}
      </label>
      <toggleButton
        @click="toggleMode"
        :status-value="cameraStore.cameraSettings.HighFullwellMode"
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
  if (cameraStore.cameraSettings.HighFullwellMode) {
    try {
      const data = await apiService.cameraAction(
        `set-setting?settingName=HighFullwellMode&newValue=false`
      );
    } catch (error) {
      console.log('Error:', error);
    }
  } else {
    try {
      const data = await apiService.cameraAction(
        `set-setting?settingName=HighFullwellMode&newValue=true`
      );
    } catch (error) {
      console.log('Error:', error);
    }
  }
  await cameraStore.readSettings();
}
</script>
