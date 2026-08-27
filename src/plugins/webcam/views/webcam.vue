<template>
  <!-- The page ends above the StatusBar (and above an open status panel) instead of
       running under it — otherwise the control bar below is unreachable in portrait. -->
  <div
    class="webcam-page fixed top-[82px] left-0 right-0 landscape:top-0 landscape:left-(--nav-width) z-10 bg-black flex flex-col md:flex-row overflow-hidden"
    style="
      bottom: calc(
        env(safe-area-inset-bottom, 0px) + var(--statusbar-height) + var(--status-panel-height)
      );
    "
  >
    <!-- Main Image Area -->
    <div class="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
      <WebcamSnapshot />
    </div>

    <!-- Controls Sidebar (Right desktop) or Bottom Bar (Mobile) -->
    <div
      class="h-20 w-full md:h-full md:w-20 lg:w-24 bg-gray-900 border-t md:border-t-0 md:border-l border-gray-800 flex shrink-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] md:shadow-[-4px_0_20px_rgba(0,0,0,0.5)]"
    >
      <WebcamControlBar @open-settings="openSettings" />
    </div>

    <!-- Settings Modal -->
    <WebcamSettingsModal :is-open="showSettingsModal" @close="closeSettings" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useWebcamStore } from '../store/webcamStore.js';
import WebcamSnapshot from '../components/WebcamSnapshot.vue';
import WebcamControlBar from '../components/WebcamControlBar.vue';
import WebcamSettingsModal from '../components/WebcamSettingsModal.vue';

const webcamStore = useWebcamStore();
const showSettingsModal = ref(false);

const openSettings = () => {
  showSettingsModal.value = true;
};

const closeSettings = () => {
  showSettingsModal.value = false;
};

onMounted(() => {
  webcamStore.loadFromLocalStorage();
});
</script>

<style scoped>
/* iOS Safari scroll fix — scoped to the page shell so it cannot reach form controls
   inside teleported children. */
.webcam-page {
  -webkit-user-select: none;
  user-select: none;
}
</style>
