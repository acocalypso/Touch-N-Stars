<template>
  <button
    :class="buttonClasses"
    class="fixed bg-black bg-opacity-80 p-2 rounded-full text-gray-200 font-mono transition-all duration-200 shadow-md z-10"
    style="bottom: calc(env(safe-area-inset-bottom, 0px) + 48px)"
    @click="toggleDateTimeControls"
  >
    <p class="text-center">{{ formattedTime }}</p>
    <p class="text-xs text-center">{{ formattedDate }}</p>
  </button>
  <!-- Date/Time Control Panel -->
  <div
    v-if="isDateTimeVisible"
    class="fixed inset-0 z-10 flex bg-black bg-opacity-50"
    :class="containerClasses"
    @click.self="isDateTimeVisible = false"
  >
    <div
      :class="[
        modalClasses,
        {
          'p-4': !isLandscape.value,
          'p-3': isLandscape.value,
        },
      ]"
      class="bg-black bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg text-gray-300 border border-gray-600"
    >
      <h3
        :class="{
          'text-lg font-semibold mb-3': !isLandscape.value,
          'text-base font-semibold mb-2': isLandscape.value,
        }"
      >
        {{ $t('components.stellarium.datetime.title') }}
      </h3>

      <!-- Content Grid - responsive layout -->
      <div :class="contentGridClasses">
        <!-- First Row: Date and Speed -->
        <div :class="{ 'space-y-3': !isLandscape.value, 'space-y-2': isLandscape.value }">
          <div>
            <label
              :class="{
                'block text-sm mb-1': !isLandscape.value,
                'block text-xs mb-1': isLandscape.value,
              }"
            >
              {{ $t('components.stellarium.datetime.date') }}
            </label>
            <input
              @blur="applyDateTime"
              @change="applyDateTime"
              type="date"
              v-model="dateValue"
              class="w-full bg-slate-800/40 border border-slate-600/30 rounded px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 backdrop-blur-sm"
            />
          </div>
        </div>

        <div :class="{ 'space-y-3': !isLandscape.value, 'space-y-2': isLandscape.value }">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label
                :class="{
                  'text-sm': !isLandscape.value,
                  'text-xs': isLandscape.value,
                }"
              >
                {{ $t('components.stellarium.datetime.speed') }}
              </label>
              <span
                :class="{
                  'text-sm font-mono': !isLandscape.value,
                  'text-xs font-mono': isLandscape.value,
                }"
              >
                {{ displayTimeSpeed }}
              </span>
            </div>
            <input
              type="range"
              v-model="timeSpeed"
              min="-10"
              max="10"
              step="1"
              class="w-full h-2 bg-slate-800/40 rounded-lg appearance-none cursor-pointer touch-manipulation focus:outline-none focus:ring-2 focus:ring-cyan-500/40 backdrop-blur-sm"
            />
            <div
              :class="{
                'mt-1 text-xs text-gray-300 text-center': !isLandscape.value,
                'mt-0.5 text-xs text-gray-300 text-center': isLandscape.value,
              }"
            >
              {{ timeSpeedDescription }}
            </div>
          </div>
        </div>

        <!-- Second Row: Time and Now Button -->
        <div :class="{ 'space-y-3': !isLandscape.value, 'space-y-2': isLandscape.value }">
          <div>
            <label
              :class="{
                'block text-sm mb-1': !isLandscape.value,
                'block text-xs mb-1': isLandscape.value,
              }"
            >
              {{ $t('components.stellarium.datetime.time') }}
            </label>
            <input
              @blur="applyDateTime"
              @change="applyDateTime"
              type="time"
              v-model="timeValue"
              class="w-full bg-slate-800/40 border border-slate-600/30 rounded px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 backdrop-blur-sm"
            />
          </div>
        </div>

        <div :class="{ 'space-y-3': !isLandscape.value, 'space-y-2': isLandscape.value }">
          <div>
            <label
              :class="{
                'block text-sm mb-1': !isLandscape.value,
                'block text-xs mb-1': isLandscape.value,
              }"
            >
              &nbsp;
            </label>
            <!-- Spacer for alignment -->
            <button
              @click="resetToCurrentTime"
              :class="{
                'w-full px-3 py-2 bg-slate-800/40 border border-slate-600/30 hover:bg-slate-700/60 hover:border-slate-500/50 rounded-lg shadow-md text-sm touch-manipulation transition-all duration-200 backdrop-blur-sm': true,
              }"
            >
              {{ $t('components.stellarium.datetime.now') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import { useStellariumStore } from '@/store/stellariumStore';
import { mjdToUTC, utcToMJD } from '@/utils/utils.js';
import { useOrientation } from '@/composables/useOrientation';

const stellariumStore = useStellariumStore();
const formattedTime = ref('');
const formattedDate = ref('');
const isDateTimeVisible = ref(false);
const dateValue = ref(formatDateForInput(new Date()));
const timeValue = ref(formatTimeForInput(new Date()));
const timeSpeed = ref(1);
let animationFrameId = null;

// Check if in landscape mode
const { isLandscape } = useOrientation();

// Button positioning classes - adjusted for left navigation
const buttonClasses = computed(() => ({
  'left-1/2 transform -translate-x-1/2 px-4 sm:px-8 text-sm sm:text-base': !isLandscape.value,
  'left-1/2 transform -translate-x-1/2 px-3 text-xs ml-24': isLandscape.value, // Added ml-24 to move away from left navigation
}));

// Container positioning classes - adjusted for left navigation
const containerClasses = computed(() => ({
  'items-center justify-center p-4': !isLandscape.value,
  'items-center justify-center pl-32 pr-4': isLandscape.value, // Center the modal better in landscape
}));

// Modal sizing classes
const modalClasses = computed(() => ({
  'w-full max-w-sm sm:max-w-md mx-4': !isLandscape.value,
  'w-[420px] max-w-[90vw]': isLandscape.value, // Optimized width, remove max-height to prevent scrolling
}));

// Content grid layout classes
const contentGridClasses = computed(() => ({
  'space-y-3': !isLandscape.value, // Portrait: single column, vertical spacing
  'grid grid-cols-2': isLandscape.value, // Landscape: two columns
  'gap-3': isLandscape.value && window.innerHeight > 600, // Normal gap for larger screens
  'gap-2': isLandscape.value && window.innerHeight <= 600, // Smaller gap for smaller screens
}));

function updateTime() {
  if (!stellariumStore.stel) return;

  const mjd = stellariumStore.stel.core.observer.utc;
  const date = mjdToDate(mjd);
  formatDateTime(date);

  // Request next animation frame
  animationFrameId = requestAnimationFrame(updateTime);
}

function mjdToDate(mjd) {
  const mjdBaseDate = new Date(Date.UTC(1858, 10, 17, 0, 0, 0));
  const daysToMilliseconds = 86400000;
  return new Date(mjdBaseDate.getTime() + mjd * daysToMilliseconds);
}

function formatDateTime(date) {
  // Time format
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  formattedTime.value = date.toLocaleString(undefined, timeOptions);

  // Date format
  const dateOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  formattedDate.value = date.toLocaleString(undefined, dateOptions);
}

// Format current date as YYYY-MM-DD for input
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format current time as HH:MM for input
function formatTimeForInput(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Toggle date/time control panel
function toggleDateTimeControls() {
  isDateTimeVisible.value = !isDateTimeVisible.value;

  // Update values with current Stellarium time when opening
  if (isDateTimeVisible.value && stellariumStore.stel) {
    updateInputsFromStellariumTime();
  }
}

// Get current time from Stellarium and update inputs
function updateInputsFromStellariumTime() {
  if (!stellariumStore.stel) return;

  const mjd = stellariumStore.stel.core.observer.utc;
  const stelDate = mjdToUTC(mjd);

  dateValue.value = formatDateForInput(stelDate);
  timeValue.value = formatTimeForInput(stelDate);
}

// Apply the selected date and time to Stellarium
function applyDateTime() {
  if (!stellariumStore.stel) return;

  try {
    // Combine date and time inputs
    const [year, month, day] = dateValue.value.split('-').map(Number);
    const [hours, minutes] = timeValue.value.split(':').map(Number);

    // Create Date object (using local timezone)
    const dateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);

    // Convert to MJD
    const mjd = utcToMJD(dateObj);

    // Set Stellarium time
    stellariumStore.stel.core.observer.utc = mjd;

    console.log('Time set to:', dateObj.toString());
    console.log('MJD:', mjd);
  } catch (error) {
    console.error('Error setting date/time:', error);
  }
}

// Reset to current time
function resetToCurrentTime() {
  if (!stellariumStore.stel) return;

  // Get current time
  const now = new Date();
  dateValue.value = formatDateForInput(now);
  timeValue.value = formatTimeForInput(now);

  // Apply to Stellarium
  applyDateTime();
}

// Format time speed for display
const displayTimeSpeed = computed(() => {
  const speed = Math.pow(2, Number(timeSpeed.value));
  if (speed === 1) return '1×';
  return speed > 0 ? `${speed}×` : `1/${Math.abs(1 / speed)}×`;
});

// Description for time speed
const timeSpeedDescription = computed(() => {
  const speed = Math.pow(2, Number(timeSpeed.value));
  if (speed === 0) return 'Paused';
  if (speed === 1) return 'Real-time';
  if (speed > 1) return 'Time lapse';
  return 'Time rewind';
});

// Watch for changes in time speed
watch(timeSpeed, (newValue) => {
  if (!stellariumStore.stel) return;

  const speed = Math.pow(2, Number(newValue));
  stellariumStore.stel.core.time_speed = speed;
  console.log('Time speed set to:', speed);
});

onMounted(() => {
  updateTime();
  timeSpeed.value = 0; // ini
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
/* Scrollbar styling for landscape mode */
@media screen and (orientation: landscape) {
  .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 2px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
  }
}

/* Landscape mode optimizations */
@media screen and (orientation: landscape) {
  /* Make inputs more compact in landscape */
  input[type='date'],
  input[type='time'] {
    padding: 0.375rem 0.75rem !important; /* Reduced padding */
    font-size: 0.75rem !important; /* Smaller font */
  }

  /* Make buttons more compact */
  button {
    padding: 0.375rem 0.75rem !important;
    font-size: 0.75rem !important;
  }

  /* Reduce grid gap further on small screens */
  @media (max-height: 600px) {
    .grid-cols-2 {
      gap: 0.5rem !important;
    }
  }
}

/* Improve range slider for mobile devices */
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type='range']::-webkit-slider-track {
  background: #1e293b;
  height: 8px;
  border-radius: 4px;
  border: 1px solid rgba(71, 85, 105, 0.3);
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background: #06b6d4;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input[type='range']::-moz-range-track {
  background: #1e293b;
  height: 8px;
  border-radius: 4px;
  border: 1px solid rgba(71, 85, 105, 0.3);
}

input[type='range']::-moz-range-thumb {
  background: #06b6d4;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Compact design for landscape */
@media screen and (orientation: landscape) {
  input[type='range']::-webkit-slider-track {
    height: 6px;
  }

  input[type='range']::-webkit-slider-thumb {
    height: 16px;
    width: 16px;
  }

  input[type='range']::-moz-range-track {
    height: 6px;
  }

  input[type='range']::-moz-range-thumb {
    height: 16px;
    width: 16px;
  }
}

/* Ensure proper touch handling */
.touch-manipulation {
  touch-action: manipulation;
}
</style>
