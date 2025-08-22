<template>
  <div class="camera-page">
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
    <div v-show="store.cameraInfo.Connected" class="fixed inset-0 z-10">
      <!-- ZoomableImage Component - Full Screen -->
      <ZoomableImage
        :imageData="cameraStore.imageData"
        :showControls="true"
        :showDownload="true"
        :showFullscreen="true"
        height="100vh"
        altText="Captured Astrophoto"
        placeholderText="No image captured yet"
        @download="handleDownload"
        @fullscreen="openImageModal"
        @zoom-change="handleZoomChange"
        @image-load="handleImageLoad"
        class="bg-gray-900"
      >
        <!-- Custom placeholder -->
        <template #placeholder>
          <div class="flex flex-col items-center justify-center text-gray-400">
            <img
              src="../assets/Logo_TouchNStars_600x600.png"
              alt="TouchNStars Logo"
              class="w-44 h-44 opacity-50 mb-4"
            />
            <p class="text-lg">One touch to the stars</p>
          </div>
        </template>
      </ZoomableImage>

      <div
        v-if="cameraStore.imageData && cameraStore?.plateSolveResult?.Coordinates?.RADegrees"
        :class="iconCenterHere"
      >
        <button
          @click="cameraStore.slewModal = true"
          class="w-10 h-10 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg shadow-lg flex items-center justify-center transition-colors backdrop-blur-sm"
          title="Center Here"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
            />
          </svg>
        </button>
      </div>

      <!-- Capture Button Overlay -->
      <div class="absolute inset-0 pointer-events-none z-[55]">
        <div class="pointer-events-auto">
          <CaptureButton />
        </div>
      </div>
    </div>

    <!-- Fullscreen Image Modal -->
    <ImageModal
      :showModal="showModal"
      :imageData="cameraStore.imageData"
      :isLoading="false"
      @close="closeImageModal"
    />

    <!-- Slew Modal -->
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
          class="fixed top-2 right-2 p-2 text-gray-400 hover:text-white bg-gray-900 rounded-full"
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

  <!-- Quick Access Buttons -->
  <div :class="quickButtonsClasses">
    <div v-if="store.mountInfo.Connected">
      <button
        @click="openModal('mount')"
        :class="[buttonClasses, { 'glow-green': showMount }]"
        title="Mount Controls"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          :class="iconClasses"
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
        @click="openModal('focuser')"
        :class="[buttonClasses, { 'glow-green': showFocuser }]"
        title="Focuser Controls"
      >
        <EyeIcon :class="iconClasses" />
      </button>
    </div>
    <div v-if="store.filterInfo.Connected">
      <button
        @click="openModal('filter')"
        :class="[buttonClasses, { 'glow-green': showFilter }]"
        title="Filter Wheel"
      >
        <svg
          :class="iconClasses"
          baseProfile="full"
          version="1.1"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
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

  <ModalTransparanet :show="showMount" @close="showMount = false">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-1xl font-semibold">{{ $t('components.mount.title') }}</h2>
        <div class="flex items-center gap-2 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
            />
          </svg>
          <span class="text-xs">Drag</span>
        </div>
      </div>
    </template>
    <template #body>
      <moveAxis />
    </template>
  </ModalTransparanet>

  <ModalTransparanet :show="showFocuser" @close="showFocuser = false">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-1xl font-semibold">{{ $t('components.focuser.title') }}</h2>
        <div class="flex items-center gap-2 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
            />
          </svg>
          <span class="text-xs">Drag</span>
        </div>
      </div>
    </template>
    <template #body>
      <div>
        <MoveFocuser class="w-full" />
        <ButtonsFastChangePositon class="pt-2" />
      </div>
    </template>
  </ModalTransparanet>

  <ModalTransparanet :show="showFilter" @close="showFilter = false">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-1xl font-semibold">{{ $t('components.filterwheel.filter') }}</h2>
        <div class="flex items-center gap-2 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
            />
          </svg>
          <span class="text-xs">Drag</span>
        </div>
      </div>
    </template>
    <template #body>
      <div>
        <changeFilter />
      </div>
    </template>
  </ModalTransparanet>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useOrientation } from '@/composables/useOrientation';
import { apiStore } from '@/store/store';
import { useCameraStore } from '@/store/cameraStore';
import { EyeIcon } from '@heroicons/vue/24/outline';
import ImageModal from '@/components/helpers/imageModal.vue';
import ZoomableImage from '@/components/helpers/ZoomableImage.vue';
import CenterHere from '@/components/camera/CenterHere.vue';
import CaptureButton from '@/components/camera/CaptureButton.vue';
import ModalTransparanet from '@/components/helpers/ModalTransparanet.vue';
import moveAxis from '@/components/mount/moveAxis.vue';
import MoveFocuser from '@/components/focuser/MoveFocuser.vue';
import ButtonsFastChangePositon from '@/components/focuser/ButtonsFastChangePositon.vue';
import changeFilter from '@/components/filterwheel/changeFilter.vue';
import { downloadImage as downloadImageHelper } from '@/utils/imageDownloader';

// Stores
const store = apiStore();
const cameraStore = useCameraStore();

// State
const showModal = ref(false);
const showMount = ref(false);
const showFocuser = ref(false);
const showFilter = ref(false);

// Modal Management - togglet das Modal oder schließt andere
const openModal = (modalType) => {
  switch (modalType) {
    case 'mount':
      if (showMount.value) {
        showMount.value = false;
      } else {
        showFocuser.value = false;
        showFilter.value = false;
        showMount.value = true;
      }
      break;
    case 'focuser':
      if (showFocuser.value) {
        showFocuser.value = false;
      } else {
        showMount.value = false;
        showFilter.value = false;
        showFocuser.value = true;
      }
      break;
    case 'filter':
      if (showFilter.value) {
        showFilter.value = false;
      } else {
        showMount.value = false;
        showFocuser.value = false;
        showFilter.value = true;
      }
      break;
  }
};

const { isLandscape } = useOrientation();

// Responsive computed properties
const quickButtonsClasses = computed(() => ({
  'fixed flex gap-2 text-gray-300 z-10': true,
  'top-24 left-5 flex-row': !isLandscape.value,
  'top-5 left-36 flex-row': isLandscape.value, // Updated to left-36 (9rem) für neue Navigation
}));

const buttonClasses = computed(() => ({
  'rounded-full bg-gray-600 flex items-center justify-center shadow-md shadow-black border border-cyan-500 transition-colors duration-200': true,
  'w-12 h-12': !isLandscape.value,
  'w-10 h-10': isLandscape.value,
}));

const iconClasses = computed(() => ({
  'text-gray-300': true,
  'w-6 h-6': !isLandscape.value,
  'w-5 h-5': isLandscape.value,
}));

const iconCenterHere = computed(() => [
  'absolute z-10',
  !isLandscape.value ? 'top-24 right-28' : 'top-2 right-28', // Kept on right side as it relates to image controls
]);

// Event handlers
const handleDownload = async (data) => {
  await downloadImageHelper(data.imageData, new Date().toISOString().split('T')[0], {
    folderPrefix: 'TNS-Images',
    filePrefix: 'TNS',
  });
};

const handleZoomChange = (zoomLevel) => {
  console.log('Zoom level changed:', zoomLevel);
};

const handleImageLoad = () => {
  console.log('Image loaded successfully');
};

const openImageModal = () => {
  showModal.value = true;
};

const closeImageModal = () => {
  showModal.value = false;
};
</script>

<style scoped>
.glow-green {
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.5);
  border-color: rgb(34, 197, 94);
}

.transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Drag-Hinweis für Modal Headers */
:deep(.modal-header) {
  cursor: move;
  cursor: grab;
}

:deep(.modal-header:active) {
  cursor: grabbing;
}

/* Standard Positioning für alle Geräte */
@media screen and (orientation: landscape) {
  .quickButtonsClasses {
    left: 9rem !important; /* Fester Abstand für alle Geräte */
  }
}

@media (max-height: 600px) and (orientation: landscape) {
  .quickButtonsClasses {
    top: 0.25rem !important;
  }
}
</style>
