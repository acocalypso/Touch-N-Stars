<template>
  <div class="overflow-hidden" :style="containerStyle">
    <!-- Control Buttons at Top -->
    <div class="relative z-30 p-4" :class="buttonContainerClass">
      <div
        v-if="!store.guiderInfo.Connected"
        class="p-4 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm"
      >
        <p class="text-red-400 font-medium text-center">
          {{ $t('components.guider.notConnected') }}
        </p>
      </div>

      <div v-else :class="buttonsClass">
        <!-- Start/Stop Button -->
        <button
          @click="toggleGuiding"
          :class="guidingButtonClass"
          :disabled="isProcessing"
          class="px-3 py-3 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm shadow-lg"
        >
          <span class="flex items-center justify-center">
            <template
              v-if="
                store.guiderInfo.State === 'Guiding' || store.guiderInfo.State === 'Calibrating'
              "
            >
              <StopIcon class="w-5 h-5" />
            </template>
            <template v-else-if="isProcessing">
              <svg
                class="animate-spin w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke-width="4" />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </template>
            <template v-else>
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </template>
          </span>
        </button>

        <!-- Settings Button -->
        <button
          v-if="guiderStore.phd2Connection?.IsConnected"
          @click="openSettings = true"
          class="default-button-gray flex items-center justify-center px-3 py-3"
        >
          <Cog6ToothIcon class="w-5 h-5" />
        </button>

        <!-- Status Display -->
        <div class="px-3 py-2 bg-black/30 rounded-lg backdrop-blur-sm">
          <div class="flex items-center gap-2">
            <div class="status-indicator" :class="statusClasses">
              <div class="status-dot"></div>
            </div>
            <span class="text-xs font-medium" :class="statusTextClasses">
              {{ statusText }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- PHD2 Image Background -->
    <div
      v-if="guiderStore.phd2Connection?.IsConnected"
      class="absolute inset-0 w-full h-full"
      :style="imageStyle"
    >
      <Phd2Image :show="true" class="opacity-70" />
    </div>

    <!-- Settings Modal -->
    <Modal :show="openSettings" @close="openSettings = false">
      <template #header>
        <h2 class="text-2xl font-semibold">{{ $t('components.camera.settings') }}</h2>
      </template>
      <template #body>
        <div class="flex flex-col gap-1 mt-2 w-full">
          <Phd2Settings />
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { apiStore } from '@/store/store';
import { useGuiderStore } from '@/store/guiderStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Cog6ToothIcon, StopIcon } from '@heroicons/vue/24/outline';
import Phd2Settings from '@/components/guider/PHD2/Phd2Settings.vue';
import Phd2Image from '@/components/guider/PHD2/Phd2Image.vue';
import Modal from '@/components/helpers/Modal.vue';
import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { useOrientation } from '@/composables/useOrientation';

const store = apiStore();
const guiderStore = useGuiderStore();
const settingsStore = useSettingsStore();
const { isLandscape } = useOrientation();
const { t: $t } = useI18n();
const openSettings = ref(false);
const isProcessing = ref(false);

const containerStyle = computed(() => {
  if (isLandscape.value) {
    // Landscape: Full viewport minus sidebar, go to bottom
    return {
      position: 'fixed',
      top: '0',
      left: '8rem', // Start after 128px sidebar
      right: '0',
      bottom: '0', // Go all the way to bottom
      width: 'auto',
      height: 'auto',
    };
  } else {
    // Portrait: Full viewport minus navbar and status bar
    return {
      position: 'fixed',
      top: '82px', // Start after navbar
      left: '0',
      right: '0',
      bottom: 'calc(2.25rem + env(safe-area-inset-bottom) + 0.5rem)', // Stop before status bar
      width: 'auto',
      height: 'auto',
    };
  }
});

const buttonContainerClass = computed(() => {
  if (isLandscape.value) {
    return 'flex justify-end items-start'; // Right alignment in landscape
  } else {
    return 'flex justify-center items-center'; // Center in portrait
  }
});

const buttonsClass = computed(() => {
  if (isLandscape.value) {
    return 'flex flex-col gap-3'; // Vertical layout in landscape
  } else {
    return 'flex items-center justify-center gap-3'; // Horizontal layout in portrait
  }
});

const imageStyle = computed(() => {
  if (isLandscape.value) {
    // Landscape: Image starts from top, buttons overlay on top-right
    return {
      top: '0',
      height: '100%',
    };
  } else {
    // Portrait: Image starts below buttons
    return {
      top: '80px',
      height: 'calc(100% - 80px)',
    };
  }
});

// Status computed properties
const statusText = computed(() => {
  const state = store.guiderInfo?.State;
  if (!state) return $t('components.guider.status.unknown');

  switch (state) {
    case 'Looping':
      return $t('components.guider.status.looping');
    case 'LostLock':
      return $t('components.guider.status.lostLock');
    case 'Guiding':
      return $t('components.guider.status.guiding');
    case 'Stopped':
      return $t('components.guider.status.stopped');
    case 'Calibrating':
      return $t('components.guider.status.calibrating');
    default:
      return state;
  }
});

const statusClasses = computed(() => {
  const state = store.guiderInfo?.State;
  return {
    'status-guiding': state === 'Guiding',
    'status-calibrating': state === 'Calibrating',
    'status-looping': state === 'Looping',
    'status-error': state === 'LostLock',
    'status-stopped': state === 'Stopped',
    'status-unknown': !state,
  };
});

const statusTextClasses = computed(() => {
  const state = store.guiderInfo?.State;
  return {
    'text-green-400': state === 'Guiding',
    'text-blue-400': state === 'Calibrating',
    'text-yellow-400': state === 'Looping',
    'text-red-400': state === 'LostLock',
    'text-gray-400': state === 'Stopped',
    'text-gray-500': !state,
  };
});

const guidingButtonClass = computed(() => {
  const state = store.guiderInfo?.State;

  // Show red for both Guiding and Calibrating states
  if (state === 'Guiding' || state === 'Calibrating') {
    return 'default-button-red';
  } else if (isProcessing.value && state !== 'Calibrating') {
    return 'default-button-blue';
  } else {
    return 'default-button-cyan';
  }
});

// Toggle guiding function
async function toggleGuiding() {
  if (isProcessing.value) return;

  isProcessing.value = true;
  try {
    const state = store.guiderInfo?.State;

    if (state === 'Guiding' || state === 'Calibrating') {
      await apiService.guiderAction('stop');
      console.log('Guider stopped');
    } else {
      await apiService.guiderStart(settingsStore.guider.phd2ForceCalibration);
      console.log(
        'Guider started',
        settingsStore.guider.phd2ForceCalibration
          ? 'with forced calibration'
          : 'without forced calibration'
      );
    }
  } catch (error) {
    console.error('Fehler beim Guiding Toggle:', error.response?.data || error);
  } finally {
    isProcessing.value = false;
  }
}
</script>

<style scoped>
.status-indicator {
  @apply relative w-4 h-4 rounded-full flex items-center justify-center;
}

.status-dot {
  @apply w-3 h-3 rounded-full animate-pulse;
}

.status-guiding .status-dot {
  @apply bg-green-500 shadow-lg shadow-green-500/50;
}

.status-calibrating .status-dot {
  @apply bg-blue-500 shadow-lg shadow-blue-500/50;
}

.status-looping .status-dot {
  @apply bg-yellow-500 shadow-lg shadow-yellow-500/50;
}

.status-error .status-dot {
  @apply bg-red-500 shadow-lg shadow-red-500/50;
}

.status-stopped .status-dot {
  @apply bg-gray-500 shadow-lg shadow-gray-500/50;
  animation: none;
}

.status-unknown .status-dot {
  @apply bg-gray-600 shadow-lg shadow-gray-600/50;
  animation: none;
}
</style>
