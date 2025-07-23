<template>
  <!-- Modal Overlay -->
  <div 
    v-if="show && imageUrl"
    class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
    style="z-index: 1000;"
    @click="$emit('close')"
  >
    <!-- Modal Content -->
    <div class="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
      <!-- Close Button -->
      <button 
        @click="$emit('close')"
        class="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      
      <!-- PHD2 Image -->
      <img 
        v-if="imageUrl"
        :src="imageUrl" 
        class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        alt="PHD2 Live Image"
        @click.stop
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import apiService from '@/services/apiService';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const imageUrl = ref(null);
let intervalId = null;
let lastImageData = null;

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
watch(() => props.show, (newShow) => {
  if (newShow) {
    // Modal geöffnet - Bilder laden starten
    loadPhd2Image();
    intervalId = setInterval(loadPhd2Image, 2000);
  } else {
    // Modal geschlossen - Interval stoppen
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
});

onMounted(() => {
  if (props.show) {
    loadPhd2Image();
    intervalId = setInterval(loadPhd2Image, 2000);
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
