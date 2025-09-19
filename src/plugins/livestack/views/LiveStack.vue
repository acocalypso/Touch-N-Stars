<template>
  <div class="container py-16 flex items-center justify-center">
    <div class="container max-w-6xl">
      <h5 class="text-2xl text-center font-bold text-white mb-4">Livestack</h5>

      <div class="flex flex-col space-y-4">
        <!-- Controls -->
        <div
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <div class="flex justify-center space-x-4 mb-4">
            <button
              @click="startLivestack"
              :disabled="isStarting"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {{ isStarting ? 'Starting...' : 'Start Livestack' }}
            </button>
            <button
              @click="toggleAutoRefresh"
              :class="
                autoRefresh ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
              "
              class="px-4 py-2 text-white rounded-lg transition-colors"
            >
              {{ autoRefresh ? 'Stop Auto Refresh' : 'Start Auto Refresh' }}
            </button>
            <button
              @click="refreshImages"
              :disabled="isLoading"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {{ isLoading ? 'Loading...' : 'Refresh Images' }}
            </button>
          </div>

          <!-- Status -->
          <div class="text-center">
            <p class="text-white">
              Status:
              <span :class="availableImages.length > 0 ? 'text-green-400' : 'text-red-400'">
                {{
                  availableImages.length > 0
                    ? `${availableImages.length} Images Available`
                    : 'No Images Available'
                }}
              </span>
            </p>
            <p v-if="currentTarget" class="text-gray-400 text-sm mt-1">
              Target: {{ currentTarget }}
            </p>
            <p v-if="lastUpdated" class="text-gray-400 text-sm mt-1">
              Last updated: {{ lastUpdated }}
            </p>
            <p class="text-gray-400 text-xs mt-1">
              WebSocket:
              <span :class="wsStatus === 'connected' ? 'text-green-400' : 'text-red-400'">
                {{ wsStatus === 'connected' ? 'Connected' : 'Disconnected' }}
              </span>
            </p>
          </div>
        </div>

        <!-- Filter Selection -->
        <div
          v-if="availableImages.length > 0"
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <h6 class="text-lg font-semibold text-white mb-3 text-center">Available Filters</h6>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              v-for="image in availableImages"
              :key="image.Filter"
              @click="selectFilter(image.Filter)"
              :class="
                livestackStore.selectedFilter === image.Filter
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              "
              class="px-3 py-2 text-white rounded-lg transition-colors text-sm"
            >
              {{ image.Filter }}
            </button>
          </div>
        </div>

        <!-- Image Display -->
        <div
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <div v-if="livestackStore.currentImageUrl" class="relative">
            <ZoomableImage
              :imageData="livestackStore.currentImageUrl"
              :loading="false"
              :showControls="true"
              :showDownload="false"
              :showFullscreen="false"
              :initialZoom="currentZoomLevel"
              height="60vh"
              :altText="`Livestack Image - ${livestackStore.selectedFilter}`"
              placeholderText="Loading livestack image..."
              @zoom-change="handleZoomChange"
              @image-load="handleImageLoad"
              @image-error="handleImageError"
              class="rounded-lg overflow-hidden"
            />
            <!-- Filter Label Overlay -->
            <div
              v-if="livestackStore.selectedFilter"
              class="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm z-10"
            >
              {{ livestackStore.selectedFilter }}
            </div>
          </div>

          <div v-else-if="isLoading" class="flex justify-center items-center h-96">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>

          <div v-else class="flex justify-center items-center h-96">
            <div class="text-center text-gray-400">
              <div class="w-16 h-16 mx-auto mb-4 opacity-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-full h-full"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
              </div>
              <p>No image available</p>
              <p class="text-sm mt-2">Start livestack and select a filter to see images</p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="border border-red-700 rounded-lg bg-red-900/50 shadow-lg p-4"
        >
          <p class="text-red-400 text-center">{{ errorMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import apiService from '@/services/apiService';
import ZoomableImage from '@/components/helpers/ZoomableImage.vue';
import websocketLivestackService from '@/services/apiSocket.js';
import { useLivestackStore } from '../store/livestackStore';

const livestackStore = useLivestackStore();
const availableImages = ref([]);
// const currentImageUrl = ref(null); // Moved to store
const currentTarget = ref(null);
const isLoading = ref(false);
const isStarting = ref(false);
const autoRefresh = ref(true);
const lastUpdated = ref(null);
const errorMessage = ref(null);
const wsStatus = ref('disconnected');
const currentZoomLevel = ref(1);
let refreshInterval = null;

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

const checkImageAvailability = async () => {
  try {
    const result = await apiService.livestackImageAvailable();
    if (result.Success && Array.isArray(result.Response)) {
      availableImages.value = result.Response;
      if (availableImages.value.length > 0) {
        currentTarget.value = availableImages.value[0].Target;
        if (!livestackStore.selectedFilter) {
          livestackStore.selectedFilter = availableImages.value[0].Filter;
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
  // Check if we should reload the image (unless forced)
  if (!forceReload && !livestackStore.shouldReloadImage(target, filter)) {
    console.log('Using cached image for', target, filter);
    return;
  }

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
  // Force reload even if cached - used for websocket updates
  await loadImage(target, filter, true);
};

const refreshImages = async () => {
  await checkImageAvailability();

  if (
    currentTarget.value &&
    livestackStore.selectedFilter &&
    availableImages.value.some((img) => img.Filter === livestackStore.selectedFilter)
  ) {
    await loadImage(currentTarget.value, livestackStore.selectedFilter);
  } else if (availableImages.value.length > 0) {
    livestackStore.selectedFilter = availableImages.value[0].Filter;
    currentTarget.value = availableImages.value[0].Target;
    await loadImage(currentTarget.value, livestackStore.selectedFilter);
  } else {
    errorMessage.value = 'No images available from livestack';
  }
};

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;

  if (autoRefresh.value) {
    refreshInterval = setInterval(() => {
      if (!isLoading.value) {
        refreshImages();
      }
    }, 5000);
  } else {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }
};

const handleZoomChange = (zoomLevel) => {
  console.log('Livestack image zoom level changed:', zoomLevel);
};

const handleImageLoad = () => {
  console.log('Livestack image loaded successfully');
};

const handleImageError = (event) => {
  console.error('Error loading livestack image:', event);
  errorMessage.value = 'Failed to load livestack image';
};

// WebSocket handlers
const handleWebSocketStatus = (status) => {
  wsStatus.value = status;
  console.log('Livestack WebSocket status:', status);
};

const handleWebSocketMessage = (message) => {
  console.log('Received livestack WebSocket message:', message);

  // Handle STACK-UPDATED events only if auto refresh is enabled
  if (message.Type === 'Socket' && message.Success && message.Response && autoRefresh.value) {
    const { Target, Filter, Event } = message.Response;

    if (Event === 'STACK-UPDATED') {
      console.log(`Stack updated for ${Target} with filter ${Filter} (Auto Refresh ON)`);

      // If this is the currently selected target and filter, force reload the image
      if (currentTarget.value === Target && livestackStore.selectedFilter === Filter) {
        console.log('Force reloading current image due to stack update');
        forceLoadImage(Target, Filter);
      }

      // Also update the available images list
      checkImageAvailability();
    }
  } else if (
    message.Type === 'Socket' &&
    message.Success &&
    message.Response &&
    !autoRefresh.value
  ) {
    const { Event } = message.Response;
    if (Event === 'STACK-UPDATED') {
      console.log('Stack updated but Auto Refresh is OFF - ignoring');
    }
  }
};

onMounted(() => {
  // Setup WebSocket callbacks
  websocketLivestackService.setStatusCallback(handleWebSocketStatus);
  websocketLivestackService.setMessageCallback(handleWebSocketMessage);

  // Connect to WebSocket
  websocketLivestackService.connect();

  // Initial check for available images
  checkImageAvailability();

  // Load current image in background if target and filter are available
  if (livestackStore.currentImageTarget && livestackStore.currentImageFilter) {
    console.log('Loading cached image on mount:', livestackStore.currentImageTarget, livestackStore.currentImageFilter);
    forceLoadImage(livestackStore.currentImageTarget, livestackStore.currentImageFilter);
  }
});

onUnmounted(() => {
  // Clean up auto refresh interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Don't clear image URL here - keep it cached for next visit
  // livestackStore.clearCurrentImageUrl();

  // Disconnect WebSocket
  websocketLivestackService.disconnect();
});
</script>
