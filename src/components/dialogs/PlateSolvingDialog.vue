<template>
  <div class="space-y-4">
    <!-- Slew and Center Active -->
    <div v-if="slewAndCenterActive" class="space-y-3">
      <!-- Status Header -->
      <div
        v-show="slewAndCenterStatus"
        class="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 w-full p-3 rounded-lg border border-blue-500/30"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">{{ slewAndCenterStatus }}</span>
        </div>
      </div>

      <!-- Current Measurement -->
      <div v-if="currentMeasurement" class="grid grid-cols-3 gap-2">
        <div class="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <p class="text-xs text-gray-400 mb-1">{{ $t('dialogs.plateSolving.time') }}</p>
          <p class="text-white font-semibold">{{ currentMeasurement.Time }}</p>
        </div>
        <div
          class="p-3 rounded-lg border"
          :class="[
            isErrorWithinThreshold
              ? 'bg-green-900/30 border-green-500/50'
              : 'bg-gray-800 border-gray-700',
          ]"
        >
          <p
            class="text-xs mb-2"
            :class="isErrorWithinThreshold ? 'text-green-400' : 'text-gray-400'"
          >
            {{ $t('dialogs.plateSolving.error') }}
          </p>
          <div class="space-y-1" :class="isErrorWithinThreshold ? 'text-green-300' : 'text-white'">
            <p
              v-for="(line, idx) in parseErrorDistance(currentMeasurement.ErrorDistance)"
              :key="idx"
              class="text-xs font-semibold"
            >
              {{ line }}
            </p>
          </div>
        </div>
        <div class="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <p class="text-xs text-gray-400 mb-1">{{ $t('dialogs.plateSolving.rotation') }}</p>
          <p class="text-white font-semibold">{{ Math.round(currentMeasurement.Rotation) }}°</p>
        </div>
      </div>

      <!-- Measurements History -->
      <div v-if="measurements.length > 0" class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-gray-800">
            <tr>
              <th class="px-2 py-2 text-left text-gray-400 border-b border-gray-700">
                {{ $t('dialogs.plateSolving.time') }}
              </th>
              <th class="px-2 py-2 text-left text-gray-400 border-b border-gray-700">
                {{ $t('dialogs.plateSolving.status') }}
              </th>
              <th class="px-2 py-2 text-left text-gray-400 border-b border-gray-700">
                {{ $t('dialogs.plateSolving.error') }}
              </th>
              <th class="px-2 py-2 text-left text-gray-400 border-b border-gray-700">
                {{ $t('dialogs.plateSolving.rotation') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(measurement, idx) in measurements"
              :key="idx"
              class="border-b border-gray-700/50"
            >
              <td class="px-2 py-2 text-gray-300">{{ measurement.Time }}</td>
              <td class="px-2 py-2 flex justify-center">
                <CheckIcon v-if="measurement.Success" class="w-5 h-5 text-green-400" />
                <XMarkIcon v-else class="w-5 h-5 text-red-400" />
              </td>
              <td class="px-2 py-2 text-gray-300">
                {{ extractDistance(measurement.ErrorDistance) }}
              </td>
              <td class="px-2 py-2 text-gray-300">{{ Math.round(measurement.Rotation) }}°</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Fallback: Old Format (Legacy) -->
    <div v-else class="space-y-3">
      <!-- Status Message (nur wenn nicht leer) -->
      <div v-if="plateSolvingStatus" class="bg-gray-800 p-3 rounded-lg border border-gray-700">
        <p class="text-yellow-400 font-medium">{{ plateSolvingStatus }}</p>
      </div>

      <!-- Parameters Grid (nur wenn echte Daten vorhanden) -->
      <div v-if="plateSolvingHasData" class="grid grid-cols-2 gap-2 text-sm">
        <div
          v-for="param in plateSolvingDisplayParams"
          :key="param.key"
          class="bg-gray-800 p-2 rounded"
        >
          <span class="text-gray-400">{{ param.label }}:</span>
          <span class="text-white ml-2">{{ param.value }}</span>
        </div>
      </div>

      <!-- Table -->
      <div v-if="plateSolvingTable.length > 0" class="overflow-x-auto">
        <table class="w-full text-xs border border-gray-700">
          <thead class="bg-gray-800">
            <tr>
              <th
                v-for="header in plateSolvingHeaders"
                :key="header"
                class="px-2 py-1 text-left border-b border-gray-700"
              >
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in plateSolvingTable" :key="idx" class="border-b border-gray-700">
              <td v-for="header in plateSolvingHeaders" :key="header" class="px-2 py-1">
                {{ getTableValue(row, header) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { apiStore } from '@/store/store';

const store = apiStore();

const props = defineProps({
  dialog: {
    type: Object,
    required: true,
  },
  slewAndCenterData: {
    type: Object,
    default: null,
  },
});

// New SlewAndCenter format - Use the prop if available, otherwise check dialog structure
const slewAndCenterData = computed(() => {
  // First priority: Use the prop passed from DialogModal (from global response)
  if (props.slewAndCenterData) {
    return props.slewAndCenterData;
  }

  // Fallback: Check if SlewAndCenter is in dialog.Response or dialog.Content
  let data = props.dialog?.Response?.SlewAndCenter || null;
  if (!data && props.dialog?.Content?.SlewAndCenter) {
    data = props.dialog.Content.SlewAndCenter;
  }

  return data;
});

const slewAndCenterActive = computed(() => {
  return slewAndCenterData.value?.Active || false;
});

const slewAndCenterStatus = computed(() => {
  return slewAndCenterData.value?.Status || '';
});

const currentMeasurement = computed(() => {
  return slewAndCenterData.value?.CurrentMeasurement || null;
});

const measurements = computed(() => {
  return slewAndCenterData.value?.Measurements || [];
});

// Check if current error distance is within threshold
const isErrorWithinThreshold = computed(() => {
  if (!currentMeasurement.value || !store.profileInfo?.PlateSolveSettings) {
    return false;
  }

  let errorDistance = currentMeasurement.value.ErrorDistance;
  const threshold = store.profileInfo.PlateSolveSettings.Threshold;

  // Handle "--" or other non-numeric values
  if (errorDistance === '--' || errorDistance === null || errorDistance === undefined) {
    return false;
  }

  const errorStr = String(errorDistance).trim();
  let numericError = 0;

  // Check if it's a time format (HH:MM:SS or -HH:MM:SS)
  if (errorStr.includes(':')) {
    const isNegative = errorStr.startsWith('-');
    const parts = errorStr.replace(/[^\d:]/g, '').split(':');

    if (parts.length >= 2) {
      // Convert HH:MM:SS to decimal (assuming it's in degrees, minutes, seconds)
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;

      // Convert to decimal degrees: degrees + minutes/60 + seconds/3600
      numericError = hours + minutes / 60 + seconds / 3600;
      if (isNegative) numericError = -numericError;
    }
  } else {
    // Regular numeric format (with or without degree symbol)
    numericError = parseFloat(errorStr.replace(/[^\d.\-]/g, ''));
  }

  const numericThreshold = parseFloat(String(threshold).replace(/[^\d.]/g, ''));

  return (
    !isNaN(numericError) && !isNaN(numericThreshold) && Math.abs(numericError) < numericThreshold
  );
});

// Legacy format support
const plateSolvingStatus = computed(() => {
  return props.dialog?.Content?.StatusMessage || '';
});

const plateSolvingAllParams = computed(() => {
  return props.dialog?.Content?.Parameters || {};
});

const plateSolvingHasData = computed(() => {
  const params = plateSolvingAllParams.value;
  const keys = Object.keys(params);
  return keys.length > 1 || (keys.length === 1 && keys[0] !== 'Status');
});

const plateSolvingDisplayParams = computed(() => {
  const params = plateSolvingAllParams.value;
  const paramKeys = Object.keys(params);

  const indices = [8, 9, 11];

  return indices.map((index) => {
    const key = paramKeys[index];
    return {
      key: key || `param_${index}`,
      label: key || '---',
      value: key ? params[key] : '---',
    };
  });
});

const plateSolvingHeaders = computed(() => {
  const allHeaders = props.dialog?.Content?.TableHeaders || [];
  const headers = [allHeaders[0], allHeaders[3]].filter((h) => h !== undefined);
  return headers;
});

const plateSolvingTable = computed(() => {
  return props.dialog?.Content?.Table || [];
});

function getTableValue(row, header) {
  if (row[header] !== undefined) {
    return row[header];
  }

  const keyWithoutSpaces = header.replace(/\s+/g, '');
  if (row[keyWithoutSpaces] !== undefined) {
    return row[keyWithoutSpaces];
  }

  const withoutParens = header.replace(/\s*\([^)]*\)\s*/g, '').replace(/\s+/g, '');
  if (row[withoutParens] !== undefined) {
    return row[withoutParens];
  }

  const lowerKey = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchingKey = Object.keys(row).find((k) => k.toLowerCase() === lowerKey);
  if (matchingKey && row[matchingKey] !== undefined) {
    return row[matchingKey];
  }

  return '';
}

function parseErrorDistance(errorDistance) {
  if (!errorDistance || typeof errorDistance !== 'string') {
    return [errorDistance];
  }

  // Split by semicolon and trim each part
  return errorDistance
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function extractDistance(errorDistance) {
  if (!errorDistance || typeof errorDistance !== 'string') {
    return errorDistance;
  }

  // Extract "Distance: 74° 24' 55"" from the error distance string
  const match = errorDistance.match(/Distance:\s*([^;]+)/);
  if (match) {
    return match[1].trim();
  }

  return errorDistance;
}
</script>
