<template>
  <div class="flex flex-col items-center gap-2">
    <div v-if="store.cameraInfo.CanSetTemperature" class="w-full">
      <div class="flex flex-col border border-slate-600/40 p-3 pb-3 rounded-lg min-w-36">
        <div class="flex items-center justify-between mb-2">
          <label for="Cooler" class="text-gray-200 font-medium">
            {{ $t('components.camera.camera_cooling') }}
          </label>
          <toggleButton @click="toggleCooling" :status-value="cameraStore.buttonCoolerOn" />
        </div>
        <div class="flex flex-col justify-between sm:flex-row gap-2">
          <div
            class="flex sm:flex-1 justify-between flex-row items-center sm:flex-col sm:w-auto col-span-2 w-full border border-gray-500 p-2 rounded-lg"
          >
            <label for="TemperatureSetPoint" class="text-sm sm:text-xs mr-3 sm:mb-1 text-gray-200"
              >{{ $t('components.camera.target_temperature') }}:
            </label>
            <input
              id="TemperatureSetPoint"
              v-model="cameraStore.coolingTemp"
              type="number"
              class="default-input ml-auto sm:ml-0 h-8 w-20 sm:w-full"
              placeholder="1"
              step="1"
              @change="setCoolingTemp"
              @blur="setCoolingTemp"
            />
          </div>

          <div
            class="flex sm:flex-1 justify-between flex-row items-center sm:flex-col sm:w-auto col-span-2 w-full border border-gray-500 p-2 rounded-lg"
          >
            <label for="CoolingDurationTime" class="text-sm sm:text-xs mr-3 sm:mb-1 text-gray-200"
              >{{ $t('components.camera.cooling_time') }}
            </label>
            <input
              id="CoolingDurationTime"
              v-model="cameraStore.coolingTime"
              type="number"
              class="default-input ml-auto sm:ml-0 h-8 w-20 sm:w-full"
              placeholder="1"
              step="1"
              @change="setCoolingTime"
              @blur="setCoolingTime"
            />
          </div>
          <div
            class="flex sm:flex-1 justify-between flex-row items-center sm:flex-col sm:w-auto col-span-2 w-full border border-gray-500 p-2 rounded-lg"
          >
            <label for="WarmingDurationTime" class="text-sm sm:text-xs mr-3 sm:mb-1 text-gray-200"
              >{{ $t('components.camera.warm_up_time') }}
            </label>
            <input
              id="WarmingDurationTime"
              v-model="cameraStore.warmingTime"
              type="number"
              class="default-input ml-auto sm:ml-0 h-8 w-20 sm:w-full"
              step="1"
              @change="setWarmingTime"
              @blur="setWarmingTime"
            />
          </div>
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
import { watch, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import { useCameraStore } from '@/store/cameraStore';
import apiService from '@/services/apiService';
import toggleButton from '@/components/helpers/toggleButton.vue';

const store = apiStore();
const cameraStore = useCameraStore();

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
    console.log(response);
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
      console.log('Fehler:', error);
    }
  } else {
    try {
      const data = apiService.startStoppDewheater(true);
      console.log(data);
    } catch (error) {
      console.log('Fehler:', error);
    }
  }
}

function toggleCooling() {
  if (store.cameraInfo.CoolerOn) {
    stoppCooling();
    console.log('stopp');
  } else {
    startCooling();
    console.log('start');
  }
}

async function startCooling() {
  try {
    const dataWarm = await apiService.startStoppWarming(true);
    Promise.all([dataWarm]);
    console.log('Antwort warming:', dataWarm);
    cameraStore.buttonCoolerOn = true;
    const dataCool = apiService.startCooling(cameraStore.coolingTemp, cameraStore.coolingTime);
    console.log('Antwort cooling:', dataCool);
    console.log('SollTemp:', cameraStore.coolingTemp);
  } catch (error) {
    console.log('Fehler:', error);
  }
}
async function stoppCooling() {
  try {
    const dataCool = await apiService.stoppCooling();
    Promise.all([dataCool]);
    cameraStore.buttonCoolerOn = false;
    console.log('Antwort cooling:', dataCool);
    const dataWarm = apiService.startStoppWarming(false, cameraStore.warmingTime);
    console.log('Antwort warming:', dataWarm);
  } catch (error) {
    console.log('Fehler:', error);
  }
}

watch(
  () => store.cameraInfo.CoolerOn,
  (newValue) => {
    cameraStore.buttonCoolerOn = newValue;
  },
  { immediate: true }
);

onMounted(() => {
  cameraStore.buttonCoolerOn = store.cameraInfo.CoolerOn;
  cameraStore.coolingTemp = store.profileInfo.CameraSettings.Temperature;
  cameraStore.coolingTime = store.profileInfo.CameraSettings.CoolingDuration;
  cameraStore.warmingTime = store.profileInfo.CameraSettings.WarmingDuration;
});
</script>
