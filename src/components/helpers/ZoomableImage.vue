<template>
  <div
    ref="imageContainer"
    class="zoomable-image-container relative overflow-hidden w-full"
    :class="containerClasses"
  >
    <!-- Action Buttons + Zoom Display (responsive position) -->
    <div v-if="imageData" :class="actionAreaClasses">
      <!-- Download Button -->
      <button
        v-if="showDownload"
        @click.stop="handleDownload"
        @touchstart.stop
        :class="actionButtonClasses"
        title="Download Image"
      >
        <ArrowDownTrayIcon class="w-5 h-5" />
      </button>

      <!-- Fullscreen Button -->
      <button
        v-if="showFullscreen"
        @click.stop="handleFullscreen"
        @touchstart.stop
        :class="actionButtonClasses"
        title="Open Fullscreen"
      >
        <MagnifyingGlassPlusIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Custom Action Slot (bottom right) -->
    <div v-if="$slots.actions && imageData" class="absolute bottom-2 right-2 z-50">
      <slot name="actions"></slot>
    </div>

    <!-- Main Image -->
    <img
      v-if="imageData"
      ref="image"
      :src="imageData"
      :alt="altText"
      class="w-full h-full object-contain cursor-move transition-opacity duration-200"
      :class="{ 'opacity-50': loading }"
      @load="onImageLoad"
      @error="onImageError"
      @click="handleImageClick"
    />

    <!-- Loading Spinner Overlay -->
    <div
      v-if="loading && imageData"
      class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40"
    >
      <div class="flex flex-col items-center text-white">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-2"></div>
        <p class="text-sm">Loading new image...</p>
      </div>
    </div>

    <!-- Placeholder -->
    <div
      v-else-if="!imageData"
      class="flex items-center justify-center w-full h-full bg-gray-800/20"
    >
      <slot name="placeholder">
        <div class="text-gray-400 text-center">
          <div class="w-16 h-16 mx-auto mb-2 opacity-50">
            <PhotoIcon class="w-full h-full" />
          </div>
          <p class="text-sm">{{ placeholderText }}</p>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount, onMounted } from 'vue';
import Panzoom from 'panzoom';
import { ArrowDownTrayIcon, MagnifyingGlassPlusIcon, PhotoIcon } from '@heroicons/vue/24/outline';
import { useOrientation } from '@/composables/useOrientation';

const props = defineProps({
  // Image data
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

  // Loading state
  loading: {
    type: Boolean,
    default: false,
  },

  // UI Controls
  showControls: {
    type: Boolean,
    default: true,
  },
  showDownload: {
    type: Boolean,
    default: true,
  },
  showFullscreen: {
    type: Boolean,
    default: true,
  },

  // Zoom settings
  minZoom: {
    type: Number,
    default: 0.8,
  },
  maxZoom: {
    type: Number,
    default: 40,
  },

  // Container settings
  height: {
    type: String,
    default: 'auto', // 'auto', '60vh', '400px', etc.
  },
});

const emits = defineEmits(['download', 'fullscreen', 'zoom-change', 'image-load', 'image-error', 'click']);

// Refs
const imageContainer = ref(null);
const image = ref(null);

// Zoom state
let panzoomInstance = null;
const zoomLevel = ref(1);
const originalWidth = ref(1);
const originalHeight = ref(1);

// Check if in landscape mode
const { isLandscape } = useOrientation();

const handleFullscreen = () => {
  emits('fullscreen', {
    imageData: props.imageData,
    zoomLevel: zoomLevel.value,
  });
};

const handleImageClick = () => {
  emits('click', {
    imageData: props.imageData,
    zoomLevel: zoomLevel.value,
  });
};

// Computed classes
const containerClasses = computed(() => ({
  'min-h-[60vh]': props.height === 'auto',
}));

const actionButtonClasses = computed(() => [
  'w-10 h-10 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg shadow-lg',
  'flex items-center justify-center transition-colors backdrop-blur-sm',
  'pointer-events-auto touch-manipulation active:bg-gray-600 active:scale-95',
]);

const actionAreaClasses = computed(() => [
  'absolute z-10 flex gap-2 items-center',
  !isLandscape.value
    ? 'top-24 right-2' // Portrait fullscreen: below navigation
    : 'top-2 right-2', // Landscape: top left (changed from right to left)
]);

// Zoom functions
const logZoomLevel = () => {
  if (image.value && panzoomInstance) {
    try {
      // Try different API methods depending on panzoom version
      let currentScale = 1;

      if (typeof panzoomInstance.getTransform === 'function') {
        const transform = panzoomInstance.getTransform();
        currentScale = transform.scale;
      } else if (typeof panzoomInstance.getScale === 'function') {
        currentScale = panzoomInstance.getScale();
      } else {
        // Fallback: calculate from DOM
        const { width } = image.value.getBoundingClientRect();
        currentScale = width / originalWidth.value;
      }

      if (Math.abs(currentScale - zoomLevel.value) > 0.01) {
        zoomLevel.value = currentScale;
        emits('zoom-change', currentScale);
      }
    } catch (error) {
      console.warn('Error getting zoom level:', error);
    }
  }
};

const initializePanzoom = () => {
  if (image.value) {
    // Store original dimensions
    originalWidth.value = image.value.naturalWidth;
    originalHeight.value = image.value.naturalHeight;

    try {
      // Initialize panzoom with error handling
      panzoomInstance = Panzoom(image.value, {
        maxZoom: props.maxZoom,
        minZoom: props.minZoom,
        contain: 'inside',
        smoothScroll: true,
        zoomDoubleClickSpeed: 1,
      });

      // Event listeners with error handling
      try {
        panzoomInstance.on('zoom', logZoomLevel);
        panzoomInstance.on('pan', logZoomLevel);
        panzoomInstance.on('transform', logZoomLevel);
      } catch (eventError) {
        console.warn('Some panzoom events not available:', eventError);
        // Fallback: just try zoom event
        try {
          panzoomInstance.on('zoom', logZoomLevel);
        } catch (e) {
          console.warn('No zoom events available');
        }
      }

      // Initial zoom level
      logZoomLevel();

      console.log('Panzoom initialized successfully');
      console.log('Available methods:', Object.getOwnPropertyNames(panzoomInstance));
    } catch (error) {
      console.error('Error initializing panzoom:', error);
    }

    // Touch event handling for mobile - but exclude control areas
    image.value.addEventListener(
      'touchmove',
      (event) => {
        // Don't prevent if touch is on control buttons
        if (!event.target.closest('.z-50')) {
          event.preventDefault();
        }
      },
      { passive: false }
    );
  }
};

const destroyPanzoom = () => {
  if (panzoomInstance) {
    panzoomInstance.dispose();
    panzoomInstance = null;
  }
};

// Event handlers
const onImageLoad = () => {
  nextTick(() => {
    destroyPanzoom();
    initializePanzoom();
    emits('image-load');
  });
};

const onImageError = (event) => {
  console.error('Image load error:', event);
  emits('image-error', event);
};

const handleDownload = () => {
  emits('download', {
    imageData: props.imageData,
    zoomLevel: zoomLevel.value,
  });
};

// Watchers
watch(
  () => props.imageData,
  (newImageData) => {
    if (newImageData) {
      nextTick(() => {
        onImageLoad();
      });
    } else {
      destroyPanzoom();
      zoomLevel.value = 1;
    }
  }
);

// Lifecycle
onMounted(() => {
  if (props.imageData) {
    nextTick(() => {
      onImageLoad();
    });
  }
});

onBeforeUnmount(() => {
  destroyPanzoom();
});
</script>

<style scoped>
.zoomable-image-container {
  position: relative;
  overflow: hidden;
}

/* Dynamic height based on prop */
.zoomable-image-container {
  height: v-bind(height);
}

/* Ensure image fills container */
.zoomable-image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Backdrop blur for better button visibility */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Smooth zoom transitions */
.zoomable-image-container img {
  transition: transform 0.1s ease-out;
}

/* Custom scrollbar for touch devices */
.zoomable-image-container::-webkit-scrollbar {
  display: none;
}
</style>
