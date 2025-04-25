<template>
  <div class="dark min-h-screen bg-gray-900 text-white">
    <div>
      <!-- Navigation -->
      <nav>
        <div class="z-20 fixed top-0 w-full">
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

      <div v-else class="container mx-auto p-0.5 transition-all pt-[82px]">
        <StellariumView
          v-show="store.showStellarium && !isIOS"
          v-if="settingsStore.setupCompleted && !isIOS"
        />
        <router-view />
      </div>
      <!-- Footer -->
      <div v-if="settingsStore.setupCompleted">
        <button @click="showLogsModal = true" class="fixed bottom-0 w-full">
          <LastMessage class="fixed bottom-0 w-full" />
        </button>
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
        <LastLogs />
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
    <ManuellFilterModal v-if="store.filterInfo.DeviceId === 'Networked Filter Wheel'" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useHead } from '@vueuse/head';
import { Capacitor } from '@capacitor/core';
import NavigationComp from '@/components/NavigationComp.vue';
import LastMessage from '@/components/LastMessage.vue';
import SettingsPage from '@/views/SettingsPage.vue';
import LastLogs from '@/components/LastLogs.vue';
import StellariumView from './views/StellariumView.vue';
import { useLogStore } from '@/store/logStore';
import { useSequenceStore } from './store/sequenceStore';
import { useI18n } from 'vue-i18n';
import TutorialModal from '@/components/TutorialModal.vue';
import ToastModal from '@/components/helpers/ToastModal.vue';
import ManuellFilterModal from '@/components/filterwheel/ManuellFilterModal.vue';
import apiService from './services/apiService';
import { wait } from './utils/utils';

const store = apiStore();
const settingsStore = useSettingsStore();
const sequenceStore = useSequenceStore();
const logStore = useLogStore();
const showLogsModal = ref(false);
const showTutorial = ref(false);
const { t, locale } = useI18n();

useHead({
  title: 'TouchNStars',
});

const tutorialSteps = computed(() => settingsStore.tutorial.steps);

const isIOS = computed(() => Capacitor.getPlatform() === 'ios');

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
    await apiService.setFramingCoordinates(1, 1);
    await wait(1000);
    await apiService.applicatioTabSwitch(actualTab);
  }
}

function closeTutorial() {
  showTutorial.value = false;
  settingsStore.completeTutorial();
}

onBeforeUnmount(() => {
  store.stopFetchingInfo();
  logStore.stopFetchingLog();
  sequenceStore.stopFetching();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style scoped></style>
