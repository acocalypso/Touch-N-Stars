<template>
  <!-- Capture & Cancel Buttons -->
  <div
    class="fixed bottom-7 left-1/2 -translate-x-1/2 lg:top-1/2 lg:left-4 lg:-translate-y-1/2 lg:translate-x-0 lg:bottom-auto flex gap-4 items-center justify-center lg:flex-col z-10 bg-gray-900/50 backdrop-blur-md p-3 rounded-xl border border-gray-700 shadow-lg shadow-black"
  >
    <!-- Capture / Cancel Combined Button -->
    <button
      class="relative w-16 h-16 rounded-full flex items-center justify-center shadow-md shadow-black border border-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      :class="cameraStore.isExposure ? 'bg-red-600' : 'bg-gray-600 '"
      @click="
        cameraStore.isExposure
          ? cameraStore.abortExposure(apiService)
          : cameraStore.capturePhoto(
              apiService,
              settingsStore.camera.exposureTime,
              settingsStore.camera.gain,
              settingsStore.camera.useSolve
            )
      "
      :disabled="(cameraStore.loading && !cameraStore.isExposure) || sequenceStore.sequenceRunning"
    >
      <!-- Belichtungsfortschritt -->
      <template v-if=" cameraStore.isExposure">
        <svg class="w-16 h-16 absolute inset-0" viewBox="0 0 36 36">
          <path
            class="text-white text-opacity-30 fill-none stroke-current stroke-[2.8]"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            class="fill-none stroke-white stroke-[2.8]"
            :style="{
              strokeDasharray: cameraStore.progress + ', 100',
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
            }"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span class="text-white font-semibold text-sm z-10">
          {{ cameraStore.remainingExposureTime }}s
        </span>
      </template>

      <!-- Icon-Wechsel basierend auf Belichtungsstatus -->
       <template v-else>
  <template v-if="cameraStore.loading">
    <div class="loader"></div>
  </template>
      <template v-else>
        <svg class="w-16 h-16" viewBox="0 0 72 72" id="emoji" xmlns="http://www.w3.org/2000/svg">
          <g id="color" />
          <g id="line">
            <circle
              cx="36"
              cy="36"
              r="25"
              fill="none"
              stroke="#D1D5DB"
              stroke-linejoin="round"
              stroke-miterlimit="10"
              stroke-width="2"
            />
            <circle cx="36" cy="36" r="10" fill="#D1D5DB" stroke="none" />
          </g>
          <g id="color-foreground">
            <circle cx="36" cy="36" r="10" fill="#DC2626" stroke="none" />
          </g>
        </svg>
      </template>
      </template>
    </button>

    <button
      @click="cameraStore.isLooping = !cameraStore.isLooping"
      :class="[
        'w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center shadow-md shadow-black border border-cyan-900 transition-colors duration-200',
        cameraStore.isLooping ? 'text-green-400 glow-green' : 'text-gray-300',
      ]"
    >
      <ArrowPathIcon class="w-8 h-8" />
    </button>

    <!-- Exposure Time Input -->
    <div class="flex flex-col items-center gap-1">
      <!-- Label (optional) -->
      <label for="exposure" class="text-sm text-gray-300">
        {{ $t('components.camera.exposure_time') }}
      </label>

      <!-- Zeit-Eingabe -->
      <input
        id="exposure"
        v-model.number="settingsStore.camera.exposureTime"
        type="number"
        min="0"
        class="w-24 h-10 px-3 rounded-lg bg-gray-200 text-black shadow-sm shadow-black border border-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-700 text-sm text-center"
        placeholder="Sek."
      />
    </div>

    <div>
      <button
        @click="openSettings = true"
        class="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center shadow-md shadow-black border border-cyan-900 transition-colors duration-200"
      >
        <Cog6ToothIcon class="w-10 h-10 text-gray-300" />
      </button>

      <Modal :show="openSettings" @close="openSettings = false">
        <template #header>
          <h2 class="text-2xl font-semibold">{{ $t('components.camera.settings') }}</h2>
        </template>

        <template #body>
          <!-- Beliebiger Inhalt hier -->
          <SettingsModal />
        </template>
      </Modal>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import apiService from '@/services/apiService';
import { useCameraStore } from '@/store/cameraStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSequenceStore } from '@/store/sequenceStore';
import { StopCircleIcon, CameraIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import Modal from '@/components/helpers/Modal.vue';
import SettingsModal from '@/components/camera/SettingsModal.vue';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';

const cameraStore = useCameraStore();
const settingsStore = useSettingsStore();
const sequenceStore = useSequenceStore();
const openSettings = ref(false);
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

.glow-green {
  box-shadow: 0 0 10px #00ff00;
}
</style>
