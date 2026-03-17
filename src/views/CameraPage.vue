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
          :showFullscreen="false"
          :showHistogram="true"
          :showSolve="true"
          :loading="imageStore.isImageFetching || histogramStore.isProcessing(imageStore.imageData)"
          height="100vh"
          altText="Captured Astrophoto"
          placeholderText="No image captured yet"
          @download="handleDownload"
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

          <!-- PINS: Stats Toggle Button in button row -->
          <template v-if="store.isPINS" #extra-buttons>
            <button
              @click.stop="showCaptureStats = !showCaptureStats"
              :class="[
                'w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-colors',
                showCaptureStats
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  : 'bg-gray-800/90 hover:bg-gray-700 text-white',
              ]"
              title="Image Statistics"
            >
              <ChartBarIcon class="w-5 h-5" />
            </button>
          </template>
        </ZoomableImage>

        <!-- Histogram Overlay -->
        <div v-if="showHistogram && imageStore.imageData" class="z-50" :class="[histogramClasses]">
          <div
            v-if="statsLoading && store.isPINS"
            class="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded"
          >
            <svg
              class="w-5 h-5 animate-spin text-cyan-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <HistogramChart
            :data="getHistogram()"
            height="120px"
            :showStats="true"
            :blackPoint="getStretchSettings().blackPoint"
            :midPoint="getStretchSettings().midPoint"
            :whitePoint="getStretchSettings().whitePoint"
            :statistics="isSaveEnabled || store.isPINS ? captureStats : null"
            :stretchParams="
              isSaveEnabled || store.isPINS
                ? {
                    blackClipping: store.profileInfo?.ImageSettings?.BlackClipping,
                    autoStretchFactor: store.profileInfo?.ImageSettings?.AutoStretchFactor,
                  }
                : null
            "
            :saveEnabled="isSaveEnabled || store.isPINS"
            @levels-changed="onLevelsChanged"
            @levels-reset="onLevelsReset"
            @toggle-save="onToggleSave"
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

        <!-- PINS: Capture Stats Overlay -->
        <div
          v-if="store.isPINS && showCaptureStats && store.lastImageStats && imageStore.imageData"
          class="absolute right-0 z-20 flex flex-col p-2 text-xs text-gray-300 bg-black bg-opacity-50"
          :class="isLandscape ? 'left-32 top-0' : 'left-0 top-0'"
        >
          <div v-if="statsLoading" class="flex items-center gap-2 py-1 opacity-60">
            <svg
              class="w-3 h-3 animate-spin text-cyan-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span class="text-cyan-400 text-xs">updating…</span>
          </div>
          <div
            :class="isLandscape ? 'grid grid-cols-2 pt-14' : 'grid grid-cols-3 pt-36'"
            class="gap-x-2 gap-y-0.5"
          >
            <div v-if="store.lastImageStats.Stars !== undefined" class="flex gap-1 min-w-0">
              <span class="font-bold whitespace-nowrap"
                >{{ $t('components.helpers.histogram.stars') }}:</span
              >
              <span class="truncate">{{ store.lastImageStats.Stars }}</span>
            </div>
            <div v-if="isValidStat(store.lastImageStats.HFR)" class="flex gap-1 min-w-0">
              <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.hfr') }}:</span>
              <span class="truncate">{{ store.lastImageStats.HFR.toFixed(2) }}</span>
            </div>
            <div v-if="isValidStat(store.lastImageStats.HFRStDev)" class="flex gap-1 min-w-0">
              <span class="font-bold whitespace-nowrap"
                >{{ $t('components.sequence.HFRStDev') }}:</span
              >
              <span class="truncate">{{ store.lastImageStats.HFRStDev.toFixed(2) }}</span>
            </div>
            <div v-if="isValidStat(store.lastImageStats.Mean)" class="flex gap-1 min-w-0">
              <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.mean') }}:</span>
              <span class="truncate">{{ store.lastImageStats.Mean.toFixed(1) }}</span>
            </div>
            <div v-if="isValidStat(store.lastImageStats.Median)" class="flex gap-1 min-w-0">
              <span class="font-bold whitespace-nowrap"
                >{{ $t('components.sequence.median') }}:</span
              >
              <span class="truncate">{{ store.lastImageStats.Median.toFixed(0) }}</span>
            </div>
            <div
              v-if="isValidStat(store.lastImageStats.MedianAbsoluteDeviation)"
              class="flex gap-1 min-w-0"
            >
              <span class="font-bold whitespace-nowrap">MAD:</span>
              <span class="truncate">{{
                store.lastImageStats.MedianAbsoluteDeviation.toFixed(1)
              }}</span>
            </div>
            <div v-if="isValidStat(store.lastImageStats.StDev)" class="flex gap-1 min-w-0">
              <span class="font-bold whitespace-nowrap"
                >{{ $t('components.sequence.stDev') }}:</span
              >
              <span class="truncate">{{ store.lastImageStats.StDev.toFixed(1) }}</span>
            </div>
            <div v-if="isValidStat(store.lastImageStats.Min)" class="flex gap-1 min-w-0">
              <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.Min') }}:</span>
              <span class="truncate"
                >{{ store.lastImageStats.Min.toFixed(0)
                }}<span
                  v-if="isValidStat(store.lastImageStats.MinOccurrences)"
                  class="text-gray-400"
                  >({{ store.lastImageStats.MinOccurrences }}x)</span
                ></span
              >
            </div>
            <div v-if="isValidStat(store.lastImageStats.Max)" class="flex gap-1 min-w-0">
              <span class="font-bold whitespace-nowrap">{{ $t('components.sequence.Max') }}:</span>
              <span class="truncate"
                >{{ store.lastImageStats.Max.toFixed(0)
                }}<span
                  v-if="isValidStat(store.lastImageStats.MaxOccurrences)"
                  class="text-gray-400"
                  >({{ store.lastImageStats.MaxOccurrences }}x)</span
                ></span
              >
            </div>
            <div v-if="isValidStat(store.lastImageStats.Gain)" class="flex gap-1 min-w-0">
              <span class="font-bold whitespace-nowrap"
                >{{ $t('components.sequence.items.takeExposure.gain') }}:</span
              >
              <span class="truncate">{{ store.lastImageStats.Gain }}</span>
            </div>
            <div v-if="effectiveOffset !== null" class="flex gap-1 min-w-0">
              <span class="font-bold whitespace-nowrap"
                >{{ $t('components.sequence.items.takeExposure.offset') }}:</span
              >
              <span class="truncate">{{ effectiveOffset }}</span>
            </div>
          </div>
        </div>
      </div>

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

    <ModalTransparent :show="showMount" @close="showMount = false" modal-id="camera-mount">
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

    <ModalTransparent :show="showFocuser" @close="showFocuser = false" modal-id="camera-focuser">
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
          <div
            class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-center text-sm text-gray-300 mb-2"
          >
            {{ $t('components.focuser.title') }}:
            <span class="font-semibold text-white">{{ store.focuserInfo.Position }}</span>
          </div>
          <ButtonsFastChangePositon class="pt-2" />
        </div>
      </template>
    </ModalTransparent>

    <ModalTransparent :show="showFilter" @close="showFilter = false" modal-id="camera-filter">
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

    <ModalTransparent :show="showRotator" @close="showRotator = false" modal-id="camera-rotator">
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
import { ref, computed, watch, onMounted } from 'vue';
import { useOrientation } from '@/composables/useOrientation';
import { apiStore } from '@/store/store';
import { useCameraStore } from '@/store/cameraStore';
import { useImagetStore } from '@/store/imageStore';
import ZoomableImage from '@/components/helpers/ZoomableImage.vue';
import HistogramChart from '@/components/helpers/HistogramChart.vue';
import CenterHere from '@/components/camera/CenterHere.vue';
import CaptureButton from '@/components/camera/CaptureButton.vue';
import QuickAccessButtons from '@/components/camera/QuickAccessButtons.vue';
import ModalTransparent from '@/components/helpers/ModalTransparent.vue';
import moveAxis from '@/components/mount/moveAxis.vue';
import ButtonsFastChangePositon from '@/components/focuser/ButtonsFastChangePositon.vue';
import changeFilter from '@/components/filterwheel/changeFilter.vue';
import controlRotator from '@/components/rotator/controlRotator.vue';
import { downloadImage as downloadImageHelper } from '@/utils/imageDownloader';
import apiService from '@/services/apiService';
import { ChartBarIcon } from '@heroicons/vue/24/outline';

// Stores
import { useHistogramStore } from '@/store/histogramStore';

const store = apiStore();
const cameraStore = useCameraStore();
const imageStore = useImagetStore();
const histogramStore = useHistogramStore();

const isSaveEnabled = computed(() => store.profileInfo?.SnapShotControlSettings?.Save !== false);

// State
const showMount = ref(false);
const showFocuser = ref(false);
const showFilter = ref(false);
const showRotator = ref(false);
const showHistogram = ref(false);
const showCaptureStats = ref(false);
const statsLoading = ref(false);

const captureStats = computed(() => {
  if (store.isPINS && store.lastImageStats) {
    return store.lastImageStats;
  }
  const arr = store.imageHistoryInfo;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const last = arr[arr.length - 1];
  return last?.ImageType === 'SNAPSHOT' ? last : null;
});

function isValidStat(v) {
  return typeof v === 'number' && !isNaN(v);
}

const effectiveOffset = computed(() => {
  const raw = store.lastImageStats?.Offset;
  if (raw === -1 || !isValidStat(raw)) {
    const profileOffset = store.profileInfo?.CameraSettings?.Offset;
    return isValidStat(profileOffset) ? profileOffset : null;
  }
  return raw;
});

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
  !isLandscape.value ? 'top-24 right-52' : 'top-2 right-52', // Kept on right side as it relates to image controls
]);

// Event handlers
const handleDownload = async (data) => {
  await downloadImageHelper(data.imageData, new Date().toISOString().split('T')[0], {
    folderPrefix: 'TNS-Images',
    filePrefix: 'TNS',
  });
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

const onToggleSave = async () => {
  await apiService.profileChangeValue('SnapShotControlSettings-Save', true);
};

watch(
  () => imageStore.imageData,
  (newVal, oldVal) => {
    if (newVal && newVal !== oldVal && store.isPINS) {
      statsLoading.value = true;
    }
  }
);

watch(
  () => store.lastImageStats,
  async (newVal, oldVal) => {
    const hasChanged =
      newVal?.Mean !== oldVal?.Mean ||
      newVal?.Median !== oldVal?.Median ||
      newVal?.Stars !== oldVal?.Stars;
    if (!hasChanged) return;
    statsLoading.value = false;
    if (imageStore.imageData) {
      await histogramStore.calculateHistogramForImage(imageStore.imageData);
    }
  }
);

// Load image on mount if imageData is empty
onMounted(async () => {
  if (!imageStore.imageData) {
    await imageStore.getImage();
  }
  // Calculate histogram for the image
  if (imageStore.imageData) {
    await histogramStore.calculateHistogramForImage(imageStore.imageData);
  }
  await cameraStore.readSettings();
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
