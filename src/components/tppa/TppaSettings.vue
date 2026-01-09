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
    <setSlewRatePins v-if="store.isPINS" />

    <!-- Camera Settings -->
    <div class="border-t border-gray-600 pt-2 mt-2">
      <h4 class="text-gray-200 text-sm mb-1">
        {{ $t('components.tppa.settings.camera_settings') }}
      </h4>
      <p class="text-gray-400 text-xs mb-3">
        {{ $t('components.tppa.settings.camera_settings_hint') }}
      </p>

      <!-- Exposure Time -->
      <div class="mb-2">
        <NumberInputPicker
          v-model="tppaStore.settings.ExposureTime"
          :label="$t('components.tppa.settings.exposure_time')"
          labelKey="components.tppa.settings.exposure_time"
          :min="0"
          :max="999"
          :step="0.1"
          :decimalPlaces="1"
          inputId="tppa-exposure-time"
        />
      </div>

      <!-- Gain -->
      <div>
        <NumberInputPicker
          v-model="tppaStore.settings.Gain"
          :label="$t('components.tppa.settings.gain')"
          labelKey="components.tppa.settings.gain"
          :min="0"
          :max="9999"
          :step="1"
          :decimalPlaces="0"
          :defaultValue="store.profileInfo.CameraSettings.Gain"
          inputId="tppa-gain"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTppaStore } from '@/store/tppaStore';
import { apiStore } from '@/store/store';
import toggleButton from '../helpers/toggleButton.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import setSlewRatePins from '../mount/settings/setSlewRatePins.vue';

const tppaStore = useTppaStore();
const store = apiStore();

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
</script>
