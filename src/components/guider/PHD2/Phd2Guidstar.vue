<template>
  <div v-if="show && imageUrl" class="absolute inset-0 w-full h-full" style="z-index: 1">
    <img
      ref="imageElement"
      :src="imageUrl"
      class="w-full h-full object-contain"
      alt="PHD2 Guidstar"
      @load="onImageLoad"
      style="image-rendering: pixelated;"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import apiService from '@/services/apiService';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['close']);

const imageUrl = ref(null);
const imageElement = ref(null);
let intervalId = null;
let lastImageData = null;

const onImageLoad = () => {
  // Image loaded successfully
};

const loadPhd2StarImage = async () => {
  try {
    // Neue Blob-URL holen
    const newUrl = await apiService.getPhd2StarImage();

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
    console.error('PHD2 Guidstar: Failed to load star image:', error);
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
      // Modal geöffnet - Bilder laden starten
      loadPhd2StarImage();
      intervalId = setInterval(loadPhd2StarImage, 2000);
    } else {
      // Modal geschlossen - Interval stoppen
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  }
);

onMounted(() => {
  if (props.show) {
    loadPhd2StarImage();
    intervalId = setInterval(loadPhd2StarImage, 2000);
  }
});

onUnmounted(() => {
  // Interval stoppen
  if (intervalId) {
    clearInterval(intervalId);
  }

  // URL freigeben
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
});
</script>

