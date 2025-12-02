<template>
  <div class="min-h-screen bg-gray-900">
    <SubNav
      v-if="store.isBackendReachable"
      :items="[
        { name: t('components.settings.general'), value: 'general' },
        { name: t('components.settings.plugins.title'), value: 'plugins' },
        { name: t('components.settings.plate_solver.title'), value: 'plateSolver' },
      ]"
      v-model:activeItem="activeTab"
    />

    <div class="p-4 max-w-xl mx-auto space-y-6">
      <!-- General Tab -->
      <SettingsGeneralTab v-if="activeTab === 'general'"
        @show-tutorial="showTutorial"
        @restart-system="restartSystem"
        @shutdown-system="shutdownSystem"
      />

      <!-- Plugins Tab (Legacy wrapper) -->
      <SettingsPluginsTab v-if="activeTab === 'plugins'" />

      <!-- Plate Solver Tab (Legacy wrapper) -->
      <SettingsPlateSolverTab v-if="activeTab === 'plateSolver'" />

      <!-- This section below is kept for future compatibility -->
      <div v-if="false" class="space-y-6">
        <!-- GPS Coordinates -->
        <div
          v-if="store.isBackendReachable"
          class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
        >
          <h3 class="font-bold text-base text-cyan-400">
            {{ $t('components.settings.coordinates') }}
          </h3>
          <div class="grid grid-cols-2 md:flex md:gap-4 md:items-end gap-2">
            <div class="flex flex-col">
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
            <div class="flex flex-col">
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
            <div class="flex flex-col md:flex-1">
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
          <button
            v-if="
              store.profileInfo.TelescopeSettings.TelescopeLocationSyncDirection === 'TOTELESCOPE'
            "
            @click="locationStore.saveCoordinates"
            class="default-button-cyan mt-3"
          >
            {{ $t('components.settings.save') }}
          </button>
          <div v-else>
            <p class="text-red-500 text-sm mt-2">
              {{ $t('components.settings.infoSetLocationSync') }}
            </p>
            <ButtonSetLocationSyncToMount class="mt-3" />
          </div>
        </div>

        <!-- Connection Settings -->
        <div
          class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
          v-if="['android', 'ios'].includes(Capacitor.getPlatform())"
        >
          <h3 class="font-bold text-base text-cyan-400">
            {{ $t('components.settings.connection') }}
          </h3>
          <SetInstance />
        </div>

        <!-- Language Selection -->
        <div
          class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
        >
          <h3 class="font-bold text-base text-cyan-400">
            {{ $t('components.settings.language') }}
          </h3>
          <select
            v-model="currentLanguage"
            @change="changeLanguage($event.target.value)"
            class="default-input w-full py-2"
          >
            <option
              v-for="lang in languages"
              :key="lang.code"
              :value="lang.code"
              class="bg-gray-700"
            >
              {{ lang.name }}
            </option>
          </select>
        </div>

        <!-- Image settings -->
        <div
          v-if="store.isBackendReachable"
          class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
        >
          <h3 class="font-bold text-base text-cyan-400">
            {{ $t('components.settings.image.title') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <setImgQuality />
            <setImgMaxDimension />
            <setImgStrechFactor />
            <setImgBlackClipping />
          </div>
          <div class="flex flex-col mt-4 gap-2">
            <setImgDebayern />
            <setImgDebayernHfr />
            <setImgUnlinkedStrech />
          </div>
        </div>

        <!-- Keep Screen Awake (mobile only) -->
        <div
          class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
          v-if="['android', 'ios'].includes(Capacitor.getPlatform()) && keepAwakeSupported"
        >
          <h3 class="font-bold text-base text-cyan-400">
            {{ $t('components.settings.keepAwake.title') }}
          </h3>
          <div class="flex items-center justify-between">
            <p class="text-gray-300 text-sm mr-4">
              {{ $t('components.settings.keepAwake.description') }}
            </p>
            <ToggleButton
              :statusValue="settingsStore.keepAwakeEnabled"
              @update:statusValue="onToggleKeepAwake"
            />
          </div>
        </div>

        <!-- Touch Input Optimization -->
        <div
          class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
        >
          <h3 class="font-bold text-base text-cyan-400">
            {{ $t('components.settings.input.title') }}
          </h3>
          <div class="flex items-center justify-between">
            <p class="text-gray-300 text-sm mr-4">
              {{ $t('components.settings.input.touchOptimized') }}
            </p>
            <ToggleButton
              :statusValue="settingsStore.touchOptimized"
              @update:statusValue="settingsStore.touchOptimized = $event"
            />
          </div>
        </div>

        <!-- set beta -->
        <div
          class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
          v-if="['android', 'ios'].includes(Capacitor.getPlatform())"
        >
          <h3 class="font-bold text-base text-cyan-400">
            {{ $t('components.settings.beta.title') }}
          </h3>
          <SetBeta />
        </div>

        <!-- Tutorial Button -->
        <div
          class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
        >
          <h3 class="font-bold text-base text-cyan-400">Tutorial</h3>
          <button @click="showTutorial" class="default-button-gray w-full">
            {{ $t('components.settings.showTutorial') }}
          </button>
        </div>

        <!-- Debug settings -->
        <div
          class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
        >
          <h3 class="font-bold text-base text-cyan-400">
            {{ $t('components.settings.debug.title') }}
          </h3>
          <SetDebug />
        </div>

        <!-- System Controls -->
        <div
          class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
        >
          <h3 class="font-bold text-base text-cyan-400">
            {{ $t('components.settings.system.title') }}
          </h3>
          <p class="text-gray-400 text-sm mb-2">
            {{ $t('components.settings.system.description') }}
          </p>
          <p class="text-gray-400 text-sm mb-4">{{ $t('components.settings.system.info') }}</p>

          <div class="flex justify-center gap-3">
            <!-- Restart Button -->
            <button
              @click="restartSystem"
              class="default-button-red gap-2 max-w-40"
              title="Restart System"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
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
              Restart
            </button>

            <!-- Shutdown Button -->
            <button
              @click="shutdownSystem"
              class="default-button-red gap-2 max-w-40"
              title="Shutdown System"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 325.214 325.214"
                fill="currentColor"
              >
                <path
                  d="M288.777,93.565c-15.313-23.641-36.837-42.476-62.243-54.472c-1.616-0.763-3.109-1.134-4.564-1.134
                c-1.969,0-8.392,0.833-8.392,11.541v17.75c0,8.998,5.479,13.113,7.159,14.16c32.613,20.33,52.083,55.317,52.083,93.59
                c0,60.772-49.442,110.214-110.214,110.214S52.393,235.772,52.393,175c0-38.872,19.942-74.144,53.346-94.353
                c4.475-2.707,6.839-7.426,6.839-13.647V49c0-7.959-5.077-10.783-9.424-10.783c-1.714,0-3.542,0.422-5.144,1.188
                C72.781,51.471,51.42,70.305,36.237,93.872C20.638,118.084,12.393,146.137,12.393,175c0,82.828,67.386,150.214,150.214,150.214
                S312.821,257.828,312.821,175C312.821,146.008,304.507,117.848,288.777,93.565z"
                />
                <path
                  d="M152.579,117h21c5.514,0,10-4.486,10-10V10c0-5.514-4.486-10-10-10h-21c-5.514,0-10,4.486-10,10v97
                C142.579,112.514,147.064,117,152.579,117z"
                />
              </svg>
              Shutdown
            </button>
          </div>
        </div>
      </div>

      <!-- Plugins Tab -->
      <div v-if="activeTab === 'plugins'" class="space-y-6">
        <div
          v-if="store.isBackendReachable && true"
          class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
        >
          <h3 class="font-bold text-base text-cyan-400">
            {{ $t('components.settings.plugins.title') }}
          </h3>
          <p class="text-gray-400 text-sm mb-4">
            {{ $t('components.settings.plugins.description') }}
          </p>

          <!-- Empty State -->
          <div v-if="pluginStore.plugins.length === 0" class="text-center py-8">
            <svg
              class="mx-auto h-12 w-12 text-gray-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p class="text-gray-400 text-sm">No plugins available</p>
          </div>

          <!-- Plugin List -->
          <div v-else class="space-y-3">
            <div
              v-for="plugin in pluginStore.plugins"
              :key="plugin.id"
              class="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600"
            >
              <div class="flex-1 min-w-0">
                <h4 class="text-white font-medium">{{ plugin.name }}</h4>
                <p class="text-sm text-gray-400">{{ plugin.description }}</p>
                <p v-if="plugin.author" class="text-xs text-gray-500 mt-1">
                  {{ $t('components.settings.plugins.author') }}: {{ plugin.author }}
                </p>
              </div>
              <div class="flex items-center gap-3 ml-4">
                <span class="text-xs text-gray-500">v{{ plugin.version }}</span>
                <ToggleButton
                  :statusValue="plugin.enabled"
                  @update:statusValue="(value) => togglePlugin(plugin.id, value)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Plate Solver Tab -->
      <div v-if="activeTab === 'plateSolver'" class="space-y-6">
        <PlateSolverSettingsPanel v-if="store.isBackendReachable" />
      </div>
    </div>
  </div>

  <!-- Tutorial Modal -->
  <TutorialModal v-if="showTutorialModal" :steps="tutorialSteps" @close="closeTutorial" />

  <!-- Confirmation Modal -->
  <div
    v-if="confirmAction"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
  >
    <div class="bg-gray-800 rounded-lg p-6 max-w-sm w-full border border-gray-700">
      <h3 class="text-lg font-semibold text-white mb-4">
        {{ $t('components.settings.system.confirmation') }}
      </h3>
      <p class="text-gray-300 mb-6">
        {{
          confirmAction === 'shutdown'
            ? $t('components.settings.system.confirmShutdown')
            : $t('components.settings.system.confirmRestart')
        }}
      </p>
      <div class="flex justify-end gap-3">
        <button @click="cancelConfirmation" class="default-button-gray">
          {{ $t('common.cancel') }}
        </button>
        <button @click="confirmActionHandler" class="default-button-cyan">
          {{ $t('common.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect, watch, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAvailableLanguages } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import TutorialModal from '@/components/TutorialModal.vue';
import SubNav from '@/components/SubNav.vue';
import SettingsGeneralTab from '@/components/settings/SettingsGeneralTab.vue';
import SettingsPluginsTab from '@/components/settings/SettingsPluginsTab.vue';
import SettingsPlateSolverTab from '@/components/settings/SettingsPlateSolverTab.vue';
import {
  latitude,
  longitude,
  altitude,
  gpsError,
  getCurrentLocation,
  useLocationStore,
} from '@/utils/location';
import { useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import setImgStrechFactor from '@/components/settings/setImgStrechFactor.vue';
import setImgQuality from '@/components/settings/setImgQuality.vue';
import setImgBlackClipping from '@/components/settings/setImgBlackClipping.vue';
import setImgDebayern from './settings/setImgDebayern.vue';
import setImgDebayernHfr from './settings/setImgDebayernHfr.vue';
import setImgUnlinkedStrech from './settings/setImgUnlinkedStrech.vue';
import SetInstance from '@/components/settings/setInstance.vue';
import { usePluginStore } from '@/store/pluginStore';
import SetDebug from '@/components/settings/setDebug.vue';
import ButtonSetLocationSyncToMount from './mount/ButtonSetLocationSyncToMount.vue';
import ToggleButton from '@/components/helpers/toggleButton.vue';
import PlateSolverSettingsPanel from '@/components/settings/PlateSolverSettingsPanel.vue';
import SetBeta from '@/components/settings/setBeta.vue';
import setImgMaxDimension from './settings/setImgMaxDimension.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const router = useRouter();
const { locale, t } = useI18n();
const settingsStore = useSettingsStore();
const store = apiStore();
const pluginStore = usePluginStore();

const currentLanguage = ref(settingsStore.getLanguage());
const locationStore = useLocationStore();
const activeTab = ref('general');

// Tutorial
const showTutorialModal = ref(false);
const tutorialSteps = computed(() => settingsStore.tutorial.steps);

const languages = getAvailableLanguages();
const keepAwakeSupported = ref(false);

// Load stored settings on mount
onMounted(async () => {
  // Set initial language from store
  locale.value = settingsStore.getLanguage();
  if (store.isBackendReachable) {
    const storedCoords = settingsStore.coordinates;
    if (storedCoords) {
      latitude.value = storedCoords.latitude;
      longitude.value = storedCoords.longitude;
      altitude.value = storedCoords.altitude || 0;
    }
  }

  // Debug plugin loading
  console.log('Settings mounted - plugins:', pluginStore.plugins);
  console.log('Settings mounted - isInitialized:', pluginStore.isInitialized);

  // Ensure plugins are loaded (force reload to catch metadata changes)
  await pluginStore.loadAndRegisterPlugins(true);
  console.log('After manual load - plugins:', pluginStore.plugins);

  // Check keep-awake support
  try {
    const res = await KeepAwake.isSupported();
    keepAwakeSupported.value = !!res?.isSupported;
  } catch (e) {
    keepAwakeSupported.value = false;
  }
});

watchEffect(() => {
  currentLanguage.value = locale.value;
});

// Load coordinates when backend is reachable
watch(
  () => store.isBackendReachable,

  async (newValue) => {
    if (newValue) {
      try {
        await store.fetchProfilInfos();
        await locationStore.loadFromAstrometrySettings();
        settingsStore.setCoordinates({
          latitude: latitude.value,
          longitude: longitude.value,
          altitude: altitude.value,
        });
      } catch (error) {
        console.log('Error loading coordinates');
      }
    }
  }
);

function changeLanguage(lang) {
  locale.value = lang;
  settingsStore.setLanguage(lang);
}

function showTutorial() {
  showTutorialModal.value = true;
  settingsStore.resetTutorial();
}

function closeTutorial() {
  showTutorialModal.value = false;
  settingsStore.completeTutorial();
}

// Confirmation modal logic
const confirmAction = ref(null);

function cancelConfirmation() {
  confirmAction.value = null;
}

function performRestart() {
  router.push('/');
  store.showSettings = false;
  store.isBackendReachable = false;
  apiService.restart();
}

function performShutdown() {
  router.push('/');
  store.showSettings = false;
  store.isBackendReachable = false;
  apiService.shutdown();
}

function confirmActionHandler() {
  if (confirmAction.value === 'restart') {
    performRestart();
  } else if (confirmAction.value === 'shutdown') {
    performShutdown();
  }
  confirmAction.value = null;
}

function restartSystem() {
  confirmAction.value = 'restart';
}

function shutdownSystem() {
  confirmAction.value = 'shutdown';
}

async function togglePlugin(pluginId, enabled) {
  // Use the enhanced togglePlugin method which handles initialization
  await pluginStore.togglePlugin(pluginId, enabled);
}

async function applyKeepAwake(enabled) {
  try {
    if (enabled) {
      await KeepAwake.keepAwake();
    } else {
      await KeepAwake.allowSleep();
    }
  } catch (e) {
    console.warn('KeepAwake error', e);
  }
}

async function onToggleKeepAwake(value) {
  settingsStore.setKeepAwakeEnabled(value);
  if (keepAwakeSupported.value) {
    await applyKeepAwake(value);
  }
}

watch(
  () => settingsStore.keepAwakeEnabled,
  async (val, oldVal) => {
    if (val !== oldVal && keepAwakeSupported.value) {
      await applyKeepAwake(val);
    }
  }
);
</script>
