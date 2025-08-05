<template>
  <div class="container py-16 flex items-center justify-center">
    <div class="container max-w-4xl">
      <h5 class="text-2xl text-center font-bold text-white mb-4">Webcam</h5>

      <div class="flex flex-col space-y-4">
        <!-- Webcam Snapshot Display -->
        <div
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <h6 class="text-lg font-semibold text-white mb-4">{{ t('plugins.webcam.liveView') }}</h6>
          <WebcamSnapshot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWebcamStore } from '../store/webcamStore.js';
import WebcamSnapshot from '../components/WebcamSnapshot.vue';

const { t } = useI18n();
const webcamStore = useWebcamStore();

onMounted(() => {
  webcamStore.loadFromLocalStorage();
});
</script>
