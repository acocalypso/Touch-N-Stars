<template>
  <div class="flex flex-col gap-1 border border-gray-500 p-2 rounded-lg">
    <div class="flex flex-row items-center justify-between w-full">
      <label for="toggle_Pos" class="text-gray-300">
        {{ $t('components.tppa.settings.StartFromCurrentPosition') }}
      </label>
      <div>
        <toggleButton
          @click="togglePosition"
          :status-value="tppaStore.settings.StartFromCurrentPosition"
          class="pr-5 pl-5 justify-center"
        />
      </div>
    </div>
    <div
      v-show="tppaStore.settings.StartFromCurrentPosition"
      class="flex flex-row items-center justify-between w-full"
    >
      <label for="toggle_Pos" class="text-gray-300">
        {{ $t('components.tppa.settings.DirectionEast') }}
      </label>
      <div>
        <toggleButton
          @click="toggleDirection"
          :status-value="tppaStore.settings.EastDirection"
          class="pr-5 pl-5 justify-center"
        />
      </div>
    </div>
    <div
      v-if="store.checkVersionNewerOrEqual(store.currentApiVersion, '2.2.10.0')"
      class="flex flex-row items-center justify-between w-full"
    >
      <label for="toggle_Pos" class="text-gray-300">
        {{ $t('components.tppa.settings.ManualMode') }}
      </label>
      <div>
        <toggleButton
          @click="toggleManualMode"
          :status-value="tppaStore.settings.ManualMode"
          class="pr-5 pl-5 justify-center"
        />
      </div>
    </div>

    <!-- Camera Settings -->
    <div class="border-t border-gray-600 pt-2 mt-2">
      <h4 class="text-gray-200 text-sm mb-1">
        {{ $t('components.tppa.settings.camera_settings') }}
      </h4>
      <p class="text-gray-400 text-xs mb-3">
        {{ $t('components.tppa.settings.camera_settings_hint') }}
      </p>

      <!-- Exposure Time -->
      <div class="flex flex-row items-center justify-between w-full mb-2">
        <label class="text-gray-300">{{ $t('components.tppa.settings.exposure_time') }}:</label>
        <input
          :value="tppaStore.settings.ExposureTime || ''"
          @input="updateExposureTime"
          type="number"
          min="0"
          step="0.1"
          :placeholder="$t('components.tppa.settings.nina_default')"
          class="bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 w-24 placeholder-gray-500"
        />
      </div>

      <!-- Gain -->
      <div class="flex flex-row items-center justify-between w-full">
        <label class="text-gray-300">{{ $t('components.tppa.settings.gain') }}:</label>
        <input
          :value="tppaStore.settings.Gain || ''"
          @input="updateGain"
          type="number"
          min="0"
          :placeholder="$t('components.tppa.settings.nina_default')"
          class="bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 w-24 placeholder-gray-500"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTppaStore } from '@/store/tppaStore';
import toggleButton from '../helpers/toggleButton.vue';

const tppaStore = useTppaStore();

function togglePosition() {
  if (tppaStore.settings.StartFromCurrentPosition) {
    tppaStore.settings.StartFromCurrentPosition = false;
    console.log('StartCurrentPosition off');
  } else {
    tppaStore.settings.StartFromCurrentPosition = true;
    console.log('StartCurrentPosition on');
  }
}

function toggleDirection() {
  if (tppaStore.settings.EastDirection) {
    tppaStore.settings.EastDirection = false;
    console.log('EastDirection off');
  } else {
    tppaStore.settings.EastDirection = true;
    console.log('EastDirection on');
  }
}

function toggleManualMode() {
  if (tppaStore.settings.ManualMode) {
    tppaStore.settings.ManualMode = false;
    console.log('ManualMode off');
  } else {
    tppaStore.settings.ManualMode = true;
    console.log('ManualMode on');
  }
}

function updateExposureTime(event) {
  const value = event.target.value;
  tppaStore.settings.ExposureTime = value === '' ? null : parseFloat(value);
}

function updateGain(event) {
  const value = event.target.value;
  tppaStore.settings.Gain = value === '' ? null : parseInt(value);
}
</script>
