<template>
  <div class="livestack-page">
    <div v-if="pageIsLoading" class="flex flex-col items-center justify-center h-64">
      <svg
        class="animate-spin -ml-1 mr-3 h-10 w-10 text-gray-500"
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
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
    <!-- Error Message when plugin not available or version incompatible -->
    <div
      v-else-if="!pageIsLoading && (!livestackPluginAvailable || errorMessage)"
      class="border border-red-700 rounded-lg bg-red-900/50 shadow-lg p-4 m-4"
    >
      <p class="text-red-400 text-center">
        {{ errorMessage || t('plugins.livestack.not_available') }}
      </p>
    </div>
    <div v-else-if="pageIsLoading" class="flex flex-col items-center justify-center h-64">
      <svg
        class="animate-spin -ml-1 mr-3 h-10 w-10 text-gray-500"
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
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p class="text-gray-500 mt-2">{{ t('loading') }}</p>
    </div>
    <!-- Main content when plugin is available -->
    <div v-else>
      <!-- Fullscreen Image Display -->
      <div class="fixed inset-0 z-10">
        <!-- ZoomableImage Component - Full Screen -->
        <ZoomableImage
          :imageData="livestackStore.currentImageUrl"
          :loading="isLoading"
          :showControls="true"
          :showDownload="true"
          :showFullscreen="false"
          :initialZoom="currentZoomLevel"
          height="100vh"
          :altText="`Livestack Image - ${livestackStore.selectedFilter}`"
          placeholderText="Loading livestack image..."
          @image-load="handleImageLoad"
          @image-error="handleImageError"
          @download="handleDownload"
          class="bg-gray-900"
        >
          <!-- Custom placeholder -->
          <template #placeholder>
            <div class="flex flex-col items-center justify-center text-gray-400">
              <img
                src="../../../assets/Logo_TouchNStars_600x600.png"
                alt="TouchNStars Logo"
                class="w-44 h-44 opacity-50 mb-4"
              />
              <p class="text-lg">{{ t('plugins.livestack.no_image_available') }}</p>
              <p class="text-sm mt-2">{{ t('plugins.livestack.start_and_select_filter') }}</p>
            </div>
          </template>
        </ZoomableImage>
      </div>

      <!-- Control Panel Overlay -->
      <div :class="controlPanelClasses">
        <!-- Header with toggle button - always visible -->
        <div class="sticky top-0 z-40 bg-gray-800/90 backdrop-blur-sm rounded-t-lg flex items-center justify-between p-4 border-b border-gray-700">
          <h5 class="text-lg font-bold text-white">Livestack</h5>
          <button
            @click="toggleControlPanel"
            class="p-1 hover:bg-gray-700 rounded transition-colors"
            :title="isControlPanelMinimized ? 'Expand' : 'Minimize'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4 transition-transform duration-200 text-white"
              :class="{ 'rotate-180': isControlPanelMinimized }"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.5 15.75l7.5-7.5 7.5 7.5"
              />
            </svg>
          </button>
        </div>

        <!-- Scrollable content -->
        <div v-show="!isControlPanelMinimized" class="bg-gray-800/90 backdrop-blur-sm">
          <div class="p-4 border-b border-gray-700">
            <!-- Beta Notice -->
            <div v-if="livestackPluginAvailable" class="bg-blue-600/50 rounded p-2 mb-3 text-xs">
              <p class="text-blue-200">{{ t('plugins.livestack.beta_note') }}</p>
            </div>

            <!-- Controls -->
            <div class="flex space-x-2">
              <button @click="startLivestack" class="default-button-green" :disabled="isStarting">
                <PlayIcon v-if="!isStarting" class="w-4 h-4" />
                <ArrowPathIcon v-else class="w-4 h-4 animate-spin" />
              </button>
              <button @click="stopLivestack" class="default-button-red">
                <StopIcon class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Target and Filter Selection (Two-Level) -->
          <div v-if="availableImages.length > 0" class="p-4">
            <TargetFilterSelector
              ref="targetFilterSelectorRef"
              :availableImages="availableImages"
              :selectedTarget="selectedTargetForUI"
              :selectedFilter="livestackStore.selectedFilter"
              :currentTarget="livestackStore.selectedTarget"
              @select-target="selectTargetUI"
              @select-filter="selectFilterFromSelector"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiService from '@/services/apiService';
import ZoomableImage from '@/components/helpers/ZoomableImage.vue';
import websocketChannelService from '@/services/websocketChannelSocket.js';
import { useLivestackStore } from '../store/livestackStore';
import { PlayIcon, StopIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import { useI18n } from 'vue-i18n';
import { useOrientation } from '@/composables/useOrientation';
import { downloadImage as downloadImageHelper } from '@/utils/imageDownloader';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import TargetFilterSelector from '../components/TargetFilterSelector.vue';

const { t } = useI18n();
const livestackStore = useLivestackStore();
const { isLandscape } = useOrientation();
const store = apiStore();
const settingsStore = useSettingsStore();
const availableImages = ref([]);
const currentTarget = ref(null);
const isLoading = ref(false);
const isStarting = ref(false);
const lastUpdated = ref(null);
const errorMessage = ref(null);
const wsStatus = ref('disconnected');
const currentZoomLevel = ref(1);
const livestackPluginAvailable = ref(false);
const isControlPanelMinimized = ref(false);
const pageIsLoading = ref(true);
const selectedTargetForUI = ref(null); // Für zwei-stufige Selektion
const targetFilterSelectorRef = ref(null); // Referenz zur TargetFilterSelector-Komponente

// Responsive positioning for control panel
const controlPanelClasses = computed(() => ({
  'fixed z-30 max-w-sm max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin': true,
  'top-24 left-4': !isLandscape.value, // Portrait mode - below navbar
  'top-4 left-40 max-h-[calc(100vh-2rem)]': isLandscape.value, // Landscape mode - normal position
}));

const toggleControlPanel = () => {
  isControlPanelMinimized.value = !isControlPanelMinimized.value;
};

const startLivestack = async () => {
  isStarting.value = true;
  errorMessage.value = null;

  try {
    const result = await apiService.livestackStart();
    if (result.Success) {
      console.log('Livestack started successfully');
    } else {
      errorMessage.value = result.Error || 'Failed to start livestack';
    }
  } catch (error) {
    console.error('Error starting livestack:', error);
    errorMessage.value = 'Error starting livestack: ' + error.message;
  } finally {
    isStarting.value = false;
  }
};

const stopLivestack = async () => {
  errorMessage.value = null;

  try {
    const result = await apiService.livestackStop();
    if (result.Success) {
      console.log('Livestack stop successfully');
    } else {
      errorMessage.value = result.Error || 'Failed to stop livestack';
    }
  } catch (error) {
    console.error('Error stoping livestack:', error);
    errorMessage.value = 'Error stoping livestack: ' + error.message;
  } finally {
    isStarting.value = false;
  }
};

const checkImageAvailability = async () => {
  try {
    const result = await apiService.livestackImageAvailable();
    if (result.Success && Array.isArray(result.Response)) {
      availableImages.value = result.Response;
      if (availableImages.value.length > 0) {
        currentTarget.value = availableImages.value[0].Target;

        // Auto-select first available filter/target combination if no filter is selected
        // or if current filter/target combination is not available anymore
        const isCurrentCombinationAvailable = availableImages.value.some(
          (img) =>
            img.Filter === livestackStore.selectedFilter &&
            img.Target === livestackStore.selectedTarget
        );

        if (!livestackStore.selectedFilter || !isCurrentCombinationAvailable) {
          livestackStore.selectedFilter = availableImages.value[0].Filter;
          livestackStore.selectedTarget = availableImages.value[0].Target;
          console.log(
            'Auto-selected filter/target:',
            livestackStore.selectedFilter,
            livestackStore.selectedTarget
          );
        }

        loadImage(livestackStore.selectedTarget, livestackStore.selectedFilter);
      }
    } else {
      availableImages.value = [];
    }
  } catch (error) {
    console.error('Error checking image availability:', error);
    availableImages.value = [];
  }
};

const loadImage = async (target, filter, forceReload = false) => {
  console.log(`loadImage called: target=${target}, filter=${filter}, forceReload=${forceReload}`);

  // Check if we should reload the image (unless forced)
  if (!forceReload && !livestackStore.shouldReloadImage(target, filter)) {
    console.log('Using cached image for', target, filter);
    return;
  }

  console.log('Loading new image...');
  isLoading.value = true;
  errorMessage.value = null;

  const cameraWidth = store.profileInfo?.FramingAssistantSettings?.CameraWidth;
  const cameraHeight = store.profileInfo?.FramingAssistantSettings?.CameraHeight;
  const maxDimension = Math.max(cameraWidth, cameraHeight);
  const scale = maxDimension > 2000 ? (2000 / maxDimension) * 100 : 100;
  console.log(`Calculated scale: ${scale}% for camera size ${cameraWidth}x${cameraHeight}`);
  try {
    const newImageUrl = await apiService.getLivestackImage(
      target,
      filter,
      settingsStore.camera.imageQuality,
      scale
    );

    // Only update the image URL after successful load
    livestackStore.setCurrentImageUrl(newImageUrl, target, filter);
    lastUpdated.value = new Date().toLocaleTimeString();
  } catch (error) {
    console.error('Error loading image:', error);
    errorMessage.value = 'Error loading image: ' + error.message;
  } finally {
    isLoading.value = false;
  }
};

const forceLoadImage = async (target, filter) => {
  console.log(`forceLoadImage called: target=${target}, filter=${filter}`);
  // Force reload even if cached - used for websocket updates
  await loadImage(target, filter, true);
};

const handleImageLoad = () => {
  console.log('Livestack image loaded successfully');
};

const handleImageError = (event) => {
  console.error('Error loading livestack image:', event);
  errorMessage.value = 'Failed to load livestack image';
};

const handleDownload = async (data) => {
  await downloadImageHelper(data.imageData, new Date().toISOString().split('T')[0], {
    folderPrefix: 'TNS-Images',
    filePrefix: 'TNS',
  });
};

// Zwei-stufige Selektion Handler
const selectTargetUI = (target) => {
  selectedTargetForUI.value = target;
  console.log('Selected target for UI:', target);
};

const selectFilterFromSelector = async (filter) => {
  if (selectedTargetForUI.value) {
    livestackStore.selectedTarget = selectedTargetForUI.value;
    livestackStore.selectedFilter = filter;
    console.log(`Selected filter/target combination: ${selectedTargetForUI.value} / ${filter}`);
    await loadImage(selectedTargetForUI.value, filter);
  }
};

// WebSocket handlers
const handleWebSocketStatus = (status) => {
  wsStatus.value = status;
  console.log('Livestack WebSocket status:', status);
};

const handleWebSocketMessage = async (message) => {
  //console.log('Received livestack WebSocket message:', message);

  // Handle STACK-UPDATED events
  if (message.Type === 'Socket' && message.Success && message.Response) {
    const { Target, Filter, Event } = message.Response;

    if (Event === 'STACK-UPDATED') {
      // Invalidate the stack count cache in TargetFilterSelector
      if (targetFilterSelectorRef.value) {
        targetFilterSelectorRef.value.invalidateStackCountCache();
      }

      // Update the available images list first
      try {
        const result = await apiService.livestackImageAvailable();
        if (result.Success && Array.isArray(result.Response)) {
          availableImages.value = result.Response;

          // Update currentTarget if it's null
          if (!currentTarget.value && result.Response.length > 0) {
            currentTarget.value = result.Response[0].Target;
          }
        }
      } catch (error) {
        console.error('Error updating image availability:', error);
      }

      // If this is the currently selected target and filter, force reload the image
      // Also load if currentTarget was null (first image)
      if (
        (currentTarget.value === Target && livestackStore.selectedFilter === Filter) ||
        (!livestackStore.currentImageUrl && livestackStore.selectedFilter === Filter)
      ) {
        console.log('Force reloading current image due to stack update');
        await forceLoadImage(Target, Filter);
      }
    } else {
      //console.log(`Received non-STACK-UPDATED event: ${Event}`);
    }
  } else {
    //console.log('WebSocket message does not match expected format');
  }
};

onMounted(async () => {
  if (store.isBackendReachable === false) {
    console.warn('Backend is not reachable - skipping livestack initialization');
    pageIsLoading.value = false;
    return;
  }

  // Check API version - LiveStack requires 2.2.11.0 or higher
  const minimumApiVersion = '2.2.11.0';
  const isVersionValid = store.checkVersionNewerOrEqual(store.currentApiVersion, minimumApiVersion);

  if (!isVersionValid) {
    console.error(
      `LiveStack requires API version ${minimumApiVersion} or higher. Current version: ${store.currentApiVersion}`
    );
    errorMessage.value = `API version ${minimumApiVersion} or higher required`;
    pageIsLoading.value = false;
    return;
  }

  const response = await apiService.getPlugins();
  console.log('Plugins response:', response);

  // Check if Livestack plugin is available
  if (!response.Success || !response.Response?.includes('Livestack')) {
    console.error('Livestack plugin is not available or not installed');
    pageIsLoading.value = false;
    return;
  }

  livestackPluginAvailable.value = true;

  // Setup WebSocket callbacks auf dem globalen WebSocket Service
  const originalStatusCallback = websocketChannelService.statusCallback;
  const originalMessageCallback = websocketChannelService.messageCallback;

  websocketChannelService.setStatusCallback((status) => {
    handleWebSocketStatus(status);
    if (originalStatusCallback) originalStatusCallback(status);
  });

  websocketChannelService.setMessageCallback((message) => {
    handleWebSocketMessage(message);
    if (originalMessageCallback) originalMessageCallback(message);
  });

  // Stelle sicher, dass WebSocket verbunden ist
  try {
    if (!websocketChannelService.isWebSocketConnected()) {
      console.log('WebSocket not connected, attempting to connect...');
      await websocketChannelService.connect();
    }
    // Subscribe to livestack events
    websocketChannelService.subscribe('STACK-UPDATED');
  } catch (error) {
    console.error('Failed to connect WebSocket for livestack:', error);
  }

  // Initial check for available images
  checkImageAvailability();

  // Load current image in background if target and filter are available
  if (livestackStore.currentImageTarget && livestackStore.currentImageFilter) {
    console.log(
      'Loading cached image on mount:',
      livestackStore.currentImageTarget,
      livestackStore.currentImageFilter
    );
    forceLoadImage(livestackStore.currentImageTarget, livestackStore.currentImageFilter);
  }
  pageIsLoading.value = false;
});
</script>

<style scoped>
/* iOS Safari scroll fix - make scrolling work on fixed positioned elements */
.livestack-page {
  -webkit-user-select: none;
  user-select: none;
}

:deep(.scrollbar-thin) {
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch; /* iOS momentum scrolling */
}

:deep(.scrollbar-thin::-webkit-scrollbar) {
  width: 6px;
}

:deep(.scrollbar-thin::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.scrollbar-thin::-webkit-scrollbar-thumb) {
  background-color: #4a5568;
  border-radius: 20px;
}
</style>
