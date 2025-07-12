<template>
  <!-- Capture & Cancel Buttons -->
  <div
    class="fixed flex items-center justify-center z-50 bg-gray-900/50 backdrop-blur-md p-3 rounded-xl border border-gray-700 shadow-lg shadow-black transition-all duration-300"
    :class="[containerClasses, gapClasses]"
    :style="containerStyle"
  >
    <!-- Close dropdown when clicking outside -->
    <div v-if="showDropdown" class="dropdown-backdrop" @click="showDropdown = false"></div>
    <!-- Capture / Cancel Combined Button -->
    <button
      class="relative flex-shrink-0 rounded-full flex items-center justify-center shadow-md shadow-black border border-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      :class="[cameraStore.isExposure ? 'bg-red-600' : 'bg-gray-600', buttonSizeClasses]"
      @click="
        cameraStore.isExposure
          ? cameraStore.abortExposure(apiService)
          : cameraStore.capturePhoto(
              apiService,
              settingsStore.camera.exposureTime,
              settingsStore.camera.gain,
              settingsStore.camera.useSolve
            )
      "
      :disabled="(cameraStore.loading && !cameraStore.isExposure) || sequenceStore.sequenceRunning"
    >
      <!-- Belichtungsfortschritt -->
      <template v-if="cameraStore.isExposure">
        <svg :class="iconSizeClasses" class="absolute inset-0" viewBox="0 0 36 36">
          <path
            class="text-white text-opacity-30 fill-none stroke-current stroke-[2.8]"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            class="fill-none stroke-white stroke-[2.8]"
            :style="{
              strokeDasharray: cameraStore.progress + ', 100',
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
            }"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span class="text-white font-semibold text-sm z-10">
          {{ cameraStore.remainingExposureTime }}s
        </span>
      </template>

      <!-- Icon-Wechsel basierend auf Belichtungsstatus -->
      <template v-else>
        <template v-if="cameraStore.loading">
          <div class="loader"></div>
        </template>
        <template v-else>
          <svg
            :class="iconSizeClasses"
            viewBox="0 0 72 72"
            id="emoji"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g id="color" />
            <g id="line">
              <circle
                cx="36"
                cy="36"
                r="25"
                fill="none"
                stroke="#D1D5DB"
                stroke-linejoin="round"
                stroke-miterlimit="10"
                stroke-width="2"
              />
              <circle cx="36" cy="36" r="10" fill="#D1D5DB" stroke="none" />
            </g>
            <g id="color-foreground">
              <circle cx="36" cy="36" r="10" fill="#DC2626" stroke="none" />
            </g>
          </svg>
        </template>
      </template>
    </button>

    <button
      @click="cameraStore.isLooping = !cameraStore.isLooping"
      :class="[
        'flex-shrink-0 rounded-full bg-gray-600 flex items-center justify-center shadow-md shadow-black border border-cyan-900 transition-colors duration-200',
        cameraStore.isLooping ? 'text-green-400 glow-green' : 'text-gray-300',
        buttonSizeClasses,
      ]"
    >
      <ArrowPathIcon :class="smallIconSizeClasses" />
    </button>

    <!-- Exposure Time Input with Dropdown -->
    <div class="flex flex-col items-center gap-1 flex-shrink-0">
      <!-- Label -->
      <label for="exposure" :class="labelClasses">
        {{ $t('components.camera.exposure_time') }}
      </label>

      <!-- Combined Input and Dropdown -->
      <div class="relative">
        <!-- Zeit-Eingabe -->
        <input
          id="exposure"
          v-model.number="settingsStore.camera.exposureTime"
          type="number"
          min="0"
          step="0.1"
          :class="inputClasses"
          placeholder="Sek."
          @focus="showDropdown = false"
        />

        <!-- Dropdown Button -->
        <button
          @click="showDropdown = !showDropdown"
          :class="[
            'absolute right-0 top-0 h-full bg-gray-700 border-l border-gray-600 rounded-r-md hover:bg-gray-600 transition-colors',
            dropdownButtonClasses,
          ]"
          type="button"
        >
          <svg class="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showDropdown"
          :class="[
            'absolute z-50 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto scrollbar-hide',
            dropdownClasses,
          ]"
        >
          <div class="py-1">
            <!-- Quick Times -->
            <button
              v-for="time in quickTimes"
              :key="'quick-' + time"
              @click="selectTime(time)"
              class="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
            >
              {{ formatTime(time) }}
            </button>

            <!-- Common Times -->
            <button
              v-for="time in commonTimes"
              :key="'common-' + time"
              @click="selectTime(time)"
              class="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
            >
              {{ formatTime(time) }}
            </button>

            <!-- Long Exposure -->
            <button
              v-for="time in longTimes"
              :key="'long-' + time"
              @click="selectTime(time)"
              class="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
            >
              {{ formatTime(time) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-shrink-0">
      <button
        @click="openSettings = true"
        :class="[
          'rounded-full bg-gray-600 flex items-center justify-center shadow-md shadow-black border border-cyan-900 transition-colors duration-200',
          buttonSizeClasses,
        ]"
      >
        <Cog6ToothIcon :class="smallIconSizeClasses" class="text-gray-300" />
      </button>

      <Modal :show="openSettings" @close="openSettings = false">
        <template #header>
          <h2 class="text-2xl font-semibold">{{ $t('components.camera.settings') }}</h2>
        </template>

        <template #body>
          <!-- Beliebiger Inhalt hier -->
          <SettingsModal />
        </template>
      </Modal>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import apiService from '@/services/apiService';
import { useCameraStore } from '@/store/cameraStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSequenceStore } from '@/store/sequenceStore';
import { useGuiderStore } from '@/store/guiderStore';
import { ArrowPathIcon } from '@heroicons/vue/24/outline';
import Modal from '@/components/helpers/Modal.vue';
import SettingsModal from '@/components/camera/SettingsModal.vue';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';

const cameraStore = useCameraStore();
const settingsStore = useSettingsStore();
const sequenceStore = useSequenceStore();
const guiderStore = useGuiderStore();
const openSettings = ref(false);
const showDropdown = ref(false);

// Astrophotography exposure time presets
const quickTimes = [0.1, 0.2, 0.5, 1, 2, 3, 5];
const commonTimes = [10, 15, 20, 30, 45, 60, 90, 120];
const longTimes = [180, 240, 300, 480, 600, 900];

// Functions
const selectTime = (time) => {
  settingsStore.camera.exposureTime = time;
  showDropdown.value = false;
};

const formatTime = (seconds) => {
  if (seconds < 1) {
    return `${seconds}s`;
  } else if (seconds < 60) {
    return `${seconds}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes}m`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  }
};

// Check if in landscape mode
const isLandscape = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth > window.innerHeight;
  }
  return false;
});

// Container positioning classes
const containerClasses = computed(() => ({
  // Portrait mode - bottom center
  'right-1/2 translate-x-1/2 flex-row': !isLandscape.value,
  // Landscape mode - left side vertical (changed from right to left)
  'left-2 top-1/2 -translate-y-1/2 flex-col': isLandscape.value,
}));

// Gap classes for different orientations
const gapClasses = computed(() => {
  if (isLandscape.value) {
    return 'gap-3'; // All landscape devices
  }
  return 'gap-4'; // Portrait mode
});

// Container dynamic styles
const containerStyle = computed(() => {
  const baseBottom = guiderStore.showGuiderGraph
    ? 'calc(18rem + env(safe-area-inset-bottom, 0px))' // bottom-72 = 18rem
    : 'calc(2.75rem + env(safe-area-inset-bottom, 0px))'; // bottom-11 = 2.75rem

  return !isLandscape.value ? { bottom: baseBottom } : {};
});

// Responsive button sizes
const buttonSizeClasses = computed(() => {
  if (isLandscape.value) {
    return 'w-12 h-12'; // All landscape devices
  }
  return 'w-16 h-16'; // Portrait mode
});

// Icon sizes
const iconSizeClasses = computed(() => {
  if (isLandscape.value) {
    return 'w-12 h-12'; // All landscape
  }
  return 'w-16 h-16'; // Portrait
});

const smallIconSizeClasses = computed(() => {
  if (isLandscape.value) {
    return 'w-6 h-6'; // All landscape
  }
  return 'w-8 h-8'; // Portrait
});

// Input field classes
const inputClasses = computed(() => {
  let baseClasses = 'default-input text-center h-10';

  if (isLandscape.value) {
    return `${baseClasses} pr-5 w-20 text-sm`; // All landscape devices
  }

  return `${baseClasses} pr-8 w-24`; // Portrait mode
});

// Dropdown button classes
const dropdownButtonClasses = computed(() => {
  if (isLandscape.value) {
    return 'w-4 px-0.5'; // All landscape devices
  }
  return 'w-8 px-2'; // Portrait mode
});

// Dropdown positioning classes
const dropdownClasses = computed(() => {
  if (isLandscape.value) {
    return 'bottom-full mb-2 left-0 w-40'; // Above input in landscape, aligned left (changed from right-0 to left-0)
  }
  return 'bottom-full mb-2 right-0 w-44'; // Above input in portrait (changed from top-full)
});

// Label classes
const labelClasses = computed(() => {
  if (isLandscape.value) {
    return 'text-xs text-gray-300 text-center'; // All landscape
  }
  return 'text-sm text-gray-300'; // Portrait
});
</script>

<style scoped>
.loader {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Additional responsive adjustments */
@media (max-height: 600px) and (orientation: landscape) {
  /* Very small landscape screens - reduce gap */
  .gap-4 {
    gap: 0.5rem !important;
  }
  .gap-3 {
    gap: 0.375rem !important;
  }
}

@media (max-width: 480px) and (orientation: landscape) {
  /* Very small landscape screens */
  .left-2 {
    left: 0.5rem !important;
  }
}

/* Smooth transitions for orientation changes */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Scrollbar for dropdown */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Close dropdown when clicking outside */
.dropdown-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
}
</style>