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
          :imageData="getStretchSettings().stretchedImageData || imageStore.imageData"
          :showControls="true"
          :showDownload="true"
          :showFullscreen="true"
          :showHistogram="true"
          :showSolve="true"
          :loading="imageStore.isImageFetching || histogramStore.isProcessing(imageStore.imageData)"
          height="100vh"
          altText="Captured Astrophoto"
          placeholderText="No image captured yet"
          @download="handleDownload"
          @fullscreen="openImageModal"
          @histogram-toggle="showHistogram = !showHistogram"
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

        <!-- Histogram Overlay -->
        <div v-if="showHistogram && imageStore.imageData" class="z-50" :class="[histogramClasses]">
          <HistogramChart
            :data="getHistogram()"
            height="120px"
            :showStats="true"
            :blackPoint="getStretchSettings().blackPoint"
            :midPoint="getStretchSettings().midPoint"
            :whitePoint="getStretchSettings().whitePoint"
            @levels-changed="onLevelsChanged"
            @levels-reset="onLevelsReset"
          />
        </div>

        <div
          v-if="imageStore.imageData && cameraStore?.plateSolveResult?.Coordinates?.RADegrees"
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
        <div class="absolute inset-0 pointer-events-none z-60">
          <div class="pointer-events-auto">
            <CaptureButton />
          </div>
        </div>
      </div>

      <!-- Fullscreen Image Modal -->
      <ImageModal
        :showModal="showModal"
        :imageData="imageStore.imageData"
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
    <QuickAccessButtons
      :showMount="showMount"
      :showFocuser="showFocuser"
      :showFilter="showFilter"
      :showRotator="showRotator"
      @open-modal="openModal"
    />

    <ModalTransparent :show="showMount" @close="showMount = false">
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
    </ModalTransparent>

    <ModalTransparent :show="showFocuser" @close="showFocuser = false">
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
    </ModalTransparent>

    <ModalTransparent :show="showFilter" @close="showFilter = false">
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
    </ModalTransparent>

    <ModalTransparent :show="showRotator" @close="showRotator = false">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-1xl font-semibold">{{ $t('components.rotator.title') }}</h2>
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
          <controlRotator />
        </div>
      </template>
    </ModalTransparent>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useOrientation } from '@/composables/useOrientation';
import { apiStore } from '@/store/store';
import { useCameraStore } from '@/store/cameraStore';
import { useImagetStore } from '@/store/imageStore';
import ImageModal from '@/components/helpers/imageModal.vue';
import ZoomableImage from '@/components/helpers/ZoomableImage.vue';
import HistogramChart from '@/components/helpers/HistogramChart.vue';
import CenterHere from '@/components/camera/CenterHere.vue';
import CaptureButton from '@/components/camera/CaptureButton.vue';
import QuickAccessButtons from '@/components/camera/QuickAccessButtons.vue';
import ModalTransparent from '@/components/helpers/ModalTransparent.vue';
import moveAxis from '@/components/mount/moveAxis.vue';
import MoveFocuser from '@/components/focuser/MoveFocuser.vue';
import ButtonsFastChangePositon from '@/components/focuser/ButtonsFastChangePositon.vue';
import changeFilter from '@/components/filterwheel/changeFilter.vue';
import controlRotator from '@/components/rotator/controlRotator.vue';
import { downloadImage as downloadImageHelper } from '@/utils/imageDownloader';

// Stores
import { useHistogramStore } from '@/store/histogramStore';

const store = apiStore();
const cameraStore = useCameraStore();
const imageStore = useImagetStore();
const histogramStore = useHistogramStore();

// State
const showModal = ref(false);
const showMount = ref(false);
const showFocuser = ref(false);
const showFilter = ref(false);
const showRotator = ref(false);
const showHistogram = ref(false);

// Check if in landscape mode
const { isLandscape } = useOrientation();

// Container positioning classes
const histogramClasses = computed(() => ({
  // Portrait mode - bottom center
  'absolute top-36 left-4 w-2/3 min-w-72': !isLandscape.value,
  // Landscape mode - left side vertical (changed from right to left)
  'absolute top-24 left-36 w-1/2 min-w-72': isLandscape.value,
}));

// Modal Management - togglet das Modal oder schließt andere
const openModal = (modalType) => {
  switch (modalType) {
    case 'mount':
      if (showMount.value) {
        showMount.value = false;
      } else {
        showFocuser.value = false;
        showFilter.value = false;
        showRotator.value = false;
        showMount.value = true;
      }
      break;
    case 'focuser':
      if (showFocuser.value) {
        showFocuser.value = false;
      } else {
        showMount.value = false;
        showFilter.value = false;
        showRotator.value = false;
        showFocuser.value = true;
      }
      break;
    case 'filter':
      if (showFilter.value) {
        showFilter.value = false;
      } else {
        showMount.value = false;
        showFocuser.value = false;
        showRotator.value = false;
        showFilter.value = true;
      }
      break;
    case 'rotator':
      if (showRotator.value) {
        showRotator.value = false;
      } else {
        showMount.value = false;
        showFocuser.value = false;
        showFilter.value = false;
        showRotator.value = true;
      }
      break;
  }
};

// Responsive computed properties
const iconCenterHere = computed(() => [
  'absolute z-10',
  !isLandscape.value ? 'top-24 right-40' : 'top-2 right-40', // Kept on right side as it relates to image controls
]);

// Event handlers
const handleDownload = async (data) => {
  await downloadImageHelper(data.imageData, new Date().toISOString().split('T')[0], {
    folderPrefix: 'TNS-Images',
    filePrefix: 'TNS',
  });
};

const openImageModal = () => {
  showModal.value = true;
};

const closeImageModal = () => {
  showModal.value = false;
};

const getHistogram = () => {
  if (!imageStore.imageData) return null;
  return histogramStore.getHistogram(imageStore.imageData);
};

const getStretchSettings = () => {
  if (!imageStore.imageData) {
    return {
      blackPoint: 0,
      whitePoint: 255,
      midPoint: 127,
      stretchedImageData: null,
    };
  }
  return histogramStore.getStretchSettings(imageStore.imageData);
};

const onLevelsChanged = async (event) => {
  if (!imageStore.imageData) return;
  const { blackPoint, whitePoint, midPoint } = event;
  await histogramStore.applyStretch(imageStore.imageData, blackPoint, whitePoint, midPoint);
};

const onLevelsReset = async () => {
  if (!imageStore.imageData) return;
  histogramStore.resetStretch(imageStore.imageData);
};

// Load image on mount if imageData is empty
onMounted(async () => {
  if (!imageStore.imageData) {
    await imageStore.getImage();
  }
  // Calculate histogram for the image
  if (imageStore.imageData) {
    await histogramStore.calculateHistogramForImage(imageStore.imageData);
  }
});
</script>

<style scoped>
/* Drag Modal Headers */
:deep(.modal-header) {
  cursor: move;
  cursor: grab;
}

:deep(.modal-header:active) {
  cursor: grabbing;
}
</style>
