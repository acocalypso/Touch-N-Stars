<template>
  <!-- GPS Coordinates (PINS-only) -->
  <div
    v-if="store.isBackendReachable"
    class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
  >
    <h3 class="font-bold text-base text-cyan-400">
      {{ $t('components.settings.coordinates') }}
    </h3>

    <!-- Current stored coordinates (read-only) -->
    <div class="grid grid-cols-2 gap-2">
      <div class="bg-gray-700/60 rounded-md p-2">
        <div class="flex items-center justify-between mb-1">
          <p class="text-xs font-medium text-gray-400">{{ $t('setup.currentNinaCoords') }}</p>
          <button
            @click="locationStore.loadFromAstrometrySettings()"
            class="text-gray-500 hover:text-cyan-400 transition-colors"
            :title="$t('common.refresh')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
        <p class="text-xs text-gray-300">
          {{ $t('setup.coordLat') }}: {{ formatCoord(ninaCoords.latitude, 'lat') ?? '—' }}
        </p>
        <p class="text-xs text-gray-300">
          {{ $t('setup.coordLon') }}: {{ formatCoord(ninaCoords.longitude, 'lon') ?? '—' }}
        </p>
        <p class="text-xs text-gray-300">
          {{ $t('setup.coordAlt') }}: {{ ninaCoords.elevation ?? '—' }}
          {{ $t('setup.coordUnit') }}
        </p>
      </div>
      <div class="bg-gray-700/60 rounded-md p-2">
        <div class="flex items-center justify-between mb-1">
          <p class="text-xs font-medium text-gray-400">{{ $t('setup.currentMountCoords') }}</p>
          <button
            @click="locationStore.loadMountCoords()"
            class="text-gray-500 hover:text-cyan-400 transition-colors"
            :class="{ 'animate-spin': mountCoordsLoading }"
            :title="$t('common.refresh')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
        <template v-if="mountCoordsLoading">
          <p class="text-xs text-gray-500">{{ $t('setup.loadingCoords') }}</p>
        </template>
        <template v-else-if="!mountCoords.connected">
          <p class="text-xs text-gray-500">{{ $t('setup.mountNotConnected') }}</p>
        </template>
        <template v-else-if="!mountCoords.siteLocationSupported">
          <p class="text-xs text-amber-400">{{ $t('setup.coordsNotSupported') }}</p>
        </template>
        <template v-else>
          <p class="text-xs text-gray-300">
            {{ $t('setup.coordLat') }}: {{ formatCoord(mountCoords.latitude, 'lat') ?? '—' }}
          </p>
          <p class="text-xs text-gray-300">
            {{ $t('setup.coordLon') }}: {{ formatCoord(mountCoords.longitude, 'lon') ?? '—' }}
          </p>
          <p class="text-xs text-gray-300">
            {{ $t('setup.coordAlt') }}: {{ mountCoords.elevation }} {{ $t('setup.coordUnit') }}
          </p>
        </template>
      </div>
    </div>

    <!-- Mismatch warning -->
    <div
      v-if="coordsMismatch"
      class="flex items-start gap-2 rounded-md bg-amber-900/40 border border-amber-600/50 p-2 text-xs text-amber-300"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 mt-0.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      <span>{{ $t('components.settings.coordsMismatchWarning') }}</span>
    </div>

    <!-- Editable inputs -->
    <div class="grid grid-cols-2 md:flex md:gap-4 md:items-end gap-2">
      <div class="flex flex-col min-w-0 md:flex-1">
        <label class="text-xs md:text-sm text-gray-300 mb-1">Latitude</label>
        <NumberInputPicker
          v-model="latitude"
          :label="``"
          :labelKey="'latitude'"
          :min="-90"
          :max="90"
          :step="0.001"
          :decimalPlaces="3"
          placeholder="Latitude"
          inputId="latitude"
          wrapperClass="w-full"
        />
      </div>
      <div class="flex flex-col min-w-0 md:flex-1">
        <label class="text-xs md:text-sm text-gray-300 mb-1">Longitude</label>
        <NumberInputPicker
          v-model="longitude"
          :label="``"
          :labelKey="'longitude'"
          :min="-180"
          :max="180"
          :step="0.001"
          :decimalPlaces="3"
          placeholder="Longitude"
          inputId="longitude"
          wrapperClass="w-full"
        />
      </div>
      <div class="flex flex-col min-w-0 md:flex-1">
        <label class="text-xs md:text-sm text-gray-300 mb-1">Altitude</label>
        <NumberInputPicker
          v-model="altitude"
          :label="``"
          :labelKey="'altitude'"
          :min="-500"
          :max="9000"
          :step="1"
          :decimalPlaces="0"
          placeholder="Altitude"
          inputId="altitude"
          wrapperClass="w-full"
        />
      </div>
      <button
        @click="getCurrentLocation"
        class="default-button-gray md:w-10 md:h-10 md:flex-shrink-0 col-span-2 md:col-span-1 md:self-end"
        title="Get current location"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
    <div v-if="gpsError" class="mt-2 text-sm text-red-400">
      {{ gpsError }}
    </div>

    <!-- Sync direction dropdown -->
    <div class="flex flex-col gap-1">
      <label class="text-xs md:text-sm text-gray-300">{{ $t('setup.syncDirection') }}</label>
      <select
        v-model="syncDirection"
        class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500"
      >
        <option value="NOSYNC">{{ $t('setup.syncDirectionNosync') }}</option>
        <option value="TOAPPLICATION">{{ $t('setup.syncDirectionToApplication') }}</option>
        <option value="TOTELESCOPE">{{ $t('setup.syncDirectionToTelescope') }}</option>
      </select>
    </div>

    <button @click="saveLocation" class="default-button-cyan mt-1">
      {{ $t('components.settings.save') }}
    </button>
  </div>

  <!-- Time Sync (PINS-only) -->
  <div
    v-if="store.isBackendReachable"
    class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
  >
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.settings.timeSync.title') }}
      </h3>
      <button
        @click="loadTimeInfo"
        class="text-gray-400 hover:text-gray-200"
        :title="$t('common.refresh')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          :class="['h-4 w-4', { 'animate-spin': timeSyncLoading }]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
    <div class="grid grid-cols-2 gap-2 text-xs">
      <div class="bg-gray-900/60 rounded p-2">
        <div class="text-gray-400 mb-1">{{ $t('components.settings.timeSync.backendTime') }}</div>
        <div class="text-gray-100 font-mono">
          {{ timeInfo.backendUtc ? new Date(timeInfo.backendUtc).toUTCString() : '—' }}
        </div>
      </div>
      <div class="bg-gray-900/60 rounded p-2">
        <div class="text-gray-400 mb-1">{{ $t('components.settings.timeSync.mountTime') }}</div>
        <div v-if="!timeInfo.mountConnected" class="text-gray-500 italic">
          {{ $t('components.settings.timeSync.mountNotConnected') }}
        </div>
        <div v-else-if="timeInfo.mountUtc" class="text-gray-100 font-mono">
          {{ new Date(timeInfo.mountUtc).toUTCString() }}
        </div>
        <div v-else class="text-gray-500 italic">
          {{ $t('components.settings.timeSync.notSupported') }}
        </div>
      </div>
    </div>
    <div class="flex items-center justify-between">
      <p class="text-gray-300 text-sm mr-4">{{ $t('components.settings.timeSync.syncLabel') }}</p>
      <ToggleButton :statusValue="timeInfo.timeSyncEnabled" @update:statusValue="toggleTimeSync" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import {
  latitude,
  longitude,
  altitude,
  gpsError,
  getCurrentLocation,
  useLocationStore,
  syncDirection,
  ninaCoords,
  mountCoords,
  mountCoordsLoading,
  formatCoord,
} from '@/utils/location';
import ToggleButton from '@/components/helpers/toggleButton.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import apiService from '@/services/apiService';

const store = apiStore();
const locationStore = useLocationStore();

const COORD_TOLERANCE = 0.001; // ~100 m
const coordsMismatch = computed(() => {
  if (
    !mountCoords.value.connected ||
    !mountCoords.value.siteLocationSupported ||
    mountCoordsLoading.value
  )
    return false;
  const latDiff = Math.abs((ninaCoords.value.latitude ?? 0) - (mountCoords.value.latitude ?? 0));
  const lonDiff = Math.abs((ninaCoords.value.longitude ?? 0) - (mountCoords.value.longitude ?? 0));
  return latDiff > COORD_TOLERANCE || lonDiff > COORD_TOLERANCE;
});

const timeSyncLoading = ref(false);
const timeInfo = ref({
  backendUtc: null,
  mountUtc: null,
  timeSyncEnabled: false,
  mountConnected: false,
});

const loadTimeInfo = async () => {
  if (!store.isBackendReachable) return;
  timeSyncLoading.value = true;
  try {
    const data = await apiService.getTnsTime();
    if (data) timeInfo.value = data;
  } catch (e) {
    console.error('Failed to load time info:', e);
  } finally {
    timeSyncLoading.value = false;
  }
};

const toggleTimeSync = async (value) => {
  try {
    await apiService.profileChangeValue('TelescopeSettings-TimeSync', value);
    await loadTimeInfo();
  } catch (e) {
    console.error('Failed to toggle time sync:', e);
  }
};

async function saveLocation() {
  await locationStore.saveCoordinates();
  await locationStore.loadFromAstrometrySettings();
  locationStore.loadMountCoords(); // fire-and-forget
}

onMounted(async () => {
  if (store.isBackendReachable) {
    await locationStore.loadFromAstrometrySettings();
    locationStore.loadMountCoords(); // fire-and-forget
    const storedCoords = store.profileInfo.AstrometrySettings;
    if (storedCoords) {
      latitude.value = storedCoords.Latitude;
      longitude.value = storedCoords.Longitude;
      altitude.value = storedCoords.Elevation || 0;
    }
    loadTimeInfo();
  }
});
</script>
