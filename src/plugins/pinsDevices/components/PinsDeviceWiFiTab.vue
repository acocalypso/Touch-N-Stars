<template>
  <div class="space-y-4">
    <!-- Error Message -->
    <div v-if="store.error" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <p class="text-red-400 font-medium">{{ store.error }}</p>
    </div>

    <!-- Current WiFi Status -->
    <div class="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
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
            <span class="text-gray-200 font-mono">{{ store.wifiInfo.IPAddress || '--' }}</span>
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
    <div class="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
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
          <p v-if="hotspotPassword && hotspotPassword.length < 8" class="text-xs text-red-400 mt-1">
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePinsDeviceStore } from '../store/pinsDevicesStore.js';

const store = usePinsDeviceStore();

const hotspotSSID = ref('');
const hotspotPassword = ref('');

const isHotspotFormValid = computed(() => {
  return hotspotSSID.value && hotspotPassword.value && hotspotPassword.value.length >= 8;
});

onMounted(async () => {
  await store.fetchWiFiInfo();
});

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
