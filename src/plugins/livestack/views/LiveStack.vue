<template>
  <div class="livestack-page">
    <!-- Error Message when plugin not available -->
    <div
      v-if="!livestackPluginAvailable"
      class="border border-red-700 rounded-lg bg-red-900/50 shadow-lg p-4 m-4"
    >
      <p class="text-red-400 text-center">{{ t('plugins.livestack.not_available') }}</p>
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
          :showFullscreen="true"
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

        <!-- Filter Label Overlay -->
        <div
          v-if="livestackStore.selectedFilter"
          class="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm z-20"
        >
          {{ livestackStore.selectedFilter }}
        </div>
      </div>

      <!-- Control Panel Overlay -->
      <div :class="controlPanelClasses">
        <!-- Status Display -->
        <div
          class="bg-gray-800/90 backdrop-blur-sm rounded-lg text-white transition-all duration-300"
        >
          <!-- Header with toggle button -->
          <div class="flex items-center justify-between p-4 border-b border-gray-700">
            <h5 class="text-lg font-bold">Livestack</h5>
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
                class="w-4 h-4 transition-transform duration-200"
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

          <!-- Collapsible content -->
          <div v-show="!isControlPanelMinimized" class="p-4">
            <!-- Beta Notice -->
            <div v-if="livestackPluginAvailable" class="bg-blue-600/50 rounded p-2 mb-3 text-xs">
              <p class="text-blue-200">{{ t('plugins.livestack.beta_note') }}</p>
            </div>

            <!-- Controls -->
            <div class="flex space-x-2 mb-3">
              <button @click="startLivestack" class="default-button-green" :disabled="isStarting">
                <PlayIcon v-if="!isStarting" class="w-4 h-4" />
                <ArrowPathIcon v-else class="w-4 h-4 animate-spin" />
              </button>
              <button @click="stopLivestack" class="default-button-red">
                <StopIcon class="w-4 h-4" />
              </button>
              <button
                v-if="livestackStore.currentImageUrl"
                @click="handleDownload({ imageData: livestackStore.currentImageUrl })"
                class="default-button-blue"
                title="Download Image"
              >
                <ArrowDownTrayIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Status -->
            <div class="text-xs">
              <p>
                {{ t('plugins.livestack.status') }}:
                <span :class="availableImages.length > 0 ? 'text-green-400' : 'text-red-400'">
                  {{
                    availableImages.length > 0
                      ? t('plugins.livestack.images_available', { count: availableImages.length })
                      : t('plugins.livestack.no_images_available')
                  }}
                </span>
              </p>
              <p v-if="isLoading" class="text-yellow-400 mt-1 flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-3 w-3 text-yellow-400"
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
                Loading image...
              </p>
              <p v-if="currentTarget" class="text-gray-400 mt-1">
                {{ t('plugins.livestack.target') }}: {{ currentTarget }}
              </p>
              <p v-if="lastUpdated" class="text-gray-400 mt-1">
                {{ t('plugins.livestack.last_updated') }}: {{ lastUpdated }}
              </p>
            </div>
          </div>
        </div>

        <!-- Filter Selection -->
        <div
          v-if="availableImages.length > 0 && !isControlPanelMinimized"
          class="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 mt-2"
        >
          <h6 class="text-sm font-semibold text-white mb-2">
            {{ t('plugins.livestack.available_filters') }}
          </h6>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="image in availableImages"
              :key="image.Filter"
              @click="selectFilter(image.Filter)"
              :class="
                livestackStore.selectedFilter === image.Filter
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              "
              class="px-2 py-1 text-white rounded text-xs transition-colors"
            >
              {{ image.Filter }}
            </button>
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
import websocketLivestackService from '@/services/websocketChannelSocket.js';
import { useLivestackStore } from '../store/livestackStore';
import { PlayIcon, StopIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline';
import { useI18n } from 'vue-i18n';
import { useOrientation } from '@/composables/useOrientation';
import { downloadImage as downloadImageHelper } from '@/utils/imageDownloader';

const { t } = useI18n();
const livestackStore = useLivestackStore();
const { isLandscape } = useOrientation();
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

// Responsive positioning for control panel
const controlPanelClasses = computed(() => ({
  'fixed z-30 max-w-sm': true,
  'top-24 right-4': !isLandscape.value, // Portrait mode - below navbar
  'top-4 right-4': isLandscape.value, // Landscape mode - normal position
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

        // Auto-select first available filter if no filter is selected
        // or if current filter is not available anymore
        const availableFilters = availableImages.value.map((img) => img.Filter);
        if (
          !livestackStore.selectedFilter ||
          !availableFilters.includes(livestackStore.selectedFilter)
        ) {
          livestackStore.selectedFilter = availableImages.value[0].Filter;
          console.log('Auto-selected filter:', livestackStore.selectedFilter);
        }

        loadImage(currentTarget.value, livestackStore.selectedFilter);
      }
    } else {
      availableImages.value = [];
    }
  } catch (error) {
    console.error('Error checking image availability:', error);
    availableImages.value = [];
  }
};

const selectFilter = async (filter) => {
  livestackStore.selectedFilter = filter;
  if (currentTarget.value) {
    await loadImage(currentTarget.value, filter);
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

  try {
    const newImageUrl = await apiService.getLivestackImage(target, filter);

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
  const currentDate = new Date().toISOString().split('T')[0];
  const target = currentTarget.value || 'Unknown';
  const filter = livestackStore.selectedFilter || 'NoFilter';

  await downloadImageHelper(data.imageData, currentDate, {
    folderPrefix: 'TNS-Livestack',
    filePrefix: `Livestack_${target}_${filter}`,
  });
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
      console.log(`Stack updated for ${Target} with filter ${Filter}`);
      console.log(
        `Current target: ${currentTarget.value}, Current filter: ${livestackStore.selectedFilter}`
      );

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
  const response = await apiService.getPlugins();
  console.log('Plugins response:', response);

  // Check if Livestack plugin is available
  if (!response.Success || !response.Response?.includes('Livestack')) {
    console.error('Livestack plugin is not available or not installed');
    return;
  }
  livestackPluginAvailable.value = true;

  // Setup WebSocket callbacks
  websocketLivestackService.setStatusCallback(handleWebSocketStatus);
  websocketLivestackService.setMessageCallback(handleWebSocketMessage);

  // Connect WebSocket
  websocketLivestackService.connect();

  // Subscribe to livestack events
  websocketLivestackService.subscribe('STACK-UPDATED');

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
});
</script>
