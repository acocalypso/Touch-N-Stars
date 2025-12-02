<template>
  <div class="space-y-6">
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
        v-if="store.profileInfo.TelescopeSettings.TelescopeLocationSyncDirection === 'TOTELESCOPE'"
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
        <option v-for="lang in languages" :key="lang.code" :value="lang.code" class="bg-gray-700">
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
</template>

<script setup>
import { ref, watch, onMounted, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAvailableLanguages } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import {
  latitude,
  longitude,
  altitude,
  gpsError,
  getCurrentLocation,
  useLocationStore,
} from '@/utils/location';
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import setImgStrechFactor from '@/components/settings/setImgStrechFactor.vue';
import setImgQuality from '@/components/settings/setImgQuality.vue';
import setImgBlackClipping from '@/components/settings/setImgBlackClipping.vue';
import setImgDebayern from './setImgDebayern.vue';
import setImgDebayernHfr from './setImgDebayernHfr.vue';
import setImgUnlinkedStrech from './setImgUnlinkedStrech.vue';
import SetInstance from '@/components/settings/setInstance.vue';
import SetDebug from '@/components/settings/setDebug.vue';
import ButtonSetLocationSyncToMount from '@/components/mount/ButtonSetLocationSyncToMount.vue';
import ToggleButton from '@/components/helpers/toggleButton.vue';
import SetBeta from '@/components/settings/setBeta.vue';
import setImgMaxDimension from './setImgMaxDimension.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const { locale, t } = useI18n();
const settingsStore = useSettingsStore();
const store = apiStore();
const locationStore = useLocationStore();

const currentLanguage = ref(settingsStore.getLanguage());
const languages = getAvailableLanguages();
const keepAwakeSupported = ref(false);

// Keep Awake support check
const checkKeepAwakeSupport = async () => {
  try {
    const res = await KeepAwake.isSupported();
    keepAwakeSupported.value = !!res?.isSupported;
  } catch (error) {
    console.error('Error checking keep-awake support:', error);
    keepAwakeSupported.value = false;
  }
};

onMounted(async () => {
  checkKeepAwakeSupport();
  // Load coordinates if backend is reachable
  if (store.isBackendReachable) {
    const storedCoords = settingsStore.coordinates;
    if (storedCoords) {
      latitude.value = storedCoords.latitude;
      longitude.value = storedCoords.longitude;
      altitude.value = storedCoords.altitude || 0;
    }
  }
});

watchEffect(() => {
  currentLanguage.value = locale.value;
});

// Watch language changes
const changeLanguage = (newLanguage) => {
  locale.value = newLanguage;
  settingsStore.setLanguage(newLanguage);
};

const onToggleKeepAwake = async (value) => {
  settingsStore.setKeepAwakeEnabled(value);
  if (keepAwakeSupported.value && ['android', 'ios'].includes(Capacitor.getPlatform())) {
    try {
      if (value) {
        await KeepAwake.enable();
      } else {
        await KeepAwake.disable();
      }
    } catch (error) {
      console.error('Error toggling keep awake:', error);
    }
  }
};

const emit = defineEmits(['show-tutorial', 'restart-system', 'shutdown-system']);

const showTutorial = () => {
  emit('show-tutorial');
};

// System actions
const restartSystem = async () => {
  emit('restart-system');
};

const shutdownSystem = async () => {
  emit('shutdown-system');
};
</script>
