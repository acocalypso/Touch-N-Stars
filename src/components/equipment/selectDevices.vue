<template>
  <div
    :class="{
      'border-red-500 error-glow': error, // Fehler: rot + pulsieren
      'border-green-500 connected-glow': isConnected && !error,
      'border-gray-500': !error && !isConnected, // Standard: Grau
    }"
    class="flex max-w-md border p-2 rounded-lg h-full gap-2 items-center justify-between transition-all duration-300"
  >
    <label class="w-36" for="deviceSelect">{{ deviceName }}:</label>
    <select
      id="deviceSelect"
      class="w-full text-black px-3 h-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-700"
      v-model="selectedDevice"
      :disabled="isConnected"
    >
      <option disabled>{{ selectedDevice }}</option>
      <option v-for="device in devices" :key="device.Name" :value="String(device.Name)">
        {{ device.Name }}
      </option>
    </select>
    <div class="flex w-20 gap-1">
      <button
        @click="rescanDevices"
        :disabled="isScanning"
        class="flex justify-center items-center w-10 h-10 border border-cyan-500/20 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-70"
      >
        <ArrowPathIcon
          class="w-6 h-6"
          :class="{ 'text-green-500 spin': isScanning, 'text-white': !isScanning }"
        />
      </button>
      <button
        @click="toggleConnection"
        :disabled="isToggleCon"
        class="flex justify-center items-center w-10 h-10 border border-cyan-500/20 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-30"
      >
        <LinkIcon v-if="!isConnected" class="w-6 h-6" />
        <LinkSlashIcon v-else class="w-6 h-6 text-red-600" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiService from '@/services/apiService';
import { ArrowPathIcon, LinkIcon, LinkSlashIcon } from '@heroicons/vue/24/outline';

import * as HeroIcons from '@heroicons/vue/24/outline';
console.log(Object.keys(HeroIcons));

//  Props definieren
const props = defineProps({
  apiAction: { type: String, required: true },
  defaultDeviceId: { type: String, default: '?' },
  deviceName: { type: String, default: 'Gerät' },
  isConnected: { type: Boolean, required: true },
});

const devices = ref([]);
const selectedDevice = ref('');
const error = ref(false);
const isScanning = ref(false);
const isToggleCon = ref(false);

// Funktion für API-Aufruf mit dynamischem `apiAction`
async function getDevices() {
  error.value = false;
  try {
    if (!apiService[props.apiAction]) {
      throw new Error(`Ungültige API-Methode: ${props.apiAction}`);
    }
    const response = await apiService[props.apiAction]('list-devices');
    if (response.Error) {
      error.value = true;
      console.error('API-Fehler:', response.Error);
      return;
    }

    if (Array.isArray(response.Response)) {
      devices.value = response.Response;
    } else {
      error.value = true;
      console.error('Fehlerhafte API-Antwort:', response);
    }
  } catch (err) {
    error.value = true;
    console.error('Fehler:', err);
  }
}

async function rescanDevices() {
  error.value = false;
  console.log('scan');
  isScanning.value = true;
  try {
    if (!apiService[props.apiAction]) {
      throw new Error(`Ungültige API-Methode: ${props.apiAction}`);
    }
    const response = await apiService[props.apiAction]('rescan');
    console.log(response);
    isScanning.value = false;
    if (response.Error) {
      error.value = true;
      console.error('API-Fehler:', response.Error);
      isScanning.value = false;
      return;
    }

    if (Array.isArray(response.Response)) {
      devices.value = response.Response;
    } else {
      error.value = true;
      console.error('Fehlerhafte API-Antwort:', response);
    }
  } catch (err) {
    error.value = true;
    console.error('Fehler:', err);
  }
}

async function toggleConnection() {
  error.value = false;
  isToggleCon.value = true;
  const deviceId = getDeviceId(selectedDevice.value);
  try {
    if (props.isConnected) {
      console.log('disconnect');
      await apiService[props.apiAction]('disconnect');
    } else {
      console.log('connect to', selectedDevice.value, 'ID:', deviceId);
      const response = await apiService[props.apiAction]('connect?to=' + deviceId);
      console.log('response', response);

      if (!response.Success) {
        throw new Error(response.Error || 'Unbekannter Verbindungsfehler');
      }
    }
  } catch (err) {
    isToggleCon.value = false;
    error.value = true;
    console.error('Error connect device: ', err);
  }
}

function getDeviceName(deviceId) {
  const device = devices.value.find((d) => String(d.Id) === String(deviceId));
  return device ? device.Name : '';
}

function getDeviceId(deviceName) {
  const device = devices.value.find((d) => d.Name === deviceName);
  return device ? String(device.Id) : '';
}

watch(
  () => props.isConnected,
  (newValues) => {
    console.log(newValues);
    isToggleCon.value = false;
  }
);
watch(
  () => props.defaultDeviceId,
  (newValues) => {
    console.log(newValues);
    selectedDevice.value = getDeviceName(newValues);
  }
);

onMounted(async () => {
  await getDevices();
  selectedDevice.value = props.defaultDeviceId;
  console.log('Mount', selectedDevice.value);
  selectedDevice.value = getDeviceName(selectedDevice.value);
  console.log('Mount2', selectedDevice.value);
});
</script>

<style scoped>
@keyframes error-glow {
  0% {
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
  }
  100% {
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
  }
}

.error-glow {
  animation: error-glow 1.5s infinite alternate;
}

.connected-glow {
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
}

.spin {
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
