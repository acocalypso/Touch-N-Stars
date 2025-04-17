<template>
  <div class="absolute top-3 left-3">
    <button
      @click="toggleDateTimeControls"
      class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
      :class="{ 'bg-cyan-600': isDateTimeVisible }"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 6V12L16 14" stroke="white" stroke-width="2" stroke-linecap="round" />
        <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none" />
      </svg>
    </button>

    <!-- Date/Time Control Panel -->
    <div
      v-if="isDateTimeVisible"
      class="absolute top-12 left-0 bg-black bg-opacity-80 p-4 rounded-lg shadow-lg text-white w-72"
    >
      <h3 class="text-lg font-semibold mb-3">{{ $t('components.stellarium.datetime.title') }}</h3>

      <div class="mb-3">
        <label class="block text-sm mb-1">{{ $t('components.stellarium.datetime.date') }}</label>
        <input
          @blur="applyDateTime"
          @change="applyDateTime"
          type="date"
          v-model="dateValue"
          class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        />
      </div>

      <div class="mb-4">
        <label class="block text-sm mb-1">{{ $t('components.stellarium.datetime.time') }}</label>
        <input
          @blur="applyDateTime"
          @change="applyDateTime"
          type="time"
          v-model="timeValue"
          class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        />
      </div>

      <div class="flex gap-3">
        <button
          @click="resetToCurrentTime"
          class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-md"
        >
          {{ $t('components.stellarium.datetime.now') }}
        </button>
      </div>

      <div class="mt-4">
        <label class="block text-sm mb-1">{{ $t('components.stellarium.datetime.speed') }}</label>
        <div class="flex items-center gap-3">
          <input type="range" v-model="timeSpeed" min="-10" max="10" step="1" class="flex-1" />
          <span class="text-sm font-mono w-12 text-right">{{ displayTimeSpeed }}</span>
        </div>
        <div class="mt-1 text-xs text-gray-300 text-center">
          {{ timeSpeedDescription }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useStellariumStore } from '@/store/stellariumStore';

const stellariumStore = useStellariumStore();
const isDateTimeVisible = ref(false);
const dateValue = ref(formatDateForInput(new Date()));
const timeValue = ref(formatTimeForInput(new Date()));
const timeSpeed = ref(1);

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

// Convert MJD to Date object
function mjdToUTC(mjd) {
  // MJD 0 = November 17, 1858, 00:00:00 UTC
  const mjdBaseDate = new Date(Date.UTC(1858, 10, 17, 0, 0, 0));
  const daysToMilliseconds = 86400000; // milliseconds in a day
  return new Date(mjdBaseDate.getTime() + mjd * daysToMilliseconds);
}

// Convert Date to MJD
function utcToMJD(utcDate) {
  const mjdBaseDate = new Date(Date.UTC(1858, 10, 17, 0, 0, 0));
  const daysToMilliseconds = 86400000;
  return (utcDate.getTime() - mjdBaseDate.getTime()) / daysToMilliseconds;
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
  timeSpeed.value = 0; // ini
});
</script>
