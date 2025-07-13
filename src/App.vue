<template>
  <div class="dark min-h-screen bg-gray-900 text-white">
    <div :class="appLayoutClasses">
      <!-- Navigation -->
      <nav>
        <div :class="navContainerClasses">
          <NavigationComp />
        </div>
      </nav>
      <!-- Main content -->
      <div
        v-if="!store.isBackendReachable && !store.showSettings && settingsStore.setupCompleted"
        class="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div class="animate-spin rounded-full h-20 w-20 border-t-8 border-red-600"></div>
      </div>

      <div v-else :class="mainContentClasses">
        <StellariumView
          :key="landscapeSwitch"
          v-show="store.showStellarium"
          v-if="settingsStore.setupCompleted && store.isBackendReachable"
        />
        <router-view :key="orientation" />
      </div>
      <!-- Footer -->
      <div v-if="settingsStore.setupCompleted" :class="statusBarClasses">
        <StatusBar />
      </div>
    </div>

    <!-- Settings Modal -->
    <div
      v-if="store.showSettings"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        class="bg-gray-900 rounded-lg p-4 sm:p-6 w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0 scrollbar-hide"
      >
        <SettingsPage />
        <button
          @click="store.showSettings = false"
          class="fixed sm:absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-gray-400 hover:text-white bg-gray-900 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Logs Modal -->
    <div
      v-if="showLogsModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        class="bg-gray-900 rounded-lg p-4 sm:p-6 w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0 scrollbar-hide"
      >
        <button
          @click="showLogsModal = false"
          class="fixed sm:absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-gray-400 hover:text-white bg-gray-900 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
    <!-- Tutorial Modal -->
    <TutorialModal v-if="showTutorial" :steps="tutorialSteps" @close="closeTutorial" />
    <!-- Error Modal -->
    <ToastModal v-if="settingsStore.setupCompleted" />
    <!-- ManuellFilterModal Modal -->
    <ManuellFilterModal v-if="store.filterInfo.DeviceId === 'Networked Filter Wheel'" />
    <!-- Debug Console -->
    <ConsoleViewer class="fixed top-1/2 left-6" v-if="settingsStore.showDebugConsole" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useHead } from '@vueuse/head';
import { Capacitor } from '@capacitor/core';
import NavigationComp from '@/components/NavigationComp.vue';
import SettingsPage from '@/views/SettingsPage.vue';
import StellariumView from './views/StellariumView.vue';
import { useLogStore } from '@/store/logStore';
import { useSequenceStore } from './store/sequenceStore';
import { useI18n } from 'vue-i18n';
import TutorialModal from '@/components/TutorialModal.vue';
import ToastModal from '@/components/helpers/ToastModal.vue';
import ManuellFilterModal from '@/components/filterwheel/ManuellFilterModal.vue';
import ConsoleViewer from '@/components/helpers/ConsoleViewer.vue';
import StatusBar from '@/components/status/StatusBar.vue';
import apiService from './services/apiService';
import notificationService from './services/notificationService';
import { wait } from './utils/utils';

const store = apiStore();
const settingsStore = useSettingsStore();
const sequenceStore = useSequenceStore();
const logStore = useLogStore();
const showLogsModal = ref(false);
const showTutorial = ref(false);
const { t, locale } = useI18n();
const tutorialSteps = computed(() => settingsStore.tutorial.steps);
const orientation = ref(getCurrentOrientation());
const landscapeSwitch = ref(null);
const routerViewKey = ref(Date.now());
let initialWidth = window.innerWidth;
let initialHeight = window.innerHeight;

// Orientierung tracking
const isLandscape = ref(false);

useHead({
  title: 'TouchNStars',
});

function getCurrentOrientation() {
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

function checkOrientation() {
  const newIsLandscape = window.innerWidth > window.innerHeight;
  if (newIsLandscape !== isLandscape.value) {
    isLandscape.value = newIsLandscape;
    // Force re-render of StellariumView when orientation changes
    if (store.showStellarium) {
      landscapeSwitch.value = Date.now();
    }
  }
}

function updateOrientation() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Prüfen, ob Breite und Höhe sich stark ändern
  if (Math.abs(width - initialWidth) > 100 && Math.abs(height - initialHeight) > 100) {
    const newOrientation = getCurrentOrientation();

    if (newOrientation !== orientation.value) {
      orientation.value = newOrientation;
      checkOrientation(); // Update isLandscape
      routerViewKey.value = Date.now();
      console.log('Orientation changed, re-rendering router-view:', newOrientation);
    }

    initialWidth = width;
    initialHeight = height;
  } else {
    // Auch bei kleinen Änderungen Orientierung prüfen (für bessere Responsivität)
    checkOrientation();
  }
}

// Computed Classes für responsive Layout
const appLayoutClasses = computed(() => ({
  'app-portrait': !isLandscape.value,
  'app-landscape': isLandscape.value,
}));

const navContainerClasses = computed(() => ({
  'z-20 fixed top-0 w-full': !isLandscape.value,
  'z-20 fixed left-0 top-0 h-full': isLandscape.value,
}));

const mainContentClasses = computed(() => ({
  'container mx-auto transition-all pt-[82px] pb-[calc(2.25rem+env(safe-area-inset-bottom)+0.5rem)]':
    !isLandscape.value,
  'transition-all ml-32 mr-4 py-4 pb-16': isLandscape.value,
}));

const statusBarClasses = computed(() => ({
  'fixed bottom-0 w-full z-10': !isLandscape.value,
  'fixed bottom-0 left-32 right-0 z-10': isLandscape.value,
}));

function handleOrientationChange() {
  setTimeout(() => {
    updateOrientation();
  }, 100);
}

function handleVisibilityChange() {
  if (document.hidden) {
    store.stopFetchingInfo();
    logStore.stopFetchingLog();
    sequenceStore.stopFetching();
  } else {
    store.startFetchingInfo(t);
    logStore.startFetchingLog();
    if (!sequenceStore.sequenceEdit) {
      sequenceStore.startFetching();
    }
  }
}

onMounted(async () => {
  checkOrientation(); // Initial orientation check
  window.addEventListener('resize', updateOrientation);
  window.addEventListener('orientationchange', handleOrientationChange);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  await store.fetchAllInfos(t);
  store.startFetchingInfo(t);
  logStore.startFetchingLog();
  if (!sequenceStore.sequenceEdit) {
    sequenceStore.startFetching();
  }

  // Initialize language from settings store
  locale.value = settingsStore.getLanguage();

  // Show tutorial on first visit
  if (!settingsStore.tutorial.completed) {
    showTutorial.value = true;
  }

  // Initialize notification service if notifications are enabled
  if (settingsStore.notifications.enabled && ['android', 'ios'].includes(Capacitor.getPlatform())) {
    await notificationService.initialize();
  }

  //NINA preparation
  await preparationNina();
});

async function preparationNina() {
  //NINA preparation
  if (store.isBackendReachable) {
    //To make Slew and Center work, the framing tab must be opened once
    const response = await apiService.fetchApplicatioTab();
    const actualTab = response.Response;
    await apiService.applicatioTabSwitch('framing');
    await apiService.setFramingImageSource('SKYATLAS');
    //await apiService.setFramingCoordinates(1, 1);
    await wait(5000); //wait to reduce the system load
    await apiService.applicatioTabSwitch(actualTab);
  }
}

function closeTutorial() {
  showTutorial.value = false;
  settingsStore.completeTutorial();
}

watch(
  () => settingsStore.stellarium.landscapesVisible,
  () => {
    landscapeSwitch.value = Date.now();
  }
);

// Watch for Stellarium visibility changes to force re-render
watch(
  () => store.showStellarium,
  (newValue) => {
    if (newValue) {
      landscapeSwitch.value = Date.now();
    }
  }
);

onBeforeUnmount(() => {
  store.stopFetchingInfo();
  logStore.stopFetchingLog();
  sequenceStore.stopFetching();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('resize', updateOrientation);
  window.removeEventListener('orientationchange', handleOrientationChange);
});
</script>

<style scoped>
/* Tablet Landscape Anpassungen */
@media screen and (orientation: landscape) and (max-width: 1024px) {
  .app-landscape .main-content {
    margin-left: 8rem !important;
    margin-right: 1rem !important;
  }

  .app-landscape .status-bar {
    left: 8rem !important;
    right: 0 !important;
  }
}

/* Smooth Transitions */
.container {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Safe Area Support - nur für Portrait unten */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .app-portrait .main-content {
    padding-bottom: calc(2.25rem + env(safe-area-inset-bottom) + 0.5rem);
  }
}

/* Responsive Anpassungen für sehr kleine Bildschirme */
@media (max-width: 480px) {
  .app-landscape .container {
    padding-left: 12rem !important;
    padding-right: 1rem !important;
  }

  .app-landscape .fixed.bottom-0 {
    left: 12rem !important;
    right: 0 !important;
  }
}
</style>