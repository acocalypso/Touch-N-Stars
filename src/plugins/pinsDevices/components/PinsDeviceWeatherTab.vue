<template>
  <div class="space-y-4">
    <!-- Error Message -->
    <div v-if="store.error" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <p class="text-red-400 font-medium">{{ store.error }}</p>
    </div>

    <!-- Current Weather Section -->
    <div class="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
      <h3 class="text-lg font-semibold text-white mb-4">
        {{ $t('plugins.pinsDevices.weather.currentWeather') }}
      </h3>

      <div v-if="store.isMeteostationConnected" class="grid grid-cols-2 gap-6">
        <!-- Temperature -->
        <div>
          <span class="text-xs text-gray-500 uppercase">{{
            $t('plugins.pinsDevices.weather.temperature')
          }}</span>
          <span :class="['block text-xl font-semibold mt-1', getTemperatureColor]"
            >{{
              typeof store.meteoStationStatus.Temperature === 'number' &&
              !isNaN(store.meteoStationStatus.Temperature)
                ? store.meteoStationStatus.Temperature.toFixed(1)
                : '--'
            }}°C</span
          >
        </div>

        <!-- Humidity -->
        <div>
          <span class="text-xs text-gray-500 uppercase">{{
            $t('plugins.pinsDevices.weather.humidity')
          }}</span>
          <span :class="['block text-xl font-semibold mt-1', getHumidityColor]"
            >{{
              typeof store.meteoStationStatus.Humidity === 'number' &&
              !isNaN(store.meteoStationStatus.Humidity)
                ? store.meteoStationStatus.Humidity.toFixed(1)
                : '--'
            }}%</span
          >
        </div>

        <!-- Dew Point -->
        <div>
          <span class="text-xs text-gray-500 uppercase">{{
            $t('plugins.pinsDevices.weather.dewPoint')
          }}</span>
          <span :class="['block text-xl font-semibold mt-1', getDewPointColor]"
            >{{
              typeof store.meteoStationStatus.DewPoint === 'number' &&
              !isNaN(store.meteoStationStatus.DewPoint)
                ? store.meteoStationStatus.DewPoint.toFixed(1)
                : '--'
            }}°C</span
          >
        </div>

        <!-- Cloud Cover -->
        <div>
          <span class="text-xs text-gray-500 uppercase">{{
            $t('plugins.pinsDevices.weather.cloudCover')
          }}</span>
          <span :class="['block text-xl font-semibold mt-1', getCloudCoverColor]"
            >{{
              typeof store.meteoStationStatus.CloudCover === 'number' &&
              !isNaN(store.meteoStationStatus.CloudCover)
                ? store.meteoStationStatus.CloudCover.toFixed(0)
                : '--'
            }}%</span
          >
        </div>

        <!-- Sky Quality -->
        <div>
          <span class="text-xs text-gray-500 uppercase">{{
            $t('plugins.pinsDevices.weather.skyQuality')
          }}</span>
          <span :class="['block text-xl font-semibold mt-1', getSkyQualityColor]">{{
            typeof store.meteoStationStatus.SkyQuality === 'number' &&
            !isNaN(store.meteoStationStatus.SkyQuality)
              ? store.meteoStationStatus.SkyQuality.toFixed(2)
              : '--'
          }}</span>
        </div>

        <!-- Sky Brightness -->
        <div>
          <span class="text-xs text-gray-500 uppercase">{{
            $t('plugins.pinsDevices.weather.skyBrightness')
          }}</span>
          <span class="block text-xl font-semibold text-gray-200 mt-1">{{
            typeof store.meteoStationStatus.SkyBrightness === 'number' &&
            !isNaN(store.meteoStationStatus.SkyBrightness)
              ? store.meteoStationStatus.SkyBrightness.toFixed(1) + ' lux'
              : '--'
          }}</span>
        </div>

        <!-- Sky Temperature -->
        <div>
          <span class="text-xs text-gray-500 uppercase">{{
            $t('plugins.pinsDevices.weather.skyTemp')
          }}</span>
          <span :class="['block text-xl font-semibold mt-1', getSkyTemperatureColor]"
            >{{
              typeof store.meteoStationStatus.SkyTemperature === 'number' &&
              !isNaN(store.meteoStationStatus.SkyTemperature)
                ? store.meteoStationStatus.SkyTemperature.toFixed(1)
                : '--'
            }}°C</span
          >
        </div>
      </div>

      <div v-else class="text-gray-400 italic text-sm">
        {{ $t('plugins.pinsDevices.weather.noData') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { usePinsDeviceStore } from '../store/pinsDevicesStore.js';

const store = usePinsDeviceStore();

// Color helper function
const getColorClass = (isRed, isYellow) => {
  if (isRed) return 'text-red-400';
  if (isYellow) return 'text-yellow-400';
  return 'text-gray-200';
};

// Temperature: yellow if < 0°C || > 20°C, red if < -5°C || > 30°C
const getTemperatureColor = computed(() => {
  const temp = store.meteoStationStatus.Temperature;
  if (typeof temp !== 'number' || isNaN(temp)) return 'text-gray-200';
  return getColorClass(temp < -5 || temp > 30, temp < 0 || temp > 20);
});

// Humidity: yellow if > 80%, red if > 90%
const getHumidityColor = computed(() => {
  const hum = store.meteoStationStatus.Humidity;
  if (typeof hum !== 'number' || isNaN(hum)) return 'text-gray-200';
  return getColorClass(hum > 90, hum > 80);
});

// DewPoint: yellow if distance < 6°C, red if distance < 3°C
const getDewPointColor = computed(() => {
  const temp = store.meteoStationStatus.Temperature;
  const dew = store.meteoStationStatus.DewPoint;
  if (typeof temp !== 'number' || typeof dew !== 'number' || isNaN(temp) || isNaN(dew)) {
    return 'text-gray-200';
  }
  const distance = temp - dew;
  return getColorClass(distance < 3, distance < 6);
});

// CloudCover: yellow if > 20%, red if > 40%
const getCloudCoverColor = computed(() => {
  const cloud = store.meteoStationStatus.CloudCover;
  if (typeof cloud !== 'number' || isNaN(cloud)) return 'text-gray-200';
  return getColorClass(cloud > 40, cloud > 20);
});

// SkyQuality: yellow if < 20.0, red if < 19.0
const getSkyQualityColor = computed(() => {
  const quality = store.meteoStationStatus.SkyQuality;
  if (typeof quality !== 'number' || isNaN(quality)) return 'text-gray-200';
  return getColorClass(quality < 19, quality < 20);
});

// SkyTemperature: yellow if > 0°C, red if > 15°C
const getSkyTemperatureColor = computed(() => {
  const skyTemp = store.meteoStationStatus.SkyTemperature;
  if (typeof skyTemp !== 'number' || isNaN(skyTemp)) return 'text-gray-200';
  return getColorClass(skyTemp > 15, skyTemp > 0);
});

onMounted(async () => {
  await store.fetchMeteoStationInfo();
  await store.fetchMeteoStationStatus();
});
</script>
