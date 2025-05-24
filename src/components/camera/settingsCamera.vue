<template>
  <div v-if="store.cameraInfo.Connected" class="flex flex-wrap items-center gap-2">
    <div
      class="flex flex-row sm:flex-col w-full sm:w-auto items-center min-w-28 border border-gray-500 p-1 rounded-lg"
    >
      <label for="exposure" class="text-sm sm:text-xs mr-3 mb-1 text-gray-200">
        {{ $t('components.camera.exposure_time') }}
      </label>
      <input
        id="exposure"
        v-model.number="settingsStore.camera.exposureTime"
        type="number"
        class="ml-auto bg-gray-200 text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-700"
        placeholder="sek"
      />
    </div>

    <div
      class="flex flex-row sm:flex-col w-full sm:w-auto items-center min-w-28 border border-gray-500 p-1 rounded-lg"
    >
      <label for="gain" class="text-sm sm:text-xs mr-3 mb-1 text-gray-200">
        {{ $t('components.camera.gain_iso') }}
      </label>
      <select
        v-if="store.cameraInfo.Gains && store.cameraInfo.Gains.length > 0"
        id="gain"
        v-model.number="settingsStore.camera.gain"
        class="ml-auto text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-700"
      >
        <option v-for="(value, key) in store.cameraInfo.Gains" :key="key" :value="value">
          {{ value }}
        </option>
      </select>
      <input
        v-else
        id="gain"
        v-model.number="settingsStore.camera.gain"
        type="number"
        class="ml-auto bg-gray-200 text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-700"
        placeholder="1"
      />
    </div>

    <div
      v-if="store.cameraInfo.CanSetOffset"
      class="flex flex-row sm:flex-col w-full sm:w-auto items-center min-w-28 border border-gray-500 p-1 rounded-lg"
    >
      <label for="offset" class="text-sm sm:text-xs mr-3 mb-1 text-gray-200">
        {{ $t('components.camera.offset') }}
      </label>
      <select
        v-if="store.cameraInfo.Offset && store.cameraInfo.Offset.length > 0"
        id="offset"
        v-model.number="settingsStore.camera.offset"
        @change="setOffset"
        class="ml-auto text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-700"
      >
        <option v-for="(value, key) in store.cameraInfo.Offset" :key="key" :value="key">
          {{ value }}
        </option>
      </select>
      <input
        v-else
        id="offset"
        v-model.number="settingsStore.camera.offset"
        type="number"
        @change="setOffset"
        :min="store.cameraInfo.OffsetMin"
        :max="store.cameraInfo.OffsetMax"
        class="ml-auto bg-gray-200 text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-700"
        placeholder="0"
      />
    </div>
    <setBinning v-if="store.cameraInfo.BinningModes.length > 1" />
    <setReadoutMode v-if="store.cameraInfo.ReadoutModes.length > 1" />
    <setSolve />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import apiService from '@/services/apiService';
import setBinning from '@/components/camera/setBinning.vue';
import setReadoutMode from '@/components/camera/setReadoutMode.vue';
import setSolve from '@/components/camera/setSolve.vue';

const store = apiStore();
const settingsStore = useSettingsStore();

onMounted(() => {
  initializeOffset();
});

// Setzt den initialen Offset
const initializeOffset = () => {
  if (!store.cameraInfo) {
    console.warn('Kamera-Info nicht geladen');
    return;
  }

  const offset = store.cameraInfo.Offset ?? 0; // Falls undefined -> Standardwert 1
  settingsStore.camera.offset = offset;
};

async function setOffset() {
  console.log(settingsStore.camera.offset);
  if (store.cameraInfo.OffsetMin > settingsStore.camera.offset) {
    settingsStore.camera.offset = store.cameraInfo.OffsetMin;
    console.log('Offset zu klein min: ', store.cameraInfo.OffsetMin);
  }
  if (store.cameraInfo.OffsetMax < settingsStore.camera.offset) {
    settingsStore.camera.offset = store.cameraInfo.OffsetMax;
    console.log('Offset zu groß, Max: ', store.cameraInfo.OffsetMax);
  }
  try {
    const data = await apiService.profileChangeValue(
      'CameraSettings-Offset',
      settingsStore.camera.offset
    );
    console.log(data);
  } catch (error) {
    console.log('Fehler beim setzten des Offset');
  }
}
</script>
