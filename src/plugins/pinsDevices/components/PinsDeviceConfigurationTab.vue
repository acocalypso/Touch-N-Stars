<template>
  <div class="space-y-4">
    <!-- Error Message -->
    <div v-if="store.error" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <p class="text-red-400 font-medium">{{ store.error }}</p>
    </div>

    <!-- Configuration Sub-Tabs -->
    <div class="border border-gray-700 rounded-lg bg-gray-800/50">
      <!-- Sub-Tab Buttons -->
      <div class="flex border-b border-gray-700">
        <button
          :disabled="!store.isPowerboxConnected"
          class="px-4 py-2 text-sm font-semibold transition-all"
          :class="{
            'text-white border-b-2 border-cyan-400': activeSubTab === 'powerbox',
            'text-gray-400 hover:text-white':
              activeSubTab !== 'powerbox' && store.isPowerboxConnected,
            'text-gray-600 cursor-not-allowed': !store.isPowerboxConnected,
          }"
          @click="store.isPowerboxConnected && setActiveSubTab('powerbox')"
        >
          PowerBox
        </button>
        <button
          :disabled="!store.isMeteostationConnected"
          class="px-4 py-2 text-sm font-semibold transition-all"
          :class="{
            'text-white border-b-2 border-cyan-400': activeSubTab === 'meteostation',
            'text-gray-400 hover:text-white':
              activeSubTab !== 'meteostation' && store.isMeteostationConnected,
            'text-gray-600 cursor-not-allowed': !store.isMeteostationConnected,
          }"
          @click="store.isMeteostationConnected && setActiveSubTab('meteostation')"
        >
          MeteoStation
        </button>
        <button
          :disabled="!store.isPowerboxConnected || !store.powerboxStatus.HasWifi"
          class="px-4 py-2 text-sm font-semibold transition-all"
          :class="{
            'text-white border-b-2 border-cyan-400': activeSubTab === 'wifi',
            'text-gray-400 hover:text-white':
              activeSubTab !== 'wifi' && store.isPowerboxConnected && store.powerboxStatus.HasWifi,
            'text-gray-600 cursor-not-allowed':
              !store.isPowerboxConnected || !store.powerboxStatus.HasWifi,
          }"
          @click="
            store.isPowerboxConnected && store.powerboxStatus.HasWifi && setActiveSubTab('wifi')
          "
        >
          WiFi
        </button>
      </div>

      <!-- Sub-Tab Content -->
      <div class="p-4">
        <!-- PowerBox Configuration -->
        <div v-show="activeSubTab === 'powerbox'" class="space-y-6">
          <!-- Temperature Offset -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-300">
              {{ $t('plugins.pinsDevices.config.temperatureOffset') }}
            </label>
            <div class="flex items-center gap-2">
              <button
                @click="openTemperatureOffsetPicker()"
                class="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
              >
                {{ temperatureOffset.toFixed(2) }}°C
              </button>
            </div>
            <p class="text-xs text-gray-500">
              {{ $t('plugins.pinsDevices.config.temperatureOffsetDesc') }}
            </p>
          </div>

          <!-- Humidity Offset -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-300">
              {{ $t('plugins.pinsDevices.config.humidityOffset') }}
            </label>
            <div class="flex items-center gap-2">
              <button
                @click="openHumidityOffsetPicker()"
                class="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
              >
                {{ humidityOffset.toFixed(2) }}%
              </button>
            </div>
            <p class="text-xs text-gray-500">
              {{ $t('plugins.pinsDevices.config.humidityOffsetDesc') }}
            </p>
          </div>

          <!-- Environment Update Rate -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-300">
              {{ $t('plugins.pinsDevices.config.envUpdateRate') }}
            </label>
            <div class="flex items-center gap-2">
              <button
                @click="openEnvUpdateRatePicker()"
                class="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
              >
                {{ envUpdateRate }}s
              </button>
            </div>
            <p class="text-xs text-gray-500">
              {{ $t('plugins.pinsDevices.config.envUpdateRateDesc') }}
            </p>
          </div>

          <!-- Update Rate -->
          <div class="space-y-3 pb-6 border-b border-gray-700">
            <label class="block text-sm font-medium text-gray-300">
              {{ $t('plugins.pinsDevices.config.updateRate') }}
            </label>
            <div class="flex items-center gap-2">
              <button
                @click="openUpdateRatePicker()"
                class="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
              >
                {{ updateRate }}s
              </button>
            </div>
            <p class="text-xs text-gray-500">
              {{ $t('plugins.pinsDevices.config.updateRateDesc') }}
            </p>
          </div>

          <!-- Factory Reset Section -->
          <div class="border border-red-700/50 rounded-lg p-4 bg-red-900/10">
            <h3 class="text-lg font-semibold text-red-400 mb-4">
              {{ $t('plugins.pinsDevices.config.factoryReset') }}
            </h3>

            <p class="text-sm text-gray-300 mb-4">
              {{ $t('plugins.pinsDevices.config.factoryResetDesc') }}
            </p>

            <button
              @click="confirmFactoryReset"
              class="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all"
            >
              {{ $t('plugins.pinsDevices.config.factoryReset') }}
            </button>
          </div>
        </div>

        <!-- MeteoStation Configuration -->
        <div
          v-if="store.isMeteostationConnected"
          v-show="activeSubTab === 'meteostation'"
          class="space-y-6"
        >
          <!-- Temperature Offset -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-300">
              {{ $t('plugins.pinsDevices.config.temperatureOffset') }}
            </label>
            <div class="flex items-center gap-2">
              <button
                @click="openMeteoTemperatureOffsetPicker()"
                class="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
              >
                {{ meteoTemperatureOffset.toFixed(2) }}°C
              </button>
            </div>
            <p class="text-xs text-gray-500">
              {{ $t('plugins.pinsDevices.config.temperatureOffsetDesc') }}
            </p>
          </div>

          <!-- Humidity Offset -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-300">
              {{ $t('plugins.pinsDevices.config.humidityOffset') }}
            </label>
            <div class="flex items-center gap-2">
              <button
                @click="openMeteoHumidityOffsetPicker()"
                class="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
              >
                {{ meteoHumidityOffset.toFixed(2) }}%
              </button>
            </div>
            <p class="text-xs text-gray-500">
              {{ $t('plugins.pinsDevices.config.humidityOffsetDesc') }}
            </p>
          </div>

          <!-- Environment Update Rate -->
          <div class="space-y-3 pb-6 border-b border-gray-700">
            <label class="block text-sm font-medium text-gray-300">
              {{ $t('plugins.pinsDevices.config.envUpdateRate') }}
            </label>
            <div class="flex items-center gap-2">
              <button
                @click="openMeteoUpdateRatePicker()"
                class="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
              >
                {{ meteoUpdateRate }}s
              </button>
            </div>
            <p class="text-xs text-gray-500">
              {{ $t('plugins.pinsDevices.config.envUpdateRateDesc') }}
            </p>
          </div>

          <!-- Factory Reset Section -->
          <div class="border border-red-700/50 rounded-lg p-4 bg-red-900/10">
            <h3 class="text-lg font-semibold text-red-400 mb-4">
              {{ $t('plugins.pinsDevices.config.factoryReset') }}
            </h3>

            <p class="text-sm text-gray-300 mb-4">
              {{ $t('plugins.pinsDevices.config.factoryResetDesc') }}
            </p>

            <button
              @click="confirmMeteoFactoryReset"
              class="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all"
            >
              {{ $t('plugins.pinsDevices.config.factoryReset') }}
            </button>
          </div>
        </div>

        <!-- WiFi Configuration -->
        <div v-show="activeSubTab === 'wifi'" class="space-y-6">
          <!-- Current WiFi Status -->
          <div>
            <h3 class="text-lg font-semibold text-white mb-4">
              {{ $t('plugins.pinsDevices.wifi.currentStatus') }}
            </h3>

            <div v-if="store.wifiInfo.SSID || store.wifiInfo.Mode" class="space-y-3">
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500 uppercase">SSID</span>
                  <span class="text-gray-200 font-mono">{{ store.wifiInfo.SSID || '--' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500 uppercase">Mode</span>
                  <span class="text-gray-200 capitalize">{{ store.wifiInfo.Mode || '--' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500 uppercase">IP Address</span>
                  <span class="text-gray-200 font-mono">{{
                    store.wifiInfo.IPAddress || '--'
                  }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500 uppercase">Hostname</span>
                  <span class="text-gray-200 font-mono">{{ store.wifiInfo.HostName || '--' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500 uppercase">RSSI</span>
                  <span class="text-gray-200">{{ store.wifiInfo.RSSI }}dBm</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500 uppercase">Channel</span>
                  <span class="text-gray-200">{{ store.wifiInfo.Channel || '--' }}</span>
                </div>
              </div>
            </div>

            <div v-else class="text-gray-400 italic text-sm">
              {{ $t('plugins.pinsDevices.wifi.notConnected') }}
            </div>
          </div>

          <!-- Create Hotspot Section -->
          <div class="border-t border-gray-700 pt-6">
            <h3 class="text-lg font-semibold text-white mb-4">
              {{ $t('plugins.pinsDevices.wifi.createHotspot') }}
            </h3>

            <div class="space-y-4">
              <!-- Hotspot SSID Input -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  {{ $t('plugins.pinsDevices.wifi.hotspotName') }}
                </label>
                <input
                  v-model="hotspotSSID"
                  type="text"
                  placeholder="My PowerBox Network"
                  class="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <!-- Hotspot Password Input -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  {{ $t('plugins.pinsDevices.wifi.hotspotPassword') }}
                  <span class="text-xs text-gray-500">(min 8 chars)</span>
                </label>
                <input
                  v-model="hotspotPassword"
                  type="password"
                  minlength="8"
                  placeholder="Secure password (8+ characters)"
                  class="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
                <p
                  v-if="hotspotPassword && hotspotPassword.length < 8"
                  class="text-xs text-red-400 mt-1"
                >
                  Password must be at least 8 characters
                </p>
              </div>

              <!-- Create Hotspot Button -->
              <button
                @click="createHotspot"
                :disabled="!isHotspotFormValid || store.isWiFiConnecting"
                class="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{
                  store.isWiFiConnecting
                    ? $t('common.creating')
                    : $t('plugins.pinsDevices.wifi.createHotspot')
                }}
              </button>

              <p class="text-xs text-gray-500">
                {{ $t('plugins.pinsDevices.wifi.hotspotDesc') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div
      v-if="showConfirmation"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-sm mx-4">
        <h3 class="text-lg font-semibold text-white mb-4">
          {{ $t('plugins.pinsDevices.config.factoryReset') }}
        </h3>

        <p class="text-sm text-gray-300 mb-6">
          {{ $t('plugins.pinsDevices.config.factoryResetConfirm') }}
        </p>

        <div class="flex gap-3">
          <button
            @click="cancelFactoryReset"
            class="flex-1 py-2 px-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-all"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            @click="executeFactoryReset"
            :disabled="isResettingFactory"
            class="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isResettingFactory ? $t('common.loading') : $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- MeteoStation Confirmation Dialog -->
    <div
      v-if="showMeteoConfirmation"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-sm mx-4">
        <h3 class="text-lg font-semibold text-white mb-4">
          {{ $t('plugins.pinsDevices.config.factoryReset') }}
        </h3>

        <p class="text-sm text-gray-300 mb-6">
          {{ $t('plugins.pinsDevices.config.factoryResetConfirm') }}
        </p>

        <div class="flex gap-3">
          <button
            @click="cancelMeteoFactoryReset"
            class="flex-1 py-2 px-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-all"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            @click="executeMeteoFactoryReset"
            :disabled="isResettingMeteoFactory"
            class="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isResettingMeteoFactory ? $t('common.loading') : $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { usePinsDeviceStore } from '../store/pinsDevicesStore.js';
import { useNumberPicker } from '@/composables/useNumberPicker.js';

const store = usePinsDeviceStore();
const { openPicker } = useNumberPicker();

const activeSubTab = ref('powerbox');
const temperatureOffset = ref(0);
const humidityOffset = ref(0);
const envUpdateRate = ref(3);
const updateRate = ref(1);
const meteoTemperatureOffset = ref(0);
const meteoHumidityOffset = ref(0);
const meteoUpdateRate = ref(3);
const hotspotSSID = ref('');
const hotspotPassword = ref('');
const showConfirmation = ref(false);
const showMeteoConfirmation = ref(false);
const isResettingFactory = ref(false);
const isResettingMeteoFactory = ref(false);

let unwatchStatus;

const isHotspotFormValid = computed(() => {
  return hotspotSSID.value && hotspotPassword.value && hotspotPassword.value.length >= 8;
});

const setActiveSubTab = (tab) => {
  activeSubTab.value = tab;
};

// Initialize activeSubTab based on connected devices
const initializeActiveSubTab = () => {
  if (store.isPowerboxConnected) {
    activeSubTab.value = 'powerbox';
  } else if (store.isMeteostationConnected) {
    activeSubTab.value = 'meteostation';
  }
};

// Watch for device connection state changes and initialize the active tab
watch(
  () => [store.isPowerboxConnected, store.isMeteostationConnected],
  () => {
    initializeActiveSubTab();
  },
  { immediate: true }
);

// Only watch when component is mounted and visible
onMounted(async () => {
  // Initialize PowerBox values from store
  if (store.powerboxStatus.TemperatureOffset !== undefined) {
    temperatureOffset.value = store.powerboxStatus.TemperatureOffset;
  }
  if (store.powerboxStatus.HumidityOffset !== undefined) {
    humidityOffset.value = store.powerboxStatus.HumidityOffset;
  }
  if (store.powerboxStatus.EnvUpdateRate !== undefined) {
    envUpdateRate.value = store.powerboxStatus.EnvUpdateRate;
  }
  if (store.powerboxStatus.UpdateRate !== undefined) {
    updateRate.value = store.powerboxStatus.UpdateRate;
  }

  // Initialize MeteoStation values from store
  if (store.meteoStationStatus.TemperatureOffset !== undefined) {
    meteoTemperatureOffset.value = store.meteoStationStatus.TemperatureOffset;
  }
  if (store.meteoStationStatus.HumidityOffset !== undefined) {
    meteoHumidityOffset.value = store.meteoStationStatus.HumidityOffset;
  }
  if (store.meteoStationStatus.UpdateRate !== undefined) {
    meteoUpdateRate.value = store.meteoStationStatus.EnvUpdateRate;
  }

  // Fetch WiFi info
  if (store.isPowerboxConnected) {
    await store.fetchWiFiInfo();
  }

  // Set up watcher for future changes
  unwatchStatus = watch(
    () => store.powerboxStatus,
    (newStatus) => {
      if (newStatus.TemperatureOffset !== undefined) {
        temperatureOffset.value = newStatus.TemperatureOffset;
      }
      if (newStatus.HumidityOffset !== undefined) {
        humidityOffset.value = newStatus.HumidityOffset;
      }
      if (newStatus.EnvUpdateRate !== undefined) {
        envUpdateRate.value = newStatus.EnvUpdateRate;
      }
      if (newStatus.UpdateRate !== undefined) {
        updateRate.value = newStatus.UpdateRate;
      }
    },
    { deep: true }
  );

  // Set up watcher for MeteoStation changes
  watch(
    () => store.meteoStationStatus,
    (newStatus) => {
      if (newStatus.TemperatureOffset !== undefined) {
        meteoTemperatureOffset.value = newStatus.TemperatureOffset;
      }
      if (newStatus.HumidityOffset !== undefined) {
        meteoHumidityOffset.value = newStatus.HumidityOffset;
      }
      if (newStatus.EnvUpdateRate !== undefined) {
        meteoUpdateRate.value = newStatus.EnvUpdateRate;
      }
    },
    { deep: true }
  );
});

onUnmounted(() => {
  if (unwatchStatus) {
    unwatchStatus();
  }
});

const openTemperatureOffsetPicker = () => {
  openPicker(
    'plugins.pinsDevices.config.temperatureOffset',
    -12,
    12,
    0.1,
    temperatureOffset.value,
    (newValue) => handleTemperatureOffsetChange(newValue),
    1
  );
};

const openHumidityOffsetPicker = () => {
  openPicker(
    'plugins.pinsDevices.config.humidityOffset',
    -12,
    12,
    0.1,
    humidityOffset.value,
    (newValue) => handleHumidityOffsetChange(newValue),
    1
  );
};

const openEnvUpdateRatePicker = () => {
  openPicker(
    'plugins.pinsDevices.config.envUpdateRate',
    1,
    60,
    1,
    envUpdateRate.value,
    (newValue) => handleEnvUpdateRateChange(newValue),
    0
  );
};

const openUpdateRatePicker = () => {
  openPicker(
    'plugins.pinsDevices.config.updateRate',
    1,
    60,
    1,
    updateRate.value,
    (newValue) => handleUpdateRateChange(newValue),
    0
  );
};

const handleTemperatureOffsetChange = async (offset) => {
  const numValue = parseFloat(offset);
  if (isNaN(numValue)) return;

  const success = await store.setTemperatureOffset(numValue);
  if (success) {
    temperatureOffset.value = numValue;
  }
};

const handleHumidityOffsetChange = async (offset) => {
  const numValue = parseFloat(offset);
  if (isNaN(numValue)) return;

  const success = await store.setHumidityOffset(numValue);
  if (success) {
    humidityOffset.value = numValue;
  }
};

const handleEnvUpdateRateChange = async (rate) => {
  const numValue = parseInt(rate, 10);
  if (isNaN(numValue)) return;

  // Clamp to valid range 1-60
  const clampedValue = Math.max(1, Math.min(60, numValue));
  const success = await store.setEnvUpdateRate(clampedValue);
  if (success) {
    envUpdateRate.value = clampedValue;
  }
};

const handleUpdateRateChange = async (rate) => {
  const numValue = parseInt(rate, 10);
  if (isNaN(numValue)) return;

  // Clamp to valid range 1-60
  const clampedValue = Math.max(1, Math.min(60, numValue));
  const success = await store.setUpdateRate(clampedValue);
  if (success) {
    updateRate.value = clampedValue;
  }
};

const confirmFactoryReset = () => {
  showConfirmation.value = true;
};

const cancelFactoryReset = () => {
  showConfirmation.value = false;
};

const executeFactoryReset = async () => {
  isResettingFactory.value = true;
  try {
    const success = await store.factoryReset();
    if (success) {
      showConfirmation.value = false;
      // Optionally reload or refresh after reset
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  } finally {
    isResettingFactory.value = false;
  }
};

// MeteoStation methods
const openMeteoTemperatureOffsetPicker = () => {
  openPicker(
    'plugins.pinsDevices.config.temperatureOffset',
    -12,
    12,
    0.1,
    meteoTemperatureOffset.value,
    (newValue) => handleMeteoTemperatureOffsetChange(newValue),
    1
  );
};

const openMeteoHumidityOffsetPicker = () => {
  openPicker(
    'plugins.pinsDevices.config.humidityOffset',
    -12,
    12,
    0.1,
    meteoHumidityOffset.value,
    (newValue) => handleMeteoHumidityOffsetChange(newValue),
    1
  );
};

const openMeteoUpdateRatePicker = () => {
  openPicker(
    'plugins.pinsDevices.config.envUpdateRate',
    1,
    60,
    1,
    meteoUpdateRate.value,
    (newValue) => handleMeteoUpdateRateChange(newValue),
    0
  );
};

const handleMeteoTemperatureOffsetChange = async (offset) => {
  const numValue = parseFloat(offset);
  if (isNaN(numValue)) return;

  const success = await store.setMeteoStationTemperatureOffset(numValue);
  if (success) {
    meteoTemperatureOffset.value = numValue;
  }
};

const handleMeteoHumidityOffsetChange = async (offset) => {
  const numValue = parseFloat(offset);
  if (isNaN(numValue)) return;

  const success = await store.setMeteoStationHumidityOffset(numValue);
  if (success) {
    meteoHumidityOffset.value = numValue;
  }
};

const handleMeteoUpdateRateChange = async (rate) => {
  const numValue = parseInt(rate, 10);
  if (isNaN(numValue)) return;

  // Clamp to valid range 1-60
  const clampedValue = Math.max(1, Math.min(60, numValue));
  const success = await store.setMeteoStationUpdateRate(clampedValue);
  if (success) {
    meteoUpdateRate.value = clampedValue;
  }
};

const confirmMeteoFactoryReset = () => {
  showMeteoConfirmation.value = true;
};

const cancelMeteoFactoryReset = () => {
  showMeteoConfirmation.value = false;
};

const executeMeteoFactoryReset = async () => {
  isResettingMeteoFactory.value = true;
  try {
    const success = await store.factoryResetMeteoStation();
    if (success) {
      showMeteoConfirmation.value = false;
      // Optionally reload or refresh after reset
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  } finally {
    isResettingMeteoFactory.value = false;
  }
};

const createHotspot = async () => {
  if (!isHotspotFormValid.value) {
    return;
  }
  store.resetError();
  const success = await store.connectWiFiAP(hotspotSSID.value, hotspotPassword.value);
  if (success) {
    hotspotSSID.value = '';
    hotspotPassword.value = '';
    // Wait a moment for device to configure, then refresh WiFi info
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await store.fetchWiFiInfo();
  }
};
</script>
