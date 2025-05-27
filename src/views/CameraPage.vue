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
            class="image-container flex justify-center items-center w-full touch-auto"
          >
            <img
              v-if="cameraStore.imageData"
              @click="openModal"
              ref="image"
              :src="cameraStore.imageData"
              alt="Captured Image"
              class="max-h-[80vh] bg-gray-800 shadow-lg shadow-cyan-700/40 rounded-xl border border-cyan-700/50 overflow-hidden"
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

  <div class="fixed top-24 left-5 flex gap-2 text-gray-300">
    <div v-if="store.mountInfo.Connected">
      <button
        @click="showMount = !showMount"
        class="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center shadow-md shadow-black border border-cyan-500 transition-colors duration-200"
        :class="{ 'glow-green': showMount }"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6 text-gray-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M6 21l6 -5l6 5" />
          <path d="M12 13v8" />
          <path
            d="M3.294 13.678l.166 .281c.52 .88 1.624 1.265 2.605 .91l14.242 -5.165a1.023 1.023 0 0 0 .565 -1.456l-2.62 -4.705a1.087 1.087 0 0 0 -1.447 -.42l-.056 .032l-12.694 7.618c-1.02 .613 -1.357 1.897 -.76 2.905z"
          />
          <path d="M14 5l3 5.5" />
        </svg>
      </button>
    </div>
    <div v-if="store.focuserInfo.Connected">
      <button
        @click="showFocuser = !showFocuser"
        class="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center shadow-md shadow-black border border-cyan-500 transition-colors duration-200"
        :class="{ 'glow-green': showFocuser }"
      >
        <EyeIcon class="w-7 h-7" />
      </button>
    </div>
    <div v-if="store.filterInfo.Connected">
      <button
        @click="showFilter = !showFilter"
        class="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center shadow-md shadow-black border border-cyan-500 transition-colors duration-200"
        :class="{ 'glow-green': showFilter }"
      >
        <svg
            class="w-8 h-8"
            baseProfile="full"
            version="1.1"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:ev="http://www.w3.org/2001/xml-events"
            xmlns:xlink="http://www.w3.org/1999/xlink"
          >
            <defs />
            <circle cx="50.0" cy="50.0" fill="currentColor" r="40.0" stroke="black" />
            <circle cx="70.0" cy="50.0" fill="black" r="5.0" />
            <circle cx="56.180339887498945" cy="69.02113032590307" fill="black" r="5.0" />
            <circle cx="33.819660112501055" cy="61.75570504584947" fill="black" r="5.0" />
            <circle cx="33.81966011250105" cy="38.24429495415054" fill="black" r="5.0" />
            <circle cx="56.180339887498945" cy="30.978869674096927" fill="black" r="5.0" />
          </svg>
      </button>
    </div>
  </div>
  <!-- Mount Modal -->
  <ModalTransparanet :show="showMount" @close="showMount = false">
    <template #header>
      <h2 class="text-1xl font-semibold">{{ $t('components.mount.title') }}</h2>
    </template>
    <template #body>
      <moveAxis />
    </template>
  </ModalTransparanet>

  <!-- Focuser Modal -->
  <ModalTransparanet :show="showFocuser" @close="showFocuser = false">
    <template #header>
      <h2 class="text-1xl font-semibold">{{ $t('components.focuser.title') }}</h2>
    </template>
    <template #body>
      <div>
        <MoveFocuser />
        <ButtonsFastChangePositon class="pt-2" />
      </div>
    </template>
  </ModalTransparanet>

    <!-- filterwheel Modal -->
  <ModalTransparanet :show="showFilter" @close="showFilter = false">
    <template #header>
      <h2 class="text-1xl font-semibold">{{ $t('components.filterwheel.filter') }}</h2>
    </template>
    <template #body>
      <div>
        <changeFilter />
      </div>
    </template>
  </ModalTransparanet>

</template>



<script setup>
import { ref } from 'vue';
import { apiStore } from '@/store/store';
import { useCameraStore } from '@/store/cameraStore';
import { EyeIcon } from '@heroicons/vue/24/outline';
import ImageModal from '@/components/helpers/imageModal.vue';
import CenterHere from '@/components/camera/CenterHere.vue';
import CaptureButton from '@/components/camera/CaptureButton.vue';
import ModalTransparanet from '@/components/helpers/ModalTransparanet.vue';
import moveAxis from '@/components/mount/moveAxis.vue';
import MoveFocuser from '@/components/focuser/MoveFocuser.vue';
import ButtonsFastChangePositon from '@/components/focuser/ButtonsFastChangePositon.vue';
import changeFilter from '@/components/filterwheel/changeFilter.vue';

// Initialisiere Stores
const store = apiStore();
const cameraStore = useCameraStore();
const imageContainer = ref(null);
const image = ref(null);
const showModal = ref(false);
const showMount = ref(false);
const showFocuser = ref(false);
const showFilter = ref(false);

// Modal öffnen / schließen
function openModal() {
  showModal.value = true;
}
function closeModal() {
  showModal.value = false;
}
</script>

<style scoped></style>
