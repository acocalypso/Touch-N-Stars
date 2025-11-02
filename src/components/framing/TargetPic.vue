<template>
  <div class="container flex items-center justify-center relative">
    <div class="relative">
      <img class="rounded-md" v-if="targetPic" :src="targetPic" />

      <!-- Button unten rechts -->
      <button
        @click="showModal = true"
        class="absolute bottom-2 right-2 bg-gray-800 text-gray-400 w-8 h-8 rounded-full shadow-md hover:bg-gray-600 transition"
      >
        ?
      </button>
    </div>
  </div>

  <!-- Modal -->
  <div
    v-if="showModal"
    class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center"
    @click.self="showModal = false"
  >
    <!-- Modal Box -->
    <div class="bg-gray-700 p-6 rounded-md shadow-lg relative w-full max-w-96">
      <!-- "X"-Button oben rechts -->
      <button
        @click="showModal = false"
        class="absolute top-2 right-2 bg-gray-700 text-gray-400 text-xl w-8 h-8 rounded-full hover:bg-gray-600 flex items-center justify-center"
      >
        &times;
      </button>

      <div class="flex items-center space-x-2">
        <InformationCircleIcon class="h-10 w-10 text-blue-500" />
      </div>
      <p class="mt-2 text-gray-400">{{ $t('components.framing.infoTargetImage') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { useFramingStore } from '@/store/framingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { InformationCircleIcon } from '@heroicons/vue/24/outline';

let debounceTimeout;

const framingStore = useFramingStore();
const settingsStore = useSettingsStore();
const targetPic = ref(null);
const showModal = ref(false);

async function getTargetPic() {
  try {
    const ra = framingStore.RAangle;
    const dec = framingStore.DECangle;
    const width = framingStore.width;
    const height = framingStore.height;
    const fov = framingStore.fov;

    const useCache = settingsStore.framing.useNinaCache;
    if (targetPic.value) {
      URL.revokeObjectURL(targetPic.value);
    }
    targetPic.value = await apiService.searchTargetPic(width, height, fov, ra, dec, useCache);
  } catch (error) {
    console.error('Error fetching image:', error);
  }
}

function loadImage() {
  getTargetPic();
}

function debounceLoadImage() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    loadImage();
  }, 1000); // Wartezeit in Millisekunden
}

// Beobachte Änderungen an RAangleString und DECangleString
watch(() => framingStore.RAangle, debounceLoadImage);
watch(() => framingStore.DECangle, debounceLoadImage);

// Lade das Bild beim Mounten der Komponente
onMounted(() => {
  loadImage();
});
</script>

<style scoped></style>
