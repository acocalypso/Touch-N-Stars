<template>
  <div v-if="store.focuserInfo.Connected" class="flex flex-col gap-4">
    <!-- Scan and Device Selection Section -->
    <div
      class="flex flex-col sm:flex-row border border-gray-700 p-4 rounded-lg gap-2 sm:items-center transition-all duration-300 bg-gradient-to-br from-gray-800 to-gray-900"
    >
      <label class="text-sm sm:w-36 shrink-0">{{ $t('components.tilter.device') }}:</label>
      <div class="flex gap-2 items-center w-full">
        <select
          class="w-full default-select min-w-0"
          v-model="selectedDevice"
          :disabled="isScanning || isConnecting || isDisconnecting"
        >
          <option disabled value="">
            {{ selectedDevice || $t('components.tilter.selectDevice') }}
          </option>
          <option v-for="device in devices" :key="device.Id" :value="String(device.Id)">
            {{ device.Name }}
          </option>
        </select>
        <div class="flex shrink-0 gap-1">
          <button
            @click="scanDevices"
            :disabled="isConnecting || isDisconnecting"
            class="flex justify-center items-center w-10 h-10 border border-cyan-500/20 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-70 transition-colors"
            :title="$t('components.tilter.scanTooltip')"
          >
            <ArrowPathIcon
              class="w-6 h-6"
              :class="{ 'text-green-500 animate-spin': isScanning, 'text-white': !isScanning }"
            />
          </button>
          <button
            @click="toggleConnection"
            :disabled="!selectedDevice || isConnecting || isDisconnecting"
            class="flex justify-center items-center w-10 h-10 border border-cyan-500/20 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-70 transition-colors"
            :title="
              isConnected ? $t('components.tilter.disconnect') : $t('components.tilter.connect')
            "
          >
            <LinkIcon v-if="!isConnected" class="w-6 h-6" />
            <LinkSlashIcon v-else class="w-6 h-6 text-red-600" />
            <svg
              v-if="isConnecting || isDisconnecting"
              class="animate-spin h-6 w-6 text-white absolute"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Device Info and Controls (only show if device is selected and connected) -->
    <div
      v-if="isConnected && selectedDevice"
      class="border border-gray-700 rounded-lg p-4 bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg"
    >
      <h3 class="font-bold text-base text-cyan-400 mb-4">
        {{ $t('components.tilter.deviceInfo') }}
      </h3>
      <div class="flex flex-col gap-3">
        <!-- Device Status -->
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-gray-400">{{ $t('components.tilter.status') }}:</span>
            <span
              class="ml-2 font-semibold"
              :class="deviceStatus?.isMoving ? 'text-yellow-400' : 'text-green-400'"
            >
              {{
                deviceStatus?.isMoving
                  ? $t('components.tilter.moving')
                  : $t('components.tilter.idle')
              }}
            </span>
          </div>
          <div>
            <span class="text-gray-400">{{ $t('components.tilter.connected') }}:</span>
            <span class="ml-2 font-semibold text-green-400">{{ $t('common.yes') }}</span>
          </div>
        </div>

        <!-- Position Display -->
        <div class="border border-gray-600/30 rounded p-3 bg-gray-700/20">
          <p class="text-sm text-cyan-400 font-semibold mb-2">
            {{ $t('components.tilter.currentPositions') }}
          </p>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="text-center">
              <span class="text-gray-400">{{ $t('components.tilter.point1') }}:</span>
              <p class="font-mono text-green-400">
                {{ deviceStatus?.currentPosition1 ?? 'N/A' }} µm
              </p>
            </div>
            <div class="text-center">
              <span class="text-gray-400">{{ $t('components.tilter.point2') }}:</span>
              <p class="font-mono text-green-400">
                {{ deviceStatus?.currentPosition2 ?? 'N/A' }} µm
              </p>
            </div>
            <div class="text-center">
              <span class="text-gray-400">{{ $t('components.tilter.point3') }}:</span>
              <p class="font-mono text-green-400">
                {{ deviceStatus?.currentPosition3 ?? 'N/A' }} µm
              </p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/30 rounded">
          <p class="text-red-400 text-sm">{{ errorMessage }}</p>
        </div>
      </div>
    </div>

    <!-- No Device Selected Message -->
    <div v-if="!selectedDevice" class="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <p class="text-blue-400 font-medium text-center text-sm">
        {{ $t('components.tilter.noDeviceSelected') }}
      </p>
    </div>

    <!-- Not Connected Message -->
    <div
      v-else-if="selectedDevice && !isConnected"
      class="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
    >
      <p class="text-yellow-400 font-medium text-center text-sm">
        {{ $t('components.tilter.deviceNotConnected') }}
      </p>
    </div>
  </div>

  <div v-else class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
    <p class="text-red-400 font-medium text-center">
      {{ $t('components.tilter.focuserRequired') }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ArrowPathIcon, LinkIcon, LinkSlashIcon } from '@heroicons/vue/24/outline';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const store = apiStore();

const devices = ref([]);
const selectedDevice = ref('');
const isScanning = ref(false);
const isConnecting = ref(false);
const isDisconnecting = ref(false);
const isConnected = ref(false);
const deviceStatus = ref(null);
const errorMessage = ref('');
const statusRefreshTimer = ref(null);

// Load devices on mount
onMounted(async () => {
  await loadDevices();
});

async function loadDevices() {
  try {
    isScanning.value = true;
    errorMessage.value = '';
    const response = await apiService.hocusfocus.getTilterDevices();

    if (response.Error) {
      console.error('Error loading devices:', response.Error);
      errorMessage.value = response.Error;
      devices.value = [];
    } else if (Array.isArray(response.Response)) {
      devices.value = response.Response;
    } else {
      devices.value = [];
    }
  } catch (error) {
    console.error('Error loading tilter devices:', error);
    errorMessage.value = error.message || 'Failed to load devices';
    devices.value = [];
  } finally {
    isScanning.value = false;
  }
}

async function scanDevices() {
  try {
    isScanning.value = true;
    errorMessage.value = '';
    const response = await apiService.hocusfocus.scanTilterDevices();

    if (response.Error) {
      console.error('Scan error:', response.Error);
      errorMessage.value = response.Error;
      devices.value = [];
    } else if (Array.isArray(response.Response)) {
      devices.value = response.Response;
      selectedDevice.value = ''; // Reset selection after scan
    } else {
      devices.value = [];
    }
  } catch (error) {
    console.error('Error scanning tilter devices:', error);
    errorMessage.value = error.message || 'Failed to scan devices';
    devices.value = [];
  } finally {
    isScanning.value = false;
  }
}

async function toggleConnection() {
  if (!selectedDevice.value) return;

  try {
    if (isConnected.value) {
      await disconnect();
    } else {
      await connect();
    }
  } catch (error) {
    console.error('Connection error:', error);
    errorMessage.value = error.message || 'Connection failed';
  }
}

async function connect() {
  try {
    isConnecting.value = true;
    errorMessage.value = '';
    const response = await apiService.hocusfocus.connectTilterDevice(selectedDevice.value);

    if (response.Error) {
      errorMessage.value = response.Error;
      isConnected.value = false;
    } else {
      isConnected.value = true;
      await refreshStatus();
      startStatusRefresh();
    }
  } catch (error) {
    console.error('Connect error:', error);
    errorMessage.value = error.message || 'Failed to connect';
    isConnected.value = false;
  } finally {
    isConnecting.value = false;
  }
}

async function disconnect() {
  try {
    isDisconnecting.value = true;
    errorMessage.value = '';

    if (statusRefreshTimer.value) {
      clearInterval(statusRefreshTimer.value);
      statusRefreshTimer.value = null;
    }

    const response = await apiService.hocusfocus.disconnectTilterDevice(selectedDevice.value);

    if (response.Error) {
      errorMessage.value = response.Error;
    } else {
      isConnected.value = false;
      deviceStatus.value = null;
    }
  } catch (error) {
    console.error('Disconnect error:', error);
    errorMessage.value = error.message || 'Failed to disconnect';
  } finally {
    isDisconnecting.value = false;
  }
}

async function refreshStatus() {
  try {
    const response = await apiService.hocusfocus.getTilterStatus(selectedDevice.value);

    if (!response.Error && response.Response) {
      deviceStatus.value = response.Response;
    }
  } catch (error) {
    console.error('Status refresh error:', error);
  }
}

function startStatusRefresh() {
  if (statusRefreshTimer.value) {
    clearInterval(statusRefreshTimer.value);
  }

  // Refresh status every 1 second while connected
  statusRefreshTimer.value = setInterval(() => {
    if (isConnected.value && selectedDevice.value) {
      refreshStatus();
    }
  }, 1000);
}

// Cleanup on unmount
onMounted(() => {
  return () => {
    if (statusRefreshTimer.value) {
      clearInterval(statusRefreshTimer.value);
    }
  };
});
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
