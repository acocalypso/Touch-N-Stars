<template>
  <div class="webcam-snapshot-container">
    <!-- Image Display -->
    <div class="relative border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
      <div
        v-if="!webcamStore.currentImageUrl && !webcamStore.isLoading"
        class="flex items-center justify-center h-64 text-gray-400"
      >
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            ></path>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
          <p>{{ t('plugins.webcam.noImageAvailable') }}</p>
          <p class="text-sm">{{ t('plugins.webcam.configureUrl') }}</p>
        </div>
      </div>

      <div
        v-if="webcamStore.isLoading && !webcamStore.currentImageUrl"
        class="flex items-center justify-center h-64 text-gray-400"
      >
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>{{ t('plugins.webcam.loadingImage') }}</p>
        </div>
      </div>

      <!-- Current Image -->
      <img
        v-if="webcamStore.currentImageUrl"
        :src="webcamStore.currentImageUrl"
        :alt="'Webcam snapshot'"
        class="w-full h-auto max-h-96 object-contain transition-opacity duration-300"
        :class="{ 'opacity-90': webcamStore.isTransitioning }"
        @error="webcamStore.onCurrentImageError"
        @load="webcamStore.onCurrentImageLoad"
      />

      <!-- Preloaded Next Image (hidden) -->
      <img
        v-if="webcamStore.nextImageUrl"
        :src="webcamStore.nextImageUrl"
        :alt="'Next webcam snapshot'"
        class="absolute inset-0 w-full h-auto max-h-96 object-contain opacity-0 pointer-events-none"
        @error="webcamStore.onNextImageError"
        @load="webcamStore.onNextImageLoad"
      />

      <!-- Subtle loading indicator -->
      <div
        v-if="webcamStore.isLoading && webcamStore.currentImageUrl"
        class="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full animate-pulse"
      ></div>
    </div>

    <!-- Controls -->
    <div v-if="webcamStore.showControls" class="mt-4 flex flex-wrap gap-2">
      <button
        v-if="!webcamStore.autoRefresh"
        @click="refreshImage"
        :disabled="webcamStore.isLoading || !webcamStore.isValid"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          ></path>
        </svg>
        {{ t('plugins.webcam.refresh') }}
      </button>

      <button
        @click="toggleAutoRefresh"
        :disabled="!webcamStore.isValid"
        class="px-4 py-2 rounded-md flex items-center gap-2"
        :class="
          webcamStore.autoRefresh
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-600 text-white hover:bg-gray-700'
        "
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1"
          ></path>
        </svg>
        {{ webcamStore.autoRefresh ? t('plugins.webcam.stopAuto') : t('plugins.webcam.startAuto') }}
      </button>

      <button
        @click="openSettings"
        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          ></path>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          ></path>
        </svg>
        {{ t('plugins.webcam.settings') }}
      </button>
    </div>

    <!-- Settings Modal -->
    <WebcamSettingsModal :is-open="showSettingsModal" @close="closeSettings" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWebcamStore } from '../store/webcamStore.js';
import WebcamSettingsModal from './WebcamSettingsModal.vue';

const { t } = useI18n();
const webcamStore = useWebcamStore();
const showSettingsModal = ref(false);

const refreshImage = () => {
  webcamStore.refreshSnapshot();
};

const openSettings = () => {
  showSettingsModal.value = true;
};

const closeSettings = () => {
  showSettingsModal.value = false;
};

const toggleAutoRefresh = () => {
  if (webcamStore.autoRefresh) {
    webcamStore.stopAutoRefresh();
    webcamStore.updateDisplaySettings({ autoRefresh: false });
  } else {
    webcamStore.updateDisplaySettings({ autoRefresh: true });
    webcamStore.startAutoRefresh();
  }
};

// Watch for auto refresh changes
watch(
  () => webcamStore.autoRefresh,
  (newValue) => {
    if (newValue) {
      webcamStore.startAutoRefresh();
    } else {
      webcamStore.stopAutoRefresh();
    }
  }
);

onMounted(() => {
  // Reset any loading states from previous navigation
  webcamStore.resetImageState();

  // Load initial image if URL is configured
  if (webcamStore.isValid) {
    webcamStore.refreshSnapshot();
  }

  if (webcamStore.autoRefresh) {
    webcamStore.startAutoRefresh();
  }
});

onUnmounted(() => {
  webcamStore.stopAutoRefresh();
});
</script>

<style scoped>
.webcam-snapshot-container {
  @apply w-full;
}
</style>
