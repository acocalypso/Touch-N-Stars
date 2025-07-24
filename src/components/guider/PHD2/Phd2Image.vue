<template>
  <div 
    v-if="show && imageUrl" 
    class="absolute inset-0 w-full h-full"
    style="z-index: 1"
  >
    <img
      ref="imageElement"
      :src="imageUrl"
      class="w-full h-full object-contain object-top"
      alt="PHD2 Live Image"
      @load="onImageLoad"
    />

    <!-- Lock Position Overlay -->
    <div
      v-if="lockPosition && imageElement && imageDimensions.width > 0"
      class="absolute inset-0 pointer-events-none"
      :style="overlayStyle"
    >
      <div class="absolute border-2 border-green-500" :style="lockRectangleStyle"></div>
    </div>

    <!-- Guiding Cross Overlay -->
    <div
      v-if="showGuidingCross && lockPosition && imageElement && imageDimensions.width > 0"
      class="absolute inset-0 pointer-events-none"
      :style="overlayStyle"
    >
      <!-- Vertical line -->
      <div
        class="absolute opacity-70"
        :style="guidingCrossVerticalStyle"
        :class="isCalibrating ? 'border-l-2 border-dashed border-green-500' : 'bg-green-500'"
      ></div>
      <!-- Horizontal line -->
      <div
        class="absolute opacity-70"
        :style="guidingCrossHorizontalStyle"
        :class="isCalibrating ? 'border-t-2 border-dashed border-green-500' : 'bg-green-500'"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['close']);

const store = apiStore();
const imageUrl = ref(null);
const lockPosition = ref(null);
const imageElement = ref(null);
const imageDimensions = ref({ width: 0, height: 0 });
let intervalId = null;
let lockPositionIntervalId = null;
let lastImageData = null;

const isGuiding = computed(() => store.guiderInfo?.State === 'Guiding');
const isCalibrating = computed(() => store.guiderInfo?.State === 'Calibrating');
const showGuidingCross = computed(() => isGuiding.value || isCalibrating.value);

const loadLockPosition = async () => {
  try {
    const response = await apiService.getPhd2LockPosition();
    if (response?.Success && response?.Response?.LockPosition) {
      lockPosition.value = response.Response.LockPosition;
    }
  } catch (error) {
    console.log('PHD2 Image: Failed to load lock position:', error);
    lockPosition.value = null;
  }
};

const onImageLoad = () => {
  if (imageElement.value) {
    imageDimensions.value = {
      width: imageElement.value.naturalWidth,
      height: imageElement.value.naturalHeight,
    };
  }
};

// Computed styles for lock position overlay (for object-contain object-top)
const overlayStyle = computed(() => {
  if (!imageElement.value || !imageDimensions.value.width) return {};

  const rect = imageElement.value.getBoundingClientRect();
  const imageAspect = imageDimensions.value.width / imageDimensions.value.height;
  const containerAspect = rect.width / rect.height;

  let renderedWidth, renderedHeight, offsetX, offsetY;

  if (containerAspect > imageAspect) {
    // Container is wider than image - image is limited by height
    renderedHeight = rect.height;
    renderedWidth = renderedHeight * imageAspect;
    offsetX = (rect.width - renderedWidth) / 2; // Horizontal centering
    offsetY = 0; // object-top: aligned to top
  } else {
    // Container is taller than image - image is limited by width
    renderedWidth = rect.width;
    renderedHeight = renderedWidth / imageAspect;
    offsetX = 0; // Full width
    offsetY = 0; // object-top: aligned to top (no centering)
  }

  return {
    width: `${renderedWidth}px`,
    height: `${renderedHeight}px`,
    top: `${offsetY}px`,
    left: `${offsetX}px`,
  };
});

const lockRectangleStyle = computed(() => {
  if (!lockPosition.value || !imageElement.value || !imageDimensions.value.width) return {};

  const overlay = overlayStyle.value;
  const renderedWidth = parseFloat(overlay.width);
  const renderedHeight = parseFloat(overlay.height);
  
  const scaleX = renderedWidth / imageDimensions.value.width;
  const scaleY = renderedHeight / imageDimensions.value.height;

  // Lock position rectangle (typically 15x15 pixels around lock position)
  const rectSize = 30; // 30x30 pixel rectangle
  const scaledSize = rectSize * Math.min(scaleX, scaleY);

  const x = lockPosition.value.X * scaleX - scaledSize / 2;
  const y = lockPosition.value.Y * scaleY - scaledSize / 2;

  return {
    left: `${x}px`,
    top: `${y}px`,
    width: `${scaledSize}px`,
    height: `${scaledSize}px`,
  };
});

// Computed styles for guiding cross centered on lock position
const guidingCrossVerticalStyle = computed(() => {
  if (!lockPosition.value || !imageElement.value || !imageDimensions.value.width) return {};

  const overlay = overlayStyle.value;
  const renderedWidth = parseFloat(overlay.width);
  const renderedHeight = parseFloat(overlay.height);
  
  const scaleX = renderedWidth / imageDimensions.value.width;
  const centerX = lockPosition.value.X * scaleX;

  return {
    left: `${centerX - 1}px`,
    top: '0px',
    width: '2px',
    height: `${renderedHeight}px`,
  };
});

const guidingCrossHorizontalStyle = computed(() => {
  if (!lockPosition.value || !imageElement.value || !imageDimensions.value.width) return {};

  const overlay = overlayStyle.value;
  const renderedWidth = parseFloat(overlay.width);
  const renderedHeight = parseFloat(overlay.height);
  
  const scaleY = renderedHeight / imageDimensions.value.height;
  const centerY = lockPosition.value.Y * scaleY;

  return {
    left: '0px',
    top: `${centerY - 1}px`,
    width: `${renderedWidth}px`,
    height: '2px',
  };
});

const loadPhd2Image = async () => {
  try {
    // Neue Blob-URL holen
    const newUrl = await apiService.getPhd2CurrentImage();

    // Fetch der Blob-Daten um sie zu vergleichen
    const response = await fetch(newUrl);
    const newBlob = await response.blob();
    const newSize = newBlob.size;

    // Nur aktualisieren wenn sich die Bildgröße geändert hat (primitiver Vergleich)
    if (lastImageData !== newSize) {
      // Alte URL freigeben
      if (imageUrl.value) {
        URL.revokeObjectURL(imageUrl.value);
      }

      imageUrl.value = newUrl;
      lastImageData = newSize;
    } else {
      // Neue URL freigeben da sie nicht verwendet wird
      URL.revokeObjectURL(newUrl);
    }
  } catch (error) {
    console.error('PHD2 Image: Failed to load image:', error);
    if (imageUrl.value) {
      URL.revokeObjectURL(imageUrl.value);
      imageUrl.value = null;
    }
    lastImageData = null;
  }
};

// Nur laden wenn Modal geöffnet ist
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      // Modal geöffnet - Bilder und Lock-Position laden starten
      loadPhd2Image();
      loadLockPosition();
      intervalId = setInterval(loadPhd2Image, 2000);
      lockPositionIntervalId = setInterval(loadLockPosition, 3000);
    } else {
      // Modal geschlossen - Intervals stoppen
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (lockPositionIntervalId) {
        clearInterval(lockPositionIntervalId);
        lockPositionIntervalId = null;
      }
      lockPosition.value = null;
    }
  }
);

onMounted(() => {
  if (props.show) {
    loadPhd2Image();
    loadLockPosition();
    intervalId = setInterval(loadPhd2Image, 2000);
    lockPositionIntervalId = setInterval(loadLockPosition, 3000);
  }
});

onUnmounted(() => {
  // Intervals stoppen
  if (intervalId) {
    clearInterval(intervalId);
  }
  if (lockPositionIntervalId) {
    clearInterval(lockPositionIntervalId);
  }

  // URL freigeben
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
});
</script>
