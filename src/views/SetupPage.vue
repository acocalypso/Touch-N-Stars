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
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Instance Name</label>
              <input
                v-model="instanceName"
                type="text"
                class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
                placeholder="My Instance"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">IP Address / FQDN</label>
              <input
                v-model="instanceIP"
                type="text"
                class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
                placeholder="192.168.x.x"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Port</label>
              <input
                v-model="instancePort"
                type="text"
                class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
                placeholder="5000"
              />
            </div>
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
                class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                <span v-if="checkConnection" class="loader w-10"></span>
                <p>{{ t('common.confirm') }}</p>
              </button>
            </div>
          </div>
        </div>

        <!-- Step 5: GPS Configuration (using Capacitor Geolocation) -->
        <div v-else-if="currentStep === 5" key="gps" class="bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold text-white mb-6">{{ t('setup.gpsConfiguration') }}</h2>
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-400 mb-1">Latitude</label>
                <input
                  v-model="latitude"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
                />
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-400 mb-1">Longitude</label>
                <input
                  v-model="longitude"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
                />
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-400 mb-1">Altitude</label>
                <input
                  v-model="altitude"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md"
                />
              </div>
            </div>
            <button
              v-if="['android', 'ios'].includes(Capacitor.getPlatform())"
              @click="getCurrentLocation"
              class="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-md"
            >
              {{ t('components.settings.coordinates') }}
            </button>
            <div v-if="gpsError" class="text-red-400 text-sm">{{ gpsError }}</div>
          </div>
          <div class="flex justify-between mt-6">
            <button
              @click="previousStep()"
              class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              @click="saveGPS"
              class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg"
            >
              {{ t('common.confirm') }}
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
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAvailableLanguages } from '@/i18n';
import { useRouter } from 'vue-router';
import { useSettingsStore } from '@/store/settingsStore';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { wait } from '@/utils/utils';

const { locale, t } = useI18n();
const router = useRouter();
const settingsStore = useSettingsStore();
const store = apiStore();
const currentStep = ref(1);
const totalSteps = ref(5);
const isVisible = ref(true);
const selectedLanguage = ref(locale.value);
const latitude = ref('');
const longitude = ref('');
const altitude = ref('');
const gpsError = ref(null);
const instanceName = ref('');
const instanceIP = ref('');
const instancePort = ref(5000);
const availableLanguages = getAvailableLanguages();
const checkConnection = ref(false);

function beforeEnter() {
  isVisible.value = false;
}

function afterEnter() {
  isVisible.value = true;
}

async function nextStep() {
  currentStep.value++;
  // Skip instance configuration on web
  if (currentStep.value === 4 && !['android', 'ios'].includes(Capacitor.getPlatform())) {
    currentStep.value++;
  }

  // Fetch GPS info after instance setup on mobile
  if (currentStep.value === 5) {
    store.startFetchingInfo();
    await wait(1000);
    latitude.value = store.profileInfo.AstrometrySettings.Latitude;
    longitude.value = store.profileInfo.AstrometrySettings.Longitude;
    altitude.value = store.profileInfo.AstrometrySettings.Elevation;
  }
}

function previousStep() {
  currentStep.value--;
  // Skip instance configuration when going back on web
  if (currentStep.value === 4 && !['android', 'ios'].includes(Capacitor.getPlatform())) {
    currentStep.value--;
  }
}

function saveLanguage() {
  locale.value = selectedLanguage.value;
  settingsStore.setLanguage(selectedLanguage.value);
  nextStep();
}

async function getCurrentLocation() {
  try {
    // Check for location permission
    const status = await Geolocation.checkPermissions();
    if (status.location !== 'granted') {
      const result = await Geolocation.requestPermissions();
      if (result.location !== 'granted') {
        gpsError.value = 'Location permission not granted';
        return;
      }
    }
    // Get current position with high accuracy
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
    latitude.value = pos.coords.latitude.toFixed(6);
    longitude.value = pos.coords.longitude.toFixed(6);
    altitude.value = pos.coords.altitude;
    gpsError.value = null;
  } catch (error) {
    gpsError.value = error.message || 'Failed to get GPS location';
  }
}

async function saveGPS() {
  const lat = sanitizeCoordinate(latitude.value);
  const lon = sanitizeCoordinate(longitude.value);
  const alt = sanitizeCoordinate(altitude.value);

  latitude.value = lat;
  longitude.value = lon;
  altitude.value = alt;

  settingsStore.setCoordinates({
    latitude: lat,
    longitude: lon,
    altitude: alt,
  });

  console.log('Coordinates saved', lat, lon, alt);

  await saveCoordinates();
  nextStep();
}
async function saveInstance() {
  // Validate instance connection details
  if (!instanceName.value.trim()) {
    alert(t('components.settings.errors.instanceNameRequired'));
    return;
  }

  if (!instanceIP.value) {
    alert(t('components.settings.errors.invalidIPFormat'));
    return;
  }

  // Validate port number
  const port = parseInt(instancePort.value);
  if (isNaN(port) || port < 1 || port > 65535) {
    alert(t('components.settings.errors.invalidPortRange'));
    return;
  }
  settingsStore.addInstance({
    name: instanceName.value,
    ip: instanceIP.value,
    port: instancePort.value,
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
    await wait(1500);
    latitude.value = store.profileInfo.AstrometrySettings.Latitude;
    longitude.value = store.profileInfo.AstrometrySettings.Longitude;
    altitude.value = store.profileInfo.AstrometrySettings.Elevation;
    nextStep();
  } catch (error) {
    console.warn("Incomplete astrometry data");
  } finally {
    checkConnection.value = false;
  }
}

function completeSetup() {
  settingsStore.completeSetup();
  localStorage.setItem('setupCompleted', 'true');
  router.push('/');
}

async function saveCoordinates() {
  if (store.isBackendReachable) {
    try {
      await apiService.profileChangeValue('AstrometrySettings-Latitude', latitude.value);
      await apiService.profileChangeValue('AstrometrySettings-Longitude', longitude.value);
      await apiService.profileChangeValue('AstrometrySettings-Elevation', altitude.value);
      await apiService.profileChangeValue('TelescopeSettings-TelescopeLocationSyncDirection', 2);

      if (store.mountInfo.Connected) {
        await apiService.mountAction('disconnect');
        await apiService.mountAction('connect');
      }
      settingsStore.setCoordinates({
        latitude: latitude.value,
        longitude: longitude.value,
        altitude: altitude.value,
      });
      console.log('Coordinates saved');
    } catch (error) {
      console.error('Failed to update backend coordinates:', error);
    }
  }
}

function sanitizeCoordinate(input) {
  if (typeof input === 'string') {
    const cleaned = input.trim().replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  } else if (typeof input === 'number') {
    return input;
  }
  return null;
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
