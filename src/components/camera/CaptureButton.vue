<template>
  <!-- Capture Button -->
  <div class="flex gap-1">
    <button
      class="btn-primary w-full bg-gradient-to-br from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50"
      @click="
        cameraStore.capturePhoto(
          apiService,
          settingsStore.camera.exposureTime,
          settingsStore.camera.gain,
          settingsStore.camera.useSolve
        )
      "
      :disabled="cameraStore.loading || sequenceStore.sequenceRunning"
    >
      <template v-if="cameraStore.loading">
        <!-- Wenn Belichtung läuft -->
        <div v-if="cameraStore.isExposure" class="flex items-center">
          <svg class="w-6 h-6" viewBox="0 0 36 36">
            <path
              class="text-white text-opacity-30 fill-none stroke-current stroke-[2.8]"
              d="M18 2.0845
                           a 15.9155 15.9155 0 0 1 0 31.831
                           a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="fill-none stroke-current stroke-[2.8]"
              :style="{
                strokeDasharray: cameraStore.progress + ', 100',
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
              }"
              d="M18 2.0845
                           a 15.9155 15.9155 0 0 1 0 31.831
                           a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span class="ml-2 text-white text-sm font-medium">
            {{ $t('components.camera.capture_running') }}
            {{ cameraStore.remainingExposureTime }}s
          </span>
        </div>
        <!-- Wenn Bild gerade geladen wird -->
        <div v-else-if="cameraStore.isLoadingImage" class="flex items-center">
          <span class="loader ml-2"> </span>

          <span class="ml-2 text-white text-sm font-medium">
            {{ $t('components.camera.image_loading') }}
          </span>
        </div>
      </template>
      <template v-else>
        {{ $t('components.camera.start_capture') }}
      </template>
    </button>
    <!-- Cancel Button -->
    <button
      v-if="cameraStore.isExposure"
      @click="cameraStore.abortExposure(apiService)"
      class="flex items-center justify-center w-12 rounded-md bg-red-600 transition-all duration-200 shadow-lg hover:shadow-red-500/20"
    >
      <StopCircleIcon class="w-10" />
    </button>
  </div>
</template>
<script setup>
import apiService from '@/services/apiService';
import { useCameraStore } from '@/store/cameraStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSequenceStore } from '@/store/sequenceStore';
import { StopCircleIcon } from '@heroicons/vue/24/outline';

const cameraStore = useCameraStore();
const settingsStore = useSettingsStore();
const sequenceStore = useSequenceStore();

</script>
<style scoped>
.loader {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
