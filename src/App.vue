<template>
  <div class="dark min-h-screen bg-gray-900 text-white">
    <div :class="appLayoutClasses">
      <!-- Navigation -->
      <nav>
        <div :class="navContainerClasses">
          <NavigationComp />
        </div>
      </nav>
      <!-- Logo Splash Screen -->
      <Transition name="splash">
        <div
          v-if="
            (showSplashScreen || (!store.isBackendReachable && $route.path !== '/settings')) &&
            $route.path !== '/setup'
          "
          class="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gray-900 p-4"
        >
          <!-- Minimaler Status-Text -->
          <p
            v-if="!store.isBackendReachable && connectionCheckCompleted"
            class="absolute top-5 left-1/2 transform -translate-x-1/2 text-red-400 text-sm sm:text-base font-medium animate-pulse bg-gray-800 px-4 py-2 rounded-lg border border-red-500/30"
          >
            Trying to establish connection...
          </p>

          <!-- Settings Button -->
          <button
            v-if="!store.isBackendReachable && connectionCheckCompleted"
            @click="showSettingsModal = true"
            class="absolute bottom-10 left-1/2 transform -translate-x-1/2 px-4 py-2 sm:px-6 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white text-sm sm:text-base rounded-lg border border-gray-600 hover:border-gray-500 transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {{ $t('components.settings.title') }}
          </button>

          <h1 class="text-3xl sm:text-4xl md:text-5xl text-yellow-50 font-mono font-bold mb-4">
            {{ $t('app.title') }}
          </h1>
          <img
            class="w-72 h-72"
            src="@/assets/Logo_TouchNStars_600x600.png"
            alt="TouchNStars Logo"
          />
        </div>
      </Transition>

      <div
        v-if="
          !(
            (showSplashScreen || (!store.isBackendReachable && $route.path !== '/settings')) &&
            $route.path !== '/setup'
          )
        "
        :class="mainContentClasses"
      >
        <StellariumView
          v-show="store.showStellarium"
          v-if="settingsStore.setupCompleted && store.isBackendReachable"
          :key="stellariumRefreshKey"
        />
        <router-view v-show="!store.showStellarium" :key="routerViewKey" />
      </div>
      <!-- Footer -->
      <div v-if="settingsStore.setupCompleted" :class="statusBarClasses">
        <StatusBar />
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
    <ToastModal v-if="settingsStore.setupCompleted || store.setupCheckConnectionDone" />
    <!-- ManuellFilterModal Modal -->
    <ManuellFilterModal v-if="store.filterInfo.DeviceId === 'Networked Filter Wheel'" />
    <!-- Debug Console -->
    <ConsoleViewer class="fixed top-32 right-6 z-[60]" v-if="settingsStore.showDebugConsole" />
    <!-- LocationSyncModal -->
    <LocationSyncModal />

    <!-- What's New Modal -->
    <WhatsNewModal
      v-if="showWhatsNew && whatsNewData"
      :data="whatsNewData"
      @close="dismissWhatsNew"
    />

    <!-- Settings Modal -->
    <div
      v-if="showSettingsModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        class="bg-gray-900 rounded-lg w-full h-full sm:w-auto sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto mx-0 sm:mx-4 scrollbar-hide"
      >
        <div
          class="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center"
        >
          <h2 class="text-xl font-bold text-white">{{ $t('components.settings.title') }}</h2>
          <button
            @click="showSettingsModal = false"
            class="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-full"
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
        <div class="p-4">
          <SettingsComp />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useHead } from '@vueuse/head';
import { Capacitor } from '@capacitor/core';
import NavigationComp from '@/components/NavigationComp.vue';
import StellariumView from './views/StellariumView.vue';
import { useLogStore } from '@/store/logStore';
import { useSequenceStore } from './store/sequenceStore';
import { useI18n } from 'vue-i18n';
import TutorialModal from '@/components/TutorialModal.vue';
import ToastModal from '@/components/helpers/ToastModal.vue';
import ManuellFilterModal from '@/components/filterwheel/ManuellFilterModal.vue';
import ConsoleViewer from '@/components/helpers/ConsoleViewer.vue';
import StatusBar from '@/components/status/StatusBar.vue';
import SettingsComp from '@/components/SettingsComp.vue';
import notificationService from './services/notificationService';
import LocationSyncModal from '@/components/helpers/LocationSyncModal.vue';
import { useOrientation } from '@/composables/useOrientation';
import WhatsNewModal from '@/components/helpers/WhatsNewModal.vue';

const store = apiStore();
const settingsStore = useSettingsStore();
const sequenceStore = useSequenceStore();
const logStore = useLogStore();
const showLogsModal = ref(false);
const showTutorial = ref(false);
const showSplashScreen = ref(true);
const showSettingsModal = ref(false);
const showWhatsNew = ref(false);
const whatsNewData = ref(null);
const whatsNewPending = ref(false);
const connectionCheckCompleted = ref(false);
const { t, locale } = useI18n();
const tutorialSteps = computed(() => settingsStore.tutorial.steps);
const orientation = ref(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
const landscapeSwitch = ref(null);
const stellariumRefreshKey = ref(null);
const routerViewKey = ref(Date.now());
let initialWidth = window.innerWidth;
let initialHeight = window.innerHeight;

// Orientierung tracking
const { isLandscape } = useOrientation();

useHead({
  title: 'TouchNStars',
});

function checkOrientationChange() {
  // Force re-render of StellariumView when orientation changes
  if (store.showStellarium) {
    landscapeSwitch.value = Date.now();
  }
}

function updateOrientation() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Prüfen, ob Breite und Höhe sich stark ändern
  if (Math.abs(width - initialWidth) > 100 && Math.abs(height - initialHeight) > 100) {
    const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

    if (newOrientation !== orientation.value) {
      orientation.value = newOrientation;
      checkOrientationChange(); // Force re-render of StellariumView
      routerViewKey.value = Date.now();
      console.log('Orientation changed, re-rendering router-view:', newOrientation);
    }

    initialWidth = width;
    initialHeight = height;
  } else {
    // Auch bei kleinen Änderungen Orientierung prüfen (für bessere Responsivität)
    checkOrientationChange();
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
  'fixed bottom-0 w-full z-20': !isLandscape.value,
  'fixed bottom-0 left-32 right-0 z-20': isLandscape.value,
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
    // Setze Flag für kürzlich zurückgekehrte Seite
    store.setPageReturnedFromBackground();

    // Force UI refresh beim Resume
    routerViewKey.value = Date.now();

    store.startFetchingInfo(t);
    logStore.startFetchingLog();
    if (!sequenceStore.sequenceEdit) {
      sequenceStore.startFetching();
    }
  }
}

onMounted(async () => {
  window.addEventListener('resize', updateOrientation);
  window.addEventListener('orientationchange', handleOrientationChange);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Listen for manual Stellarium refresh ONLY
  window.addEventListener('refresh-stellarium', () => {
    console.log('Manual Stellarium refresh requested');
    stellariumRefreshKey.value = Date.now();
  });

  // Timeout für connectionCheckCompleted nach 3 Sekunden
  const connectionTimeout = setTimeout(() => {
    connectionCheckCompleted.value = true;
  }, 3000);

  await store.fetchAllInfos(t);
  // Nach dem ersten Verbindungsversuch ist die Prüfung abgeschlossen
  connectionCheckCompleted.value = true;
  clearTimeout(connectionTimeout);

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

  // Load What's New content generated at build-time
  try {
    const res = await fetch('/whats-new.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      whatsNewData.value = data;
      const lastShownVersion = localStorage.getItem('tns.whatsnew.version');
      const shouldShow = data?.version && data.version !== lastShownVersion;
      if (shouldShow) {
        if (!showTutorial.value) {
          showWhatsNew.value = true;
        } else {
          whatsNewPending.value = true;
        }
      }
    }
  } catch (e) {
    // silently ignore
  }
});

// Watch for backend connection and add delay before hiding splash screen
watch(
  () => store.isBackendReachable,
  (isReachable) => {
    if (isReachable && showSplashScreen.value) {
      setTimeout(() => {
        showSplashScreen.value = false;
      }, 1000); // 1 second delay
    }
  }
);

function closeTutorial() {
  showTutorial.value = false;
  settingsStore.completeTutorial();
  if (whatsNewPending.value && whatsNewData.value) {
    showWhatsNew.value = true;
    whatsNewPending.value = false;
  }
}

function dismissWhatsNew() {
  showWhatsNew.value = false;
  if (whatsNewData.value?.version) {
    localStorage.setItem('tns.whatsnew.version', whatsNewData.value.version);
  }
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
  window.removeEventListener('refresh-stellarium', () => {
    stellariumRefreshKey.value = Date.now();
  });
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

/* Splash Screen Transition */
.splash-enter-active {
  transition: opacity 0.3s ease-in;
}

.splash-leave-active {
  transition: opacity 0.3s ease-out;
}

.splash-enter-from,
.splash-leave-to {
  opacity: 0;
}
</style>
