<template>
  <div
    class="monitor-snapshot absolute inset-0 flex flex-col items-center justify-center bg-black overflow-hidden group"
  >
    <!-- Image Display -->
    <!-- Hidden preloader: always active when a new URL is pending -->
    <img
      v-if="preloadUrl"
      :src="preloadUrl"
      class="hidden"
      @load="onPreloaded"
      @error="onPreloaded"
    />

    <div
      v-if="camera && displayUrl"
      class="w-full h-full flex items-center justify-center relative overflow-hidden"
      @wheel.prevent="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @touchstart="handleTouchStart"
      @touchmove.prevent="handleTouchMove"
      @touchend="handleTouchEnd"
      @dblclick="resetZoom"
      :style="{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }"
    >
      <img
        :src="displayUrl"
        class="max-w-full max-h-full object-contain"
        :class="{ 'transition-transform duration-100': !isDragging }"
        :style="{ transform: imageTransform, transformOrigin: 'center center' }"
        draggable="false"
      />

      <!-- Reset Zoom Button -->
      <button
        v-if="scale > 1"
        @click.stop="resetZoom"
        class="absolute bottom-4 right-4 p-1.5 bg-black bg-opacity-60 text-white rounded-lg backdrop-blur-sm hover:bg-opacity-80 transition-all"
        title="Fit image"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
          />
        </svg>
      </button>
    </div>

    <!-- Loading Spinner (first load: preload pending, nothing displayed yet) -->
    <div
      v-else-if="camera && preloadUrl && !displayUrl"
      class="w-full h-full flex flex-col items-center justify-center bg-gray-900 space-y-4"
    >
      <svg
        class="h-10 w-10 text-indigo-400 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p class="text-sm text-gray-500">{{ $t('plugins.multiImageMonitor.loadingImage') }}</p>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="w-full h-full flex flex-col items-center justify-center text-gray-500 space-y-4 bg-gray-900"
    >
      <div class="p-6 bg-gray-800 rounded-full bg-opacity-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <div class="text-center">
        <h3 class="text-lg font-medium text-gray-300">
          {{ camera ? camera.name : $t('plugins.multiImageMonitor.unknownCamera') }}
        </h3>
        <p class="text-sm max-w-xs px-4">
          {{ $t('plugins.multiImageMonitor.noUrlConfigured') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'; // ref used for preloadUrl, scale, translate, etc.
import { useImageMonitorStore } from '../store/imageMonitorStore';

const props = defineProps({
  cameraId: {
    type: String,
    required: true,
  },
});

const store = useImageMonitorStore();
const camera = computed(() => store.getCameraById(props.cameraId));
const status = computed(() => store.getCameraStatus(props.cameraId));

// displayUrl lives in the store so it survives component remounts (resize, tab switch)
const displayUrl = computed(() => status.value.displayUrl);

// preloadUrl stays local — it's transient loading state only
const preloadUrl = ref(null);

watch(
  () => status.value.currentImageUrl,
  (newUrl) => {
    if (!newUrl) return;
    preloadUrl.value = newUrl;
  },
  { immediate: true }
);

const onPreloaded = () => {
  store.setDisplayUrl(props.cameraId, preloadUrl.value);
  preloadUrl.value = null;
};

// Zoom & Pan state
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const isDragging = ref(false);
const lastMouseX = ref(0);
const lastMouseY = ref(0);
const lastTouchDistance = ref(0);

const imageTransform = computed(
  () => `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`
);

const clampScale = (s) => Math.min(Math.max(s, 1), 8);

const resetZoom = () => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
};

// Mouse wheel zoom (toward cursor)
const handleWheel = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const mouseX = e.clientX - rect.left - rect.width / 2;
  const mouseY = e.clientY - rect.top - rect.height / 2;
  const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  const newScale = clampScale(scale.value * factor);

  if (newScale === 1) {
    resetZoom();
    return;
  }

  const ratio = newScale / scale.value;
  translateX.value = mouseX - ratio * (mouseX - translateX.value);
  translateY.value = mouseY - ratio * (mouseY - translateY.value);
  scale.value = newScale;
};

// Mouse drag pan
const handleMouseDown = (e) => {
  if (scale.value > 1) {
    isDragging.value = true;
    lastMouseX.value = e.clientX;
    lastMouseY.value = e.clientY;
  }
};

const handleMouseMove = (e) => {
  if (!isDragging.value) return;
  translateX.value += e.clientX - lastMouseX.value;
  translateY.value += e.clientY - lastMouseY.value;
  lastMouseX.value = e.clientX;
  lastMouseY.value = e.clientY;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// Touch pinch zoom + drag
const getTouchDistance = (touches) => {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

const handleTouchStart = (e) => {
  if (e.touches.length === 2) {
    isDragging.value = false;
    lastTouchDistance.value = getTouchDistance(e.touches);
  } else if (e.touches.length === 1 && scale.value > 1) {
    isDragging.value = true;
    lastMouseX.value = e.touches[0].clientX;
    lastMouseY.value = e.touches[0].clientY;
  }
};

const handleTouchMove = (e) => {
  if (e.touches.length === 2) {
    const dist = getTouchDistance(e.touches);
    const newScale = clampScale(scale.value * (dist / lastTouchDistance.value));
    if (newScale === 1) {
      resetZoom();
    } else {
      scale.value = newScale;
    }
    lastTouchDistance.value = dist;
  } else if (e.touches.length === 1 && isDragging.value) {
    translateX.value += e.touches[0].clientX - lastMouseX.value;
    translateY.value += e.touches[0].clientY - lastMouseY.value;
    lastMouseX.value = e.touches[0].clientX;
    lastMouseY.value = e.touches[0].clientY;
  }
};

const handleTouchEnd = () => {
  isDragging.value = false;
};
</script>
