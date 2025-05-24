<template>
  <div class="text-center">
    <!-- Camera Connection Status -->
    <div class="w-full flex justify-center mb-3">
      <div class="max-w-xl">
        <div
          v-if="!store.cameraInfo.Connected"
          class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p class="text-red-400 font-medium">{{ $t('components.camera.connect') }}</p>
        </div>
      </div>
    </div>

    <!-- Hauptbereich, wenn Kamera verbunden -->
    <div v-show="store.cameraInfo.Connected" class="pb-14">
      <div class="flex flex-col lg:flex-row gap-1 lg:gap-4 mx-5">
        <div class="flex flex-col space-y-3">
          <div class="flex flex-col space-y-2">
            <CaptureButton />
          </div>
        </div>

        <div class="flex w-full relative">
          <div
            ref="imageContainer"
            class="image-container flex justify-center items-center w-full   touch-auto"
          >
            <img
              v-if="cameraStore.imageData"
              @click="openModal"
              ref="image"
              :src="cameraStore.imageData"
              alt="Captured Image"
              class="max-h-[80vh]  bg-gray-800 shadow-lg shadow-cyan-700/40 rounded-xl border border-cyan-700/50 overflow-hidden"
            />
            <div v-else class="flex items-center justify-center">
              <img
                src="../assets/Logo_TouchNStars_600x600.png"
                alt="Captured Image"
                class="block"
              />
            </div>
            <div
              v-if="cameraStore.imageData && cameraStore?.plateSolveResult?.Coordinates?.RADegrees"
              class="absolute top-2 right-2 z-50"
            >
              <svg
                @click="cameraStore.slewModal = true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-10 h-10 text-white cursor-pointer hover:text-cyan-500 transition"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ImageModal
      :showModal="showModal"
      :imageData="cameraStore.imageData"
      :isLoading="false"
      @close="closeModal"
    />

    <div
      v-if="cameraStore.slewModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        class="bg-gray-900 rounded-lg p-4 overflow-y-auto max-h-[95vh] border border-gray-700 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50"
      >
        <CenterHere />
        <button
          @click="cameraStore.slewModal = false"
          class="fixed sm:absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-gray-400 hover:text-white bg-gray-900 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { apiStore } from '@/store/store';
import { useCameraStore } from '@/store/cameraStore';
import ImageModal from '@/components/helpers/imageModal.vue';
import CenterHere from '@/components/camera/CenterHere.vue';
import CaptureButton from '@/components/camera/CaptureButton.vue';

// Initialisiere Stores
const store = apiStore();
const cameraStore = useCameraStore();
const imageContainer = ref(null);
const image = ref(null);
const showModal = ref(false);

// Modal öffnen / schließen
function openModal() {
  showModal.value = true;
}
function closeModal() {
  showModal.value = false;
}
</script>

<style scoped></style>
