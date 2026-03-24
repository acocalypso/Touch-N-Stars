<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md mx-4">
      <!-- Progress Indicator -->
      <div class="mb-8">
        <div class="flex justify-center space-x-2">
          <div
            v-for="step in totalSteps"
            :key="step"
            class="h-2 w-2 rounded-full transition-all duration-300"
            :class="{
              'bg-cyan-500 scale-125': currentStep === step,
              'bg-gray-600': currentStep !== step,
            }"
          ></div>
        </div>
      </div>
      <!-- Setup Steps -->
      <transition
        name="slide-fade"
        mode="out-in"
        @before-enter="beforeEnter"
        @after-enter="afterEnter"
      >
        <!-- Step 1: Welcome -->
        <div
          v-if="currentStep === 1"
          key="welcome"
          class="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg transform transition-all duration-500"
          :class="{
            'scale-95 opacity-0': !isVisible,
            'scale-100 opacity-100': isVisible,
          }"
        >
          <h1 class="text-3xl font-bold text-white mb-4">{{ t('setup.welcome') }}</h1>
          <p class="text-gray-300 mb-6">{{ t('setup.description') }}</p>
          <button
            @click="nextStep()"
            class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
          >
            {{ t('common.confirm') }}
          </button>
        </div>

        <!-- Step 2: Language Selection -->
        <div
          v-else-if="currentStep === 2"
          key="language"
          class="bg-gray-800 p-8 rounded-lg shadow-lg"
        >
          <h2 class="text-2xl font-bold text-white mb-6">{{ t('setup.selectLanguage') }}</h2>
          <select
            v-model="selectedLanguage"
            class="w-full px-4 py-3 bg-gray-700 text-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            <option
              v-for="lang in availableLanguages"
              :key="lang.code"
              :value="lang.code"
              class="bg-gray-800"
            >
              {{ lang.name }}
            </option>
          </select>
          <div class="flex justify-between">
            <button
              @click="previousStep()"
              class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              @click="saveLanguage"
              class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg"
            >
              {{ t('common.confirm') }}
            </button>
          </div>
        </div>

        <!-- Step 3: Infos -->
        <div
          v-else-if="currentStep === 3"
          key="infoApps"
          class="bg-gray-800 p-8 rounded-lg shadow-lg"
        >
          <h2 class="text-2xl font-bold text-white mb-6">
            {{ t('setup.InfoAppsTitel') }}
          </h2>
          <div class="space-y-4">
            <p class="text-1xl text-white mb-2">{{ t('setup.check_wki') }}</p>
            <a
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:text-blue-800 underline"
              href="https://github.com/Touch-N-Stars/Touch-N-Stars/wiki/Touch'N'Stars-Wiki"
              >{{ t('setup.InfoAppsTitel') }}</a
            >
            <div class="flex justify-between mt-6">
              <button
                @click="previousStep()"
                class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                @click="nextStep()"
                class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                <p>{{ t('common.confirm') }}</p>
              </button>
            </div>
          </div>
        </div>

        <!-- Step 4: Instance Configuration (Mobile only) -->
        <div
          v-else-if="currentStep === 4"
          key="instance"
          class="bg-gray-800 p-8 rounded-lg shadow-lg"
        >
          <h2 class="text-2xl font-bold text-white mb-6">
            {{ t('setup.instanceConfiguration') }}
          </h2>

          <!-- Instance Detection Component -->
          <InstanceDetection v-model="instanceData" />

          <div class="flex justify-between mt-6">
            <button
              @click="previousStep()"
              class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              @click="saveInstance"
              :disabled="checkConnection"
              class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span v-if="checkConnection" class="loader"></span>
              <span v-if="!checkConnection">{{ t('common.confirm') }}</span>
            </button>
          </div>
        </div>

        <!-- Step 5: GPS Configuration (using Capacitor Geolocation) -->
        <div v-else-if="currentStep === 5" key="gps" class="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold text-white mb-4">{{ t('setup.gpsConfiguration') }}</h2>

          <!-- Current stored coordinates (read-only, PINS only) -->
          <div v-if="store.isPINS" class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-gray-700 rounded-md p-3">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-medium text-gray-400">{{ t('setup.currentNinaCoords') }}</p>
                <button
                  @click="locationStore.loadFromAstrometrySettings()"
                  class="text-gray-500 hover:text-cyan-400 transition-colors"
                  :title="t('common.refresh')"
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
                {{ t('setup.coordLat') }}: {{ formatCoord(ninaCoords.latitude, 'lat') ?? '—' }}
              </p>
              <p class="text-xs text-gray-300">
                {{ t('setup.coordLon') }}: {{ formatCoord(ninaCoords.longitude, 'lon') ?? '—' }}
              </p>
              <p class="text-xs text-gray-300">
                {{ t('setup.coordAlt') }}: {{ ninaCoords.elevation ?? '—' }}
                {{ t('setup.coordUnit') }}
              </p>
            </div>
            <div class="bg-gray-700 rounded-md p-3">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-medium text-gray-400">{{ t('setup.currentMountCoords') }}</p>
                <button
                  @click="locationStore.loadMountCoords()"
                  class="text-gray-500 hover:text-cyan-400 transition-colors"
                  :class="{ 'animate-spin': mountCoordsLoading }"
                  :title="t('common.refresh')"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3.5 w-3.5"
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
                <p class="text-xs text-gray-500">{{ t('setup.loadingCoords') }}</p>
              </template>
              <template v-else-if="!mountCoords.connected">
                <p class="text-xs text-gray-500">{{ t('setup.mountNotConnected') }}</p>
              </template>
              <template v-else-if="!mountCoords.siteLocationSupported">
                <p class="text-xs text-amber-400">{{ t('setup.coordsNotSupported') }}</p>
              </template>
              <template v-else>
                <p class="text-xs text-gray-300">
                  {{ t('setup.coordLat') }}: {{ formatCoord(mountCoords.latitude, 'lat') ?? '—' }}
                </p>
                <p class="text-xs text-gray-300">
                  {{ t('setup.coordLon') }}: {{ formatCoord(mountCoords.longitude, 'lon') ?? '—' }}
                </p>
                <p class="text-xs text-gray-300">
                  {{ t('setup.coordAlt') }}: {{ mountCoords.elevation }} {{ t('setup.coordUnit') }}
                </p>
              </template>
            </div>
          </div>

          <!-- Editable inputs for new coordinates -->
          <div class="space-y-3 mb-4">
            <div class="flex items-center gap-2">
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-400 mb-1">Latitude</label>
                <input
                  v-model="latitude"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
                />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-400 mb-1">Longitude</label>
                <input
                  v-model="longitude"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
                />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-400 mb-1"
                  >{{ t('setup.coordAlt') }} ({{ t('setup.coordUnit') }})</label
                >
                <input
                  v-model="altitude"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
                />
              </div>
            </div>
            <button
              @click="getCurrentLocation"
              class="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-md text-sm"
            >
              {{ t('components.settings.coordinates') }}
            </button>
            <div v-if="gpsError" class="text-red-400 text-sm">{{ gpsError }}</div>
          </div>

          <!-- Sync direction dropdown (PINS) / sync warning (non-PINS) -->
          <template v-if="store.isPINS">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-400 mb-1">{{
                t('setup.syncDirection')
              }}</label>
              <select
                v-model="syncDirection"
                class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
              >
                <option value="NOSYNC">{{ t('setup.syncDirectionNosync') }}</option>
                <option value="TOAPPLICATION">{{ t('setup.syncDirectionToApplication') }}</option>
                <option value="TOTELESCOPE">{{ t('setup.syncDirectionToTelescope') }}</option>
              </select>
            </div>
          </template>
          <template v-else>
            <div
              v-if="
                store?.profileInfo?.TelescopeSettings?.TelescopeLocationSyncDirection !==
                'TOTELESCOPE'
              "
            >
              <p class="text-red-500 text-sm mt-2">
                {{ $t('components.settings.infoSetLocationSync') }}
              </p>
              <ButtonSetLocationSyncToMount class="mt-1" />
            </div>
          </template>

          <div class="flex justify-between mt-6">
            <button
              @click="previousStep()"
              class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              @click="saveGPS"
              :disabled="loadingGPSData"
              class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span v-if="loadingGPSData" class="loader"></span>
              <span v-if="!loadingGPSData">{{ t('common.confirm') }}</span>
            </button>
          </div>
        </div>

        <!-- Final Step: Complete Setup -->
        <div v-else key="complete" class="bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold text-white mb-6">{{ t('setup.completeSetup') }}</h2>
          <button
            @click="completeSetup"
            class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg"
          >
            {{ t('common.confirm') }}
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAvailableLanguages } from '@/i18n';
import { useRouter } from 'vue-router';
import { useSettingsStore } from '@/store/settingsStore';
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
import { Capacitor } from '@capacitor/core';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { wait } from '@/utils/utils';
import InstanceDetection from '@/components/setup/InstanceDetection.vue';
import ButtonSetLocationSyncToMount from '@/components/mount/ButtonSetLocationSyncToMount.vue';

const { locale, t } = useI18n();
const router = useRouter();
const settingsStore = useSettingsStore();
const store = apiStore();
const MIN_SETUP_STEP = 1;
const MAX_SETUP_STEP = 6;
const SETUP_STEP_STORAGE_KEY = 'setupCurrentStep';

function getInitialSetupStep() {
  const savedStep = localStorage.getItem(SETUP_STEP_STORAGE_KEY);
  if (!savedStep) {
    return MIN_SETUP_STEP;
  }

  const parsedStep = Number.parseInt(savedStep, 10);
  if (!Number.isFinite(parsedStep)) {
    return MIN_SETUP_STEP;
  }

  return Math.min(Math.max(parsedStep, MIN_SETUP_STEP), MAX_SETUP_STEP);
}

function persistCurrentStep(step) {
  localStorage.setItem(SETUP_STEP_STORAGE_KEY, step.toString());
}

function getInitialInstanceData() {
  const selectedInstance = settingsStore.selectedInstanceId
    ? settingsStore.getInstance(settingsStore.selectedInstanceId)
    : null;

  if (selectedInstance?.ip && selectedInstance?.port) {
    return {
      name: selectedInstance.name || '',
      ip: selectedInstance.ip,
      port: selectedInstance.port,
    };
  }

  return {
    name: '',
    ip: settingsStore.connection.ip || '',
    port: settingsStore.connection.port || 5000,
  };
}

const currentStep = ref(getInitialSetupStep());
const totalSteps = ref(5);
const isVisible = ref(true);
const selectedLanguage = ref(locale.value);
const locationStore = useLocationStore();
const instanceData = ref(getInitialInstanceData());
const availableLanguages = getAvailableLanguages();
const checkConnection = ref(false);
const stepInitialized = ref(currentStep.value === 5); // Tracks if step 5 logic has run
const loadingGPSData = ref(false); // Tracks if GPS data is being loaded

// Schritt bei jeder Änderung speichern
watch(currentStep, (newStep) => {
  persistCurrentStep(newStep);
});

function beforeEnter() {
  isVisible.value = false;
}

function afterEnter() {
  isVisible.value = true;
}

async function nextStep() {
  currentStep.value++;
  persistCurrentStep(currentStep.value);

  // Skip instance configuration on web
  if (currentStep.value === 4 && !['android', 'ios'].includes(Capacitor.getPlatform())) {
    currentStep.value++;
    persistCurrentStep(currentStep.value);
  }

  // Fetch GPS info after instance setup on mobile
  // Only run this initialization logic once per step 5 visit
  if (currentStep.value === 5 && !stepInitialized.value) {
    stepInitialized.value = true;
    loadingGPSData.value = true;
    try {
      store.startFetchingInfo();
      store.setupCheckConnectionDone = true;
      await wait(2500);
      if (!store.isBackendReachable) {
        console.log('Backend not reachable');
        stepInitialized.value = false; // Reset flag if we go back
        previousStep();
        return;
      }
      await locationStore.loadFromAstrometrySettings();
      if (store.isPINS) {
        locationStore.loadMountCoords(); // fire-and-forget; mountCoordsLoading tracks state
      }
    } finally {
      loadingGPSData.value = false;
    }
  }
}

function previousStep() {
  // Reset step 5 initialization flag when leaving step 5
  if (currentStep.value === 5) {
    stepInitialized.value = false;
  }

  currentStep.value--;
  persistCurrentStep(currentStep.value);
  // Skip instance configuration when going back on web
  if (currentStep.value === 4 && !['android', 'ios'].includes(Capacitor.getPlatform())) {
    currentStep.value--;
    persistCurrentStep(currentStep.value);
  }
}

function saveLanguage() {
  locale.value = selectedLanguage.value;
  settingsStore.setLanguage(selectedLanguage.value);
  nextStep();
}

async function saveGPS() {
  loadingGPSData.value = true;
  try {
    await locationStore.saveCoordinates();
    await locationStore.loadFromAstrometrySettings();
    if (store.isPINS) {
      locationStore.loadMountCoords(); // fire-and-forget
    }
    nextStep();
  } catch (error) {
    console.error('Failed to save GPS data:', error);
  } finally {
    loadingGPSData.value = false;
  }
}

async function saveInstance() {
  // Validate instance connection details
  if (!instanceData.value.name.trim()) {
    alert(t('components.settings.errors.instanceNameRequired'));
    return;
  }

  if (!instanceData.value.ip) {
    alert(t('components.settings.errors.invalidIPFormat'));
    return;
  }

  // Validate port number
  const port = parseInt(instanceData.value.port);
  if (isNaN(port) || port < 1 || port > 65535) {
    alert(t('components.settings.errors.invalidPortRange'));
    return;
  }
  settingsStore.addInstance({
    name: instanceData.value.name,
    ip: instanceData.value.ip,
    port: instanceData.value.port,
  });
  checkConnection.value = true;
  try {
    await wait(500);
    let response = await apiService.fetchTnsPluginVersion();
    console.log('Backend reachable?', response);
    if (!response) {
      console.log('second connection attempt');
      await wait(1000);
      response = await apiService.fetchTnsPluginVersion();
      if (!response) {
        alert(t('components.settings.errors.invalidInstance'));
        return;
      }
    }
    console.log('Backend reachable');
    store.startFetchingInfo();
    await wait(2500);
    await locationStore.loadFromAstrometrySettings();
    locationStore.loadMountCoords(); // fire-and-forget
    nextStep();
  } catch (error) {
    console.warn('Incomplete astrometry data');
  } finally {
    checkConnection.value = false;
  }
}

function completeSetup() {
  settingsStore.completeSetup();
  localStorage.setItem('setupCompleted', 'true');
  // Setup-Schritt aus localStorage entfernen
  localStorage.removeItem(SETUP_STEP_STORAGE_KEY);
  router.push('/');
}
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.5s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

@media (max-width: 640px) {
  .slide-fade-enter-from {
    transform: translateX(15px);
  }
  .slide-fade-leave-to {
    transform: translateX(-15px);
  }
}

.loader {
  border: 3px solid rgba(255, 255, 255, 0.2); /* heller Hintergrund */
  border-top: 3px solid #22d3ee; /* cyan-500 */
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
