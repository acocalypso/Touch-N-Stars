<template>
  <div class="flex flex-col items-center gap-2">
    <div v-if="store.cameraInfo.CanSetTemperature" class="w-full">
      <div class="flex flex-col border border-slate-600/40 p-3 rounded-lg min-w-36">
        <!-- Cooler Status Indicator - ganz oben -->
        <div
          class="flex items-center justify-center gap-2 px-3 py-2 mb-3 rounded-lg"
          :class="{
            'bg-slate-700/40': coolerStatus === 'off',
            'bg-blue-600/20 border border-blue-500/40': coolerStatus === 'cooling',
            'bg-green-600/20 border border-green-500/40': coolerStatus === 'holding',
            'bg-orange-600/20 border border-orange-500/40': coolerStatus === 'warming',
          }"
        >
          <span class="text-xs text-gray-300 font-medium">
            {{ $t('components.camera.cooler_status') }}:
          </span>
          <span
            class="text-xs font-semibold"
            :class="{
              'text-gray-400': coolerStatus === 'off',
              'text-blue-400': coolerStatus === 'cooling',
              'text-green-400': coolerStatus === 'holding',
              'text-orange-400': coolerStatus === 'warming',
            }"
          >
            {{ coolerStatusText }}
          </span>
        </div>

        <div class="border-t border-slate-600/40 mb-3"></div>

        <div
          class="flex items-center justify-between mb-2 border border-gray-500 p-1 md:p-2 rounded-lg"
        >
          <label for="Cooler" class="text-xs md:text-sm text-gray-200 font-medium">
            {{ $t('components.camera.camera_cooling') }}
          </label>
          <toggleButton
            @click="toggleCooling"
            :status-value="cameraStore.buttonCoolerOn"
            class="h-7 md:h-8"
          />
        </div>
        <div class="flex flex-col justify-between sm:flex-row gap-2">
          <NumberInputPicker
            class=" border border-gray-500 p-1 md:p-2 rounded-lg"
            v-model="cameraStore.coolingTemp"
            :label="$t('components.camera.target_temperature')"
            labelKey="components.camera.target_temperature"
            :min="-50"
            :max="30"
            :step="1"
            :decimalPlaces="0"
            placeholder="-10"
            inputId="TemperatureSetPoint"
            wrapperClass="sm:flex-1 col-span-2"
            @change="setCoolingTemp"
          />

          <NumberInputPicker
            class=" border border-gray-500 p-1 md:p-2 rounded-lg"
            v-model="cameraStore.coolingTime"
            :label="$t('components.camera.cooling_time')"
            labelKey="components.camera.cooling_time"
            :min="1"
            :max="300"
            :step="1"
            :decimalPlaces="0"
            placeholder="1"
            inputId="CoolingDurationTime"
            wrapperClass="sm:flex-1 col-span-2"
            @change="setCoolingTime"
          />
        </div>
        <div class="border-t border-slate-600/40 my-4"></div>

        <div
          class="flex items-center justify-between mb-2 border border-gray-500 p-1 md:p-2 rounded-lg"
        >
          <label for="Cooler" class="text-xs md:text-sm text-gray-200 font-medium">
            {{ $t('components.camera.camera_warming') }}
          </label>
          <toggleButton
            @click="toggleWarming"
            :status-value="cameraStore.buttonWarmingOn"
            class="h-7 md:h-8"
          />
        </div>
        <div class="flex flex-col justify-between sm:flex-row gap-2">
          <NumberInputPicker
            class=" border border-gray-500 p-1 md:p-2 rounded-lg"
            v-model="cameraStore.warmingTime"
            :label="$t('components.camera.warm_up_time')"
            labelKey="components.camera.warm_up_time"
            :min="1"
            :max="300"
            :step="1"
            :decimalPlaces="0"
            inputId="WarmingDurationTime"
            wrapperClass="w-full sm:w-1/2"
            @change="setWarmingTime"
          />
        </div>
      </div>
    </div>
    <div v-if="store.cameraInfo.HasDewHeater">
      <div
        class="flex flex-col min-w-36 border border-slate-600/40 p-3 pb-3 rounded-lg bg-slate-800/40 backdrop-blur-sm"
      >
        <label for="DewHeater" class="text-xs mb-2 text-gray-200 font-medium"
          >{{ $t('components.camera.dew_heater') }}
        </label>
        <div class="flex space-x-2 justify-center">
          <toggleButton @click="toggleDewHeater" :status-value="store.cameraInfo.DewHeaterOn" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';
import { useCameraStore } from '@/store/cameraStore';
import apiService from '@/services/apiService';
import toggleButton from '@/components/helpers/toggleButton.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const store = apiStore();
const cameraStore = useCameraStore();
const { t } = useI18n();

// Timeout-Mechanismus für AtTargetTemp
let atTargetTempTimeout = null;
const isStableAtTarget = ref(false);


const coolerStatus = computed(() => {
  // Zuerst prüfen, ob Cooler überhaupt an ist
  if (!store.cameraInfo.CoolerOn) {
    return 'off';
  }

  // Dann Button-Zustände prüfen (Benutzerabsicht während aktiven Prozessen)
  if (cameraStore.buttonWarmingOn) {
    return 'warming';
  }
  if (cameraStore.buttonCoolerOn) {
    return 'cooling';
  }

  // Nur stabiles AtTargetTemp berücksichtigen (mit Timeout validiert)
  if (isStableAtTarget.value) {
    return 'holding';
  }

  // Aktuelle Temperatur vs Zieltemperatur prüfen
  const currentTemp = Math.round(store.cameraInfo.Temperature);
  const targetTemp = Math.round(store.cameraInfo.TemperatureSetPoint);

  if (targetTemp < currentTemp) {
    return 'cooling';
  }
  if (targetTemp > currentTemp) {
    return 'warming';
  }

  // Wenn Temperaturen gleich sind, aber noch nicht stabil
  return 'holding';
});

const coolerStatusText = computed(() => {
  const currentTemp = Math.round(store.cameraInfo.Temperature);
  const targetTemp = Math.round(store.cameraInfo.TemperatureSetPoint);

  switch (coolerStatus.value) {
    case 'off':
      return t('components.camera.cooler_status_off');
    case 'cooling':
      return `${t('components.camera.cooler_status_cooling')} ${targetTemp}°C`;
    case 'holding':
      return `${t('components.camera.cooler_status_holding')} (${currentTemp}°C)`;
    case 'warming':
      return `${t('components.camera.cooler_status_warming')} ${targetTemp}°C`;
    default:
      return t('components.camera.cooler_status_off');
  }
});

async function setCoolingTime() {
  try {
    if (cameraStore.coolingTime <= 1) {
      cameraStore.coolingTime = 1;
    }
    const response = await apiService.profileChangeValue(
      'CameraSettings-CoolingDuration',
      cameraStore.coolingTime
    );
    console.log(response);
  } catch (error) {
    console.log('Error:', error);
  }
}

async function setWarmingTime() {
  try {
    if (cameraStore.warmingTime <= 1) {
      cameraStore.warmingTime = 1;
    }
    const response = await apiService.profileChangeValue(
      'CameraSettings-WarmingDuration',
      cameraStore.warmingTime
    );
    console.log(response);
  } catch (error) {
    console.log('Error:', error);
  }
}

async function setCoolingTemp() {
  try {
    const response = await apiService.profileChangeValue(
      'CameraSettings-Temperature',
      cameraStore.coolingTemp
    );
    console.log('setCoolingTemp', response);
  } catch (error) {
    console.log('Error:', error);
  }
}

function toggleCooling() {
  console.log('Toggle Cooling', cameraStore.buttonCoolerOn);
  if (!cameraStore.buttonCoolerOn) {
    startCooling();
    console.log('Start Cooling');
  } else {
    stopCooling();
    console.log('stop Cooling');
  }
}

async function startCooling() {
  try {
    const response = await apiService.stopCameraWarming();
    console.log('Response warming stop:', response);
    cameraStore.buttonWarmingOn = false;
    if (
      Math.round(store.profileInfo.CameraSettings.Temperature) ===
      Math.round(store.cameraInfo.Temperature)
    ) {
      cameraStore.buttonCoolerOn = false;
      console.log('At target temp');
      return;
    }
    const response2 = await apiService.startCameraCooling(
      cameraStore.coolingTemp,
      cameraStore.coolingTime
    );
    cameraStore.buttonCoolerOn = true;
    console.log('Response cooling start:', response2);
  } catch (error) {
    console.log('Error:', error);
  }
}
async function stopCooling() {
  try {
    const response = await apiService.stopCameraCooling();
    cameraStore.buttonCoolerOn = false;
    console.log('Response cooling stop:', response);
  } catch (error) {
    console.log('Error:', error);
  }
}

function toggleWarming() {
  if (!cameraStore.buttonWarmingOn) {
    startWarming();
    console.log('Start warming');
  } else {
    stopWarming();
    console.log('stop warming');
  }
}

async function startWarming() {
  try {
    const response = await apiService.stopCameraCooling();
    console.log('Response cooling stop:', response);
    cameraStore.buttonCoolerOn = false;
    const response2 = await apiService.startCameraWarming(cameraStore.warmingTime);
    cameraStore.buttonWarmingOn = true;
    console.log('Response warming start:', response2);
  } catch (error) {
    console.log('Error:', error);
  }
}
async function stopWarming() {
  try {
    const response = await apiService.stopCameraWarming();
    cameraStore.buttonWarmingOn = false;
    console.log('Response warming stop:', response);
  } catch (error) {
    console.log('Error:', error);
  }
}

function toggleDewHeater() {
  if (store.cameraInfo.DewHeaterOn) {
    try {
      const data = apiService.startStoppDewheater(false);
      console.log(data);
    } catch (error) {
      console.log('Error:', error);
    }
  } else {
    try {
      const data = apiService.startStoppDewheater(true);
      console.log(data);
    } catch (error) {
      console.log('Error:', error);
    }
  }
}

function checkButtonStatus() {
  if (!store.cameraInfo.CoolerOn) {
    cameraStore.buttonCoolerOn = false;
    cameraStore.buttonWarmingOn = false;
    console.log('Cooler is off');
    return;
  }
  // Nur stabiles AtTargetTemp berücksichtigen
  if (isStableAtTarget.value) {
    cameraStore.buttonCoolerOn = false;
    cameraStore.buttonWarmingOn = false;
    console.log('At target temp (stable)');
    return;
  }
  if (
    Math.round(store.profileInfo.CameraSettings.Temperature) ===
    Math.round(store.cameraInfo.Temperature)
  ) {
    cameraStore.buttonCoolerOn = false;
    console.log('At target temp');
    return;
  }
  if (Math.round(store.cameraInfo.TemperatureSetPoint) < Math.round(store.cameraInfo.Temperature)) {
    cameraStore.buttonCoolerOn = true;
    cameraStore.buttonWarmingOn = false;
    console.log('Cooling active');
    return;
  }
  if (Math.round(store.cameraInfo.TemperatureSetPoint) > Math.round(store.cameraInfo.Temperature)) {
    cameraStore.buttonCoolerOn = false;
    cameraStore.buttonWarmingOn = true;
    console.log('Warming active');
    return;
  }
}

watch(
  () => store.cameraInfo.CoolerOn,
  () => {
    checkButtonStatus();
  },
  { immediate: true }
);

watch(
  () => store.cameraInfo.AtTargetTemp,
  (newValue) => {
    // Timeout zurücksetzen bei jeder Änderung
    if (atTargetTempTimeout) {
      clearTimeout(atTargetTempTimeout);
      atTargetTempTimeout = null;
    }

    if (newValue) {
      // Warte 15 Sekunden, bevor AtTargetTemp als stabil gilt
      atTargetTempTimeout = setTimeout(() => {
        isStableAtTarget.value = true;
        checkButtonStatus();
      }, 15000);
    } else {
      // Sofort zurücksetzen, wenn AtTargetTemp false wird
      isStableAtTarget.value = false;
      checkButtonStatus();
    }
  },
  { immediate: true }
);

watch(
  () => store.cameraInfo.TemperatureSetPoint,
  () => {
    checkButtonStatus();
  }
);

watch(
  () => store.cameraInfo.Temperature,
  () => {
    checkButtonStatus();
  }
);

onMounted(() => {
  cameraStore.coolingTemp = store.profileInfo.CameraSettings.Temperature;

  if (store.profileInfo.CameraSettings.CoolingDuration <= 0) {
    cameraStore.coolingTime = 10;
  } else {
    cameraStore.coolingTime = store.profileInfo.CameraSettings.CoolingDuration;
  }

  if (store.profileInfo.CameraSettings.WarmingDuration <= 0) {
    cameraStore.warmingTime = 10;
  } else {
    cameraStore.warmingTime = store.profileInfo.CameraSettings.WarmingDuration;
  }
});
</script>
