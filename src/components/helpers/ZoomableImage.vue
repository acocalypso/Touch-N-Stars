<template>
  <div
    ref="container"
    class="zoomable-image-container relative w-full overflow-hidden"
    :style="{ height: height }"
  >
    <!-- Action Buttons -->
    <div v-if="imageData" class="absolute top-2 right-2 z-10 flex gap-2 portrait:top-24">
      <!-- Download Button -->
      <button
        v-if="showDownload"
        @click.stop="handleDownload"
        class="w-10 h-10 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg shadow-lg flex items-center justify-center transition-colors"
        title="Download Image"
      >
        <ArrowDownTrayIcon class="w-5 h-5" />
      </button>

      <!-- Fullscreen Button -->
      <button
        v-if="showFullscreen"
        @click.stop="handleFullscreen"
        class="w-10 h-10 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg shadow-lg flex items-center justify-center transition-colors"
        title="Open Fullscreen"
      >
        <MagnifyingGlassPlusIcon class="w-5 h-5" />
      </button>

      <!-- Histogram Button -->
      <button
        v-if="showHistogram !== false"
        @click.stop="handleHistogramToggle"
        class="w-10 h-10 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg shadow-lg flex items-center justify-center transition-colors"
        :class="{ 'bg-cyan-700 hover:bg-cyan-600': showHistogramActive }"
        title="Toggle Histogram"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="w-5 h-5"
        >
          <polyline points="2,18 3,16 4,12 5,8 6,5 7,4 8,3 10,3 12,4 14,6 16,9 18,12 20,15 22,17" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
      </button>

      <!-- Plate Solve Button -->
      <SolvePreparedImage v-if="showSolve" />
    </div>

    <!-- Main Image -->
    <img
      v-if="imageData && !imageLoadError"
      ref="image"
      :src="imageData"
      :alt="altText"
      class="w-full h-full object-contain absolute inset-0"
      @load="onImageLoad"
      @error="onImageError"
      @click="handleImageClick"
    />

    <!-- Loading Spinner -->
    <div
      v-if="loading && imageData"
      class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-40"
    >
      <div class="flex flex-col items-center text-white">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-2"></div>
        <p class="text-sm">Loading...</p>
      </div>
    </div>

    <!-- Placeholder -->
    <div
      v-else-if="!imageData || imageLoadError"
      class="flex items-center justify-center w-full h-full bg-gray-800/20"
    >
      <slot name="placeholder">
        <div class="text-gray-400 text-center">
          <PhotoIcon class="w-16 h-16 mx-auto mb-2 opacity-50" />
          <p class="text-sm">{{ placeholderText }}</p>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import Panzoom from '@panzoom/panzoom';
import { ArrowDownTrayIcon, MagnifyingGlassPlusIcon, PhotoIcon } from '@heroicons/vue/24/outline';
import SolvePreparedImage from '@/components/platesolve/solvePreparedImage.vue';

const props = defineProps({
  imageData: {
    type: String,
    default: null,
  },
  altText: {
    type: String,
    default: 'Zoomable Image',
  },
  placeholderText: {
    type: String,
    default: 'No image available',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  showDownload: {
    type: Boolean,
    default: true,
  },
  showFullscreen: {
    type: Boolean,
    default: true,
  },
  showHistogram: {
    type: Boolean,
    default: false,
  },
  showSolve: {
    type: Boolean,
    default: false,
  },
  minZoom: {
    type: Number,
    default: 0.8,
  },
  maxZoom: {
    type: Number,
    default: 40,
  },
  height: {
    type: String,
    default: '60vh',
  },
});

const emits = defineEmits([
  'download',
  'fullscreen',
  'histogram-toggle',
  'zoom-change',
  'image-load',
  'image-error',
  'click',
]);

// Refs
const container = ref(null);
const image = ref(null);
let panzoomInstance = null;

// State
const zoomLevel = ref(1);
const imageLoadError = ref(false);
const showHistogramActive = ref(false);

// Store zoom and pan state
const savedZoom = ref(null);
const savedPan = ref(null);

// Initialize Panzoom when image loads
const onImageLoad = () => {
  imageLoadError.value = false;
  nextTick(() => {
    initPanzoom();
    emits('image-load');
  });
};

const onImageError = (event) => {
  imageLoadError.value = true;
  emits('image-error', event);
};

const initPanzoom = () => {
  // Save current zoom and pan state before destroying
  if (panzoomInstance) {
    savedZoom.value = panzoomInstance.getScale();
    savedPan.value = panzoomInstance.getPan();
    panzoomInstance.destroy();
  }

  if (!image.value || !container.value) return;

  try {
    // Create new Panzoom instance on the image element directly
    panzoomInstance = Panzoom(image.value, {
      maxScale: props.maxZoom,
      minScale: props.minZoom,
      contain: 'outside',
      step: 1.5, // Zoom increment per mousewheel/pinch event
      friction: 0.15, // Drag deceleration (lower = slower/more resistance)
      startScale: savedZoom.value || 1,
      startX: savedPan.value?.x || 0,
      startY: savedPan.value?.y || 0,
    });

    // Listen to zoom changes
    image.value.addEventListener('panzoomchange', () => {
      if (panzoomInstance) {
        zoomLevel.value = panzoomInstance.getScale();
        emits('zoom-change', zoomLevel.value);
      }
    });

    // Add mousewheel support
    container.value.addEventListener('wheel', panzoomInstance.zoomWithWheel);
  } catch (error) {
    console.error('Error initializing Panzoom:', error);
  }
};

const destroyPanzoom = () => {
  if (panzoomInstance) {
    try {
      panzoomInstance.destroy();
    } catch (error) {
      console.warn('Error destroying Panzoom:', error);
    }
    panzoomInstance = null;
  }
};

const handleDownload = () => {
  emits('download', { imageData: props.imageData, zoomLevel: zoomLevel.value });
};

const handleFullscreen = () => {
  emits('fullscreen', { imageData: props.imageData, zoomLevel: zoomLevel.value });
};

const handleHistogramToggle = () => {
  showHistogramActive.value = !showHistogramActive.value;
  emits('histogram-toggle');
};

const handleImageClick = () => {
  emits('click', { imageData: props.imageData, zoomLevel: zoomLevel.value });
};

// Watch for image changes
watch(
  () => props.imageData,
  (newVal, oldVal) => {
    if (!newVal && oldVal) {
      destroyPanzoom();
      zoomLevel.value = 1;
    }
  }
);

// Cleanup on unmount
onBeforeUnmount(() => {
  destroyPanzoom();
});
</script>

<style scoped>
.zoomable-image-container {
  position: relative;
  background-color: transparent;
}

.zoomable-image-container img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
