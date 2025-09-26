<template>
  <div class="container py-5 flex items-center justify-center">
    <div class="container max-w-6xl">
      <h5 class="text-2xl text-center font-bold text-white mb-4">Livestack</h5>
      <!-- Error Message -->
      <div
        v-if="!livestackPluginAvailable"
        class="border border-red-700 rounded-lg bg-red-900/50 shadow-lg p-4"
      >
        <p class="text-red-400 text-center">{{ t('plugins.livestack.not_available') }}</p>
      </div>
      <div v-else class="flex flex-col space-y-4">
        <div
          v-if="livestackPluginAvailable"
          class="border border-blue-700 rounded-lg bg-blue-900/50 shadow-lg p-4"
        >
          <p class="text-blue-400 text-center">{{ t('plugins.livestack.beta_note') }}</p>
        </div>
        <!-- Controls -->
        <div
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <div class="flex justify-center space-x-4 mb-4">
            <button
              @click="startLivestack"
              class="default-button-green flex items-center justify-center"
              :disabled="isStarting"
            >
              <PlayIcon v-if="!isStarting" class="w-5 h-5" />
              <ArrowPathIcon v-else class="w-5 h-5 animate-spin" />
            </button>
            <button
              @click="stopLivestack"
              class="default-button-red flex items-center justify-center"
            >
              <StopIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Status -->
          <div class="text-center">
            <p class="text-white">
              {{ t('plugins.livestack.status') }}:
              <span :class="availableImages.length > 0 ? 'text-green-400' : 'text-red-400'">
                {{
                  availableImages.length > 0
                    ? t('plugins.livestack.images_available', { count: availableImages.length })
                    : t('plugins.livestack.no_images_available')
                }}
              </span>
            </p>
            <p v-if="currentTarget" class="text-gray-400 text-sm mt-1">
              {{ t('plugins.livestack.target') }}: {{ currentTarget }}
            </p>
            <p v-if="lastUpdated" class="text-gray-400 text-sm mt-1">
              {{ t('plugins.livestack.last_updated') }}: {{ lastUpdated }}
            </p>
          </div>
        </div>

        <!-- Filter Selection -->
        <div
          v-if="availableImages.length > 0"
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <h6 class="text-lg font-semibold text-white mb-3 text-center">
            {{ t('plugins.livestack.available_filters') }}
          </h6>
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
              <p>{{ t('plugins.livestack.no_image_available') }}</p>
              <p class="text-sm mt-2">{{ t('plugins.livestack.start_and_select_filter') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/apiService';
import ZoomableImage from '@/components/helpers/ZoomableImage.vue';
import websocketLivestackService from '@/services/websocketChannelSocket.js';
import { useLivestackStore } from '../store/livestackStore';
import { PlayIcon, StopIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const livestackStore = useLivestackStore();
const availableImages = ref([]);
const currentTarget = ref(null);
const isLoading = ref(false);
const isStarting = ref(false);
const lastUpdated = ref(null);
const errorMessage = ref(null);
const wsStatus = ref('disconnected');
const currentZoomLevel = ref(1);
const livestackPluginAvailable = ref(false);

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

  // Handle STACK-UPDATED events
  if (message.Type === 'Socket' && message.Success && message.Response) {
    const { Target, Filter, Event } = message.Response;

    if (Event === 'STACK-UPDATED') {
      console.log(`Stack updated for ${Target} with filter ${Filter}`);

      // If this is the currently selected target and filter, force reload the image
      if (currentTarget.value === Target && livestackStore.selectedFilter === Filter) {
        console.log('Force reloading current image due to stack update');
        forceLoadImage(Target, Filter);
      }

      // Also update the available images list
      checkImageAvailability();
    }
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
