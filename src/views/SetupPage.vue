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
              @click="getCurrentLocation"
              class="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-md"
            >
              {{ t('components.settings.coordinates') }}
            </button>
            <div v-if="gpsError" class="text-red-400 text-sm">{{ gpsError }}</div>
          </div>
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
import { ref, onMounted, watch } from 'vue';
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
const currentStep = ref(1);
const totalSteps = ref(5);
const isVisible = ref(true);
const selectedLanguage = ref(locale.value);
const locationStore = useLocationStore();
const instanceData = ref({
  name: '',
  ip: '',
  port: 5000,
});
const availableLanguages = getAvailableLanguages();
const checkConnection = ref(false);
const stepInitialized = ref(false); // Tracks if step 5 logic has run

// Setup-Schritt im localStorage speichern, damit er nach Berechtigungsabfragen wiederhergestellt werden kann
onMounted(() => {
  const savedStep = localStorage.getItem('setupCurrentStep');
  if (savedStep) {
    const step = parseInt(savedStep);
    currentStep.value = step;
    // If we're resuming at step 5, mark it as already initialized
    if (step === 5) {
      stepInitialized.value = true;
    }
  }
});

// Schritt bei jeder Änderung speichern
watch(currentStep, (newStep) => {
  localStorage.setItem('setupCurrentStep', newStep.toString());
});

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
  // Only run this initialization logic once per step 5 visit
  if (currentStep.value === 5 && !stepInitialized.value) {
    stepInitialized.value = true;
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
  }
}

function previousStep() {
  // Reset step 5 initialization flag when leaving step 5
  if (currentStep.value === 5) {
    stepInitialized.value = false;
  }

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

async function saveGPS() {
  await locationStore.saveCoordinates();
  nextStep();
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
  localStorage.removeItem('setupCurrentStep');
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
