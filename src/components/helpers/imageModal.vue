<template>
  <!-- Nur anzeigen, wenn showModal true ist -->
  <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Halbtransparenter Overlay-Hintergrund -->
    <div class="absolute inset-0 bg-black bg-opacity-70" @click="closeModal"></div>
    <div v-if="isLoading">
      <!-- Spinner -->
      <div class="flex items-center justify-center w-full h-full">
        <div
          class="w-12 h-12 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"
        ></div>
      </div>
    </div>
    <!-- Inhalt der Modal -->
    <div v-else class="relative w-full h-full bg-gray-900 z-60 flex items-center justify-center">
      <button
        class="absolute rounded-full h-8 w-8 shadow-lg shadow-black flex justify-center items-center bg-gray-800 top-4 right-4 text-white hover:text-gray-300 text-2xl font-extrabold z-70"
        @click="closeModal"
        aria-label="Schließen"
      >
        ✕
      </button>

      <!-- Zoom Overlay -->
      <div
        class="absolute top-4 left-4 shadow-lg shadow-black bg-gray-800 text-white text-sm px-3 py-1 rounded-lg z-[100] pointer-events-none"
      >
        Zoom: {{ zoomLevel.toFixed(2) }}x
      </div>
      <!-- Download Button -->
      <button
        v-if="imageData"
        @click="downloadImage"
        class="absolute top-4 right-20 rounded-lg bg-gray-800 text-white text-sm px-3 py-1 shadow-lg shadow-black hover:bg-gray-700 transition z-[100]"
      >
        <ArrowDownTrayIcon class="h-6" />
      </button>

      <div
        ref="imageContainer"
        class="w-full h-full overflow-hidden relative flex items-center justify-center shadow-md shadow-cyan-900"
      >
        <img
          v-if="imageData"
          :src="imageData"
          ref="image"
          @load="onImageLoad"
          class="w-full h-full object-contain cursor-move"
          alt="Vergrößertes Bild"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import Panzoom from 'panzoom';
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const props = defineProps({
  showModal: {
    type: Boolean,
    default: false,
  },
  imageData: {
    type: String,
    default: null,
  },
  imageDate: {
    type: String,
    default: '0000-00-00',
  },
  isLoading: {
    type: Boolean,
    default: true,
  },
});

const emits = defineEmits(['close']);
const image = ref(null);
let panzoomInstance = null;
const zoomLevel = ref(1);
const originalWidth = ref(1);
const originalHeight = ref(1);
const currentWidth = ref(1);
const currentHeight = ref(1);

function closeModal() {
  emits('close');
}

const logZoomLevel = () => {
  if (image.value) {
    const { width, height } = image.value.getBoundingClientRect();
    currentWidth.value = width;
    currentHeight.value = height;

    const zoomX = width / originalWidth.value;
    const zoomY = height / originalHeight.value;
    zoomLevel.value = Math.max(zoomX, zoomY);
  }
};

const initializePanzoom = () => {
  if (image.value) {
    originalWidth.value = image.value.naturalWidth;
    originalHeight.value = image.value.naturalHeight;

    panzoomInstance = Panzoom(image.value, {
      maxZoom: 40,
      minZoom: 0.5,
      contain: 'inside',
      smoothScroll: true,
    });

    panzoomInstance.on('zoom', logZoomLevel);
    logZoomLevel();

    image.value.addEventListener(
      'touchmove',
      (event) => {
        event.preventDefault();
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

async function downloadImage() {
  const now = new Date();
  const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const folderName = `TNS-Images-${currentDate}`;

  let fileName = `TNS-${props.imageDate}.jpg`;

  if (props.imageDate === '0000-00-00') {
    fileName = `TNS-${currentDate}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.jpg`;
  }

  console.log('Save ', fileName, 'to folder', folderName);

  if (!props.imageData) return;

  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') {
    try {
      // Use Documents directory for both platforms for better compatibility
      const directory = Directory.Documents;

      // Convert the image to base64
      const response = await fetch(props.imageData);
      const blob = await response.blob();

      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });

      // Create TNS-Images-{date} directory if it doesn't exist
      try {
        await Filesystem.mkdir({
          path: folderName,
          directory: directory,
          recursive: true,
        });
      } catch (mkdirError) {
        // Directory might already exist, ignore error
        if (
          !mkdirError.message.includes('Directory exists') &&
          !mkdirError.message.includes('already exists')
        ) {
          console.warn('Error creating directory:', mkdirError);
        }
      }

      // Write the image file to the date-specific folder
      await Filesystem.writeFile({
        path: `${folderName}/${fileName}`,
        data: base64Data,
        directory: directory,
        encoding: undefined, // Use default encoding for binary data
      });
      console.log(`Image saved successfully to ${folderName}/${fileName}`);

      if (platform === 'android') {
        // For Android, make the file accessible in the media store
        try {
          // Get the URI of the saved file
          const uriResult = await Filesystem.getUri({
            path: `${folderName}/${fileName}`,
            directory: directory,
          });

          console.log(`File URI: ${uriResult.uri}`);
        } catch (uriError) {
          console.warn('Error getting file URI:', uriError);
        }

        alert(`Image saved to ${folderName} folder in device storage.`);
      } else if (platform === 'ios') {
        alert(`Image saved to ${folderName} folder. You can access it from the Files app.`);
      }
    } catch (error) {
      console.error('Error saving image:', error);

      // Fallback for mobile platforms
      try {
        const response = await fetch(props.imageData);
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => {
          URL.revokeObjectURL(downloadUrl);
        }, 100);

        alert('Image downloaded using fallback method.');
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        alert('Download failed. Please try again.');
      }
    }
  } else {
    // Standard web browser download
    const response = await fetch(props.imageData);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}

const onImageLoad = () => {
  nextTick(() => {
    destroyPanzoom();
    initializePanzoom();
  });
};

watch(
  () => props.showModal,
  (newVal) => {
    if (!newVal) {
      destroyPanzoom();
    }
  }
);

onBeforeUnmount(() => {
  destroyPanzoom();
});
</script>

<style scoped>
.modal-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.image-container {
  overflow: hidden;
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: move;
}

button[aria-label='Schließen'] {
  z-index: 70;
}
</style>
