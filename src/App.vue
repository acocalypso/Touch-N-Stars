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
    <!-- Debug Console -->
    <ConsoleViewer class="fixed top-32 right-6 z-[60]" v-if="settingsStore.showDebugConsole" />
    <!-- LocationSyncModal -->
    <LocationSyncModal />

    <!-- Update Available Modal -->
    <UpdateAvailableModal
      v-if="showUpdateModal && updateInfo"
      :version="updateInfo.version"
      :release-notes="updateInfo.notes"
      :whats-new="updateInfo.whatsNew"
      :progress="updateProgress"
      :status="updateStatus"
      :error="updateError"
      @confirm="handleUpdateConfirm"
      @cancel="handleUpdateCancel"
    />

    <!-- What's New Modal -->
    <WhatsNewModal
      v-if="showWhatsNew && whatsNewData"
      :data="whatsNewData"
      @close="dismissWhatsNew"
    />

    <!-- Dialog Modal -->
    <DialogModal />

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
import { App as CapacitorApp } from '@capacitor/app';
import { KeepAwake } from '@capacitor-community/keep-awake';
import NavigationComp from '@/components/NavigationComp.vue';
import StellariumView from './views/StellariumView.vue';
import { useLogStore } from '@/store/logStore';
import { useSequenceStore } from './store/sequenceStore';
import { useCameraStore } from './store/cameraStore';
import { useDialogStore } from './store/dialogStore';
import { useI18n } from 'vue-i18n';
import TutorialModal from '@/components/TutorialModal.vue';
import ToastModal from '@/components/helpers/ToastModal.vue';
import ConsoleViewer from '@/components/helpers/ConsoleViewer.vue';
import StatusBar from '@/components/status/StatusBar.vue';
import SettingsComp from '@/components/SettingsComp.vue';
import notificationService from './services/notificationService';
import LocationSyncModal from '@/components/helpers/LocationSyncModal.vue';
import { useOrientation } from '@/composables/useOrientation';
import WhatsNewModal from '@/components/helpers/WhatsNewModal.vue';
import DialogModal from '@/components/helpers/DialogModal.vue';
import UpdateAvailableModal from '@/components/helpers/UpdateAvailableModal.vue';
import {
  checkForManualUpdate,
  downloadAndApplyUpdate,
  fetchChangelogWhatsNew,
  isNativePlatform,
} from '@/services/updateService';

const store = apiStore();
const settingsStore = useSettingsStore();
const sequenceStore = useSequenceStore();
const logStore = useLogStore();
const cameraStore = useCameraStore();
const dialogStore = useDialogStore();
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
const showUpdateModal = ref(false);
const updateInfo = ref(null);
const updateStatus = ref('idle');
const updateProgress = ref(0);
const updateError = ref('');
const dismissedUpdateVersion = ref(null);
const checkingUpdate = ref(false);
let initialWidth = window.innerWidth;
let initialHeight = window.innerHeight;

// Orientation tracking
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

  // Check if width and height changed significantly
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
    // Also check orientation for small changes (for better responsiveness)
    checkOrientationChange();
  }
}

// Computed classes for responsive layout
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

function pauseApp() {
  console.log('App paused, stopping all intervals...');
  store.stopFetchingInfo();
  logStore.stopFetchingLog();
  sequenceStore.stopFetching();
  cameraStore.stopCountdown();
  dialogStore.stopPolling();
  // Alle Flags zurücksetzen für sauberen Neustart beim Resume
  store.clearAllStates();
}

async function resumeApp() {
  console.log('App resumed, restarting intervals...');

  // Set flag for recently returned from background
  store.setPageReturnedFromBackground();

  // Force UI refresh on resume
  routerViewKey.value = Date.now();

  // Important: Re-enable WebSocket Channel Service shouldReconnect flag
  const wsChannelService = (await import('@/services/websocketChannelSocket')).default;
  wsChannelService.shouldReconnect = true;

  await store.fetchAllInfos(t);
  store.startFetchingInfo(t);
  logStore.startFetchingLog();
  dialogStore.startPolling();
  if (!sequenceStore.sequenceEdit) {
    sequenceStore.startFetching();
  }

  // Restart countdown if exposure is running
  if (store.cameraInfo.IsExposing && store.cameraInfo.ExposureEndTime) {
    console.log('Restarting exposure countdown after resume...');
    cameraStore.updateCountdown();
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    pauseApp();
  } else {
    resumeApp();
  }
}

function handlePageShow() {
  // pageshow is triggered faster than visibilitychange
  if (!document.hidden) {
    resumeApp();
  }
}

function handleFocus() {
  // focus event as additional trigger
  if (!document.hidden) {
    resumeApp();
  }
}

async function checkForAppUpdate() {
  if (!isNativePlatform() || checkingUpdate.value || showUpdateModal.value) {
    return;
  }

  checkingUpdate.value = true;
  try {
    const result = await checkForManualUpdate();
    if (result?.available && result.version !== dismissedUpdateVersion.value) {
      let whatsNewDetails = null;
      try {
        whatsNewDetails = await fetchChangelogWhatsNew();
        console.info('Update whats-new content resolved:', whatsNewDetails);
      } catch (whatsNewError) {
        console.warn('Failed to load whats-new content:', whatsNewError);
      }

      updateInfo.value = {
        ...result,
        whatsNew: whatsNewDetails,
      };
      updateStatus.value = 'idle';
      updateProgress.value = 0;
      updateError.value = '';
      showUpdateModal.value = true;
    }
  } catch (error) {
    console.warn('Update check failed:', error);
  } finally {
    checkingUpdate.value = false;
  }
}

async function handleUpdateConfirm() {
  if (!updateInfo.value || updateStatus.value === 'downloading') {
    return;
  }

  updateStatus.value = 'downloading';
  updateError.value = '';
  updateProgress.value = 0;

  try {
    await downloadAndApplyUpdate({
      version: updateInfo.value.version,
      downloadUrl: updateInfo.value.downloadUrl,
      onProgress: (percent) => {
        if (Number.isFinite(percent)) {
          updateProgress.value = Math.min(100, Math.max(0, percent));
        }
      },
      onPreparing: () => {
        updateStatus.value = 'setting';
      },
    });
  } catch (error) {
    console.warn('Manual update failed:', error);
    updateStatus.value = 'error';
    const message = error?.message ? `${t('updates.error')} ${error.message}` : t('updates.error');
    updateError.value = message.trim();
  }
}

function handleUpdateCancel() {
  if (updateStatus.value === 'downloading' || updateStatus.value === 'setting') {
    return;
  }

  if (updateInfo.value?.version) {
    dismissedUpdateVersion.value = updateInfo.value.version;
  }

  showUpdateModal.value = false;
  updateStatus.value = 'idle';
  updateProgress.value = 0;
  updateError.value = '';
  updateInfo.value = null;
}

onMounted(async () => {
  window.addEventListener('resize', updateOrientation);
  window.addEventListener('orientationchange', handleOrientationChange);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pageshow', handlePageShow);
  window.addEventListener('focus', handleFocus);

  if (isNativePlatform()) {
    void checkForAppUpdate();
  }

  // Capacitor App Lifecycle Events for mobile platforms
  if (['android', 'ios'].includes(Capacitor.getPlatform())) {
    CapacitorApp.addListener('pause', () => {
      console.log('Capacitor App pause event');
      pauseApp();
    });

    CapacitorApp.addListener('resume', () => {
      console.log('Capacitor App resume event');
      resumeApp();
    });

    CapacitorApp.addListener('appStateChange', (state) => {
      console.log('Capacitor App state change:', state.isActive);
      if (state.isActive) {
        resumeApp();
      } else {
        pauseApp();
      }
    });
  }

  // Listen for manual Stellarium refresh ONLY
  window.addEventListener('refresh-stellarium', () => {
    console.log('Manual Stellarium refresh requested');
    stellariumRefreshKey.value = Date.now();
  });

  // Timeout for connectionCheckCompleted after 3 seconds
  const connectionTimeout = setTimeout(() => {
    connectionCheckCompleted.value = true;
  }, 3000);

  await store.fetchAllInfos(t);
  // Connection check is completed after first connection attempt
  connectionCheckCompleted.value = true;
  clearTimeout(connectionTimeout);

  store.startFetchingInfo(t);
  logStore.startFetchingLog();
  dialogStore.startPolling();
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

  // Initialize Keep Screen Awake for mobile platforms
  if (['android', 'ios'].includes(Capacitor.getPlatform())) {
    try {
      const res = await KeepAwake.isSupported();
      if (res?.isSupported && settingsStore.keepAwakeEnabled) {
        setTimeout(async () => {
          try {
            await KeepAwake.keepAwake();
            console.log('Keep Awake activated on app start');
          } catch (e) {
            console.warn('KeepAwake activation error:', e);
          }
        }, 1000);
      }
    } catch (e) {
      console.warn('KeepAwake support check failed:', e);
    }
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
      }, 200); // delay
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

onBeforeUnmount(async () => {
  console.log('App.vue unmounted, cleaning up...');
  store.stopFetchingInfo();
  logStore.stopFetchingLog();
  sequenceStore.stopFetching();
  dialogStore.stopPolling();
  store.clearAllStates();
  store.isApiConnected = false;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('pageshow', handlePageShow);
  window.removeEventListener('focus', handleFocus);
  window.removeEventListener('resize', updateOrientation);
  window.removeEventListener('orientationchange', handleOrientationChange);
  window.removeEventListener('refresh-stellarium', () => {
    stellariumRefreshKey.value = Date.now();
  });

  // Remove Capacitor listeners
  if (['android', 'ios'].includes(Capacitor.getPlatform())) {
    await CapacitorApp.removeAllListeners();
  }
});
</script>

<style scoped>
/* Tablet Landscape Adjustments */
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

/* Safe Area Support - only for portrait bottom */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .app-portrait .main-content {
    padding-bottom: calc(2.25rem + env(safe-area-inset-bottom) + 0.5rem);
  }
}

/* Responsive adjustments for very small screens */
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
