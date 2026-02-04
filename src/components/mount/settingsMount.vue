<template>
  <div v-if="isMountSelected" class="flex flex-col border border-gray-500 p-1 md:p-2 rounded-lg">
    <!-- Connection Mode -->
    <div class="flex flex-row items-center justify-between w-full">
      <label for="connectionMode" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.mount.config.connectionMode') }}
      </label>
      <select
        id="connectionMode"
        v-model="connectionMode"
        @change="setConnectionMode"
        class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
        :class="statusClassConnectionMode"
      >
        <option value="CONNECTION_SERIAL">Serial</option>
        <option value="CONNECTION_TCP">Network</option>
      </select>
    </div>

    <!-- SERIAL Connection Settings -->
    <div v-if="connectionMode === 'CONNECTION_SERIAL'">
      <!-- Auto Detect Checkbox -->
      <div class="flex flex-row items-center justify-between w-full mt-2 md:mt-3">
        <label for="autoDetect" class="text-xs md:text-sm text-gray-200 mr-2">
          {{ $t('components.mount.config.autoDetect') }}
        </label>
        <input
          id="autoDetect"
          v-model="autoDetect"
          @change="setAutoDetect"
          type="checkbox"
          class="h-4 w-4 cursor-pointer"
        />
      </div>

      <!-- Device Port (Serial) -->
      <div class="flex flex-row items-center justify-between w-full mt-2 md:mt-3">
        <label for="devicePort" class="text-xs md:text-sm text-gray-200 mr-2">
          {{ $t('components.mount.config.devicePort') }}
        </label>
        <input
          id="devicePort"
          v-model="devicePort"
          @change="setDevicePort"
          type="text"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
          :class="[
            statusClassDevicePort,
            autoDetect ? 'opacity-50 cursor-not-allowed bg-gray-600' : '',
          ]"
          :disabled="autoDetect"
          placeholder="/dev/ttyUSB0"
        />
      </div>

      <!-- Baud Rate -->
      <div class="flex flex-row items-center justify-between w-full mt-2 md:mt-3">
        <label for="baudRate" class="text-xs md:text-sm text-gray-200 mr-2">
          {{ $t('components.mount.config.baudRate') }}
        </label>
        <select
          id="baudRate"
          v-model.number="baudRate"
          @change="setBaudRate"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
          :class="[
            statusClassBaudRate,
            autoDetect ? 'opacity-50 cursor-not-allowed bg-gray-600' : '',
          ]"
          :disabled="autoDetect"
        >
          <option :value="9600">9600</option>
          <option :value="19200">19200</option>
          <option :value="38400">38400</option>
          <option :value="57600">57600</option>
          <option :value="115200">115200</option>
        </select>
      </div>
    </div>

    <!-- TCP Connection Settings -->
    <div v-if="connectionMode === 'CONNECTION_TCP'">
      <!-- IP Address -->
      <div class="flex flex-row items-center justify-between w-full mt-2 md:mt-3">
        <label for="ipAddress" class="text-xs md:text-sm text-gray-200 mr-2">
          {{ $t('components.mount.config.ipAddress') }}
        </label>
        <input
          id="ipAddress"
          v-model="ipAddress"
          @change="setIPAddress"
          type="text"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
          :class="statusClassIPAddress"
          placeholder="localhost"
        />
      </div>

      <!-- TCP Port -->
      <div class="flex flex-row items-center justify-between w-full mt-2 md:mt-3">
        <label for="devicePort" class="text-xs md:text-sm text-gray-200 mr-2">
          {{ $t('components.mount.config.tcpPort') }}
        </label>
        <input
          id="devicePort"
          v-model="devicePort"
          @change="setDevicePort"
          type="text"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
          :class="statusClassDevicePort"
          placeholder="3492"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const props = defineProps({
  selectedMountDevice: { type: String, default: '' },
});

const store = apiStore();

const isMountSelected = computed(() => {
  // Check if INDI mount is selected by looking at device name or driver info
  const deviceName = props.selectedMountDevice.toLowerCase();
  const driverInfo = store.mountInfo?.DriverInfo?.toLowerCase() || '';
  const category = store.mountInfo?.Category?.toLowerCase() || '';
  return deviceName.includes('indi') || driverInfo.includes('indi') || category.includes('indi');
});

const connectionMode = ref('CONNECTION_SERIAL');
const devicePort = ref('/dev/ttyUSB0');
const baudRate = ref(9600);
const ipAddress = ref('localhost');
const autoDetect = ref(true);

const statusClassConnectionMode = ref('');
const statusClassDevicePort = ref('');
const statusClassBaudRate = ref('');
const statusClassIPAddress = ref('');

const initializeSettings = () => {
  if (!store.profileInfo?.TelescopeSettings) {
    console.warn('TelescopeSettings not loaded');
    return;
  }

  connectionMode.value =
    store.profileInfo.TelescopeSettings.IndiConnectionMode ?? 'CONNECTION_SERIAL';
  devicePort.value = store.profileInfo.TelescopeSettings.IndiPort ?? '/dev/ttyUSB0';
  baudRate.value = store.profileInfo.TelescopeSettings.IndiBaudRate ?? 9600;
  ipAddress.value = store.profileInfo.TelescopeSettings.IndiAddress ?? 'localhost';
  autoDetect.value = store.profileInfo.TelescopeSettings.IndiAutoSearch ?? true;
};

async function setConnectionMode() {
  try {
    const data = await apiService.profileChangeValue(
      'TelescopeSettings-IndiConnectionMode',
      connectionMode.value
    );
    console.log(data);
    statusClassConnectionMode.value = 'glow-green';
  } catch (error) {
    console.error('Error setting connection mode:', error);
    statusClassConnectionMode.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassConnectionMode.value = '';
    }, 2000);
  }
}

async function setDevicePort() {
  try {
    const data = await apiService.profileChangeValue(
      'TelescopeSettings-IndiPort',
      devicePort.value
    );
    console.log(data);
    statusClassDevicePort.value = 'glow-green';
  } catch (error) {
    console.error('Error setting device port:', error);
    statusClassDevicePort.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassDevicePort.value = '';
    }, 2000);
  }
}

async function setBaudRate() {
  try {
    const data = await apiService.profileChangeValue(
      'TelescopeSettings-IndiBaudRate',
      baudRate.value
    );
    console.log(data);
    statusClassBaudRate.value = 'glow-green';
  } catch (error) {
    console.error('Error setting baud rate:', error);
    statusClassBaudRate.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassBaudRate.value = '';
    }, 2000);
  }
}

async function setIPAddress() {
  try {
    const data = await apiService.profileChangeValue(
      'TelescopeSettings-IndiAddress',
      ipAddress.value
    );
    console.log(data);
    statusClassIPAddress.value = 'glow-green';
  } catch (error) {
    console.error('Error setting IP address:', error);
    statusClassIPAddress.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassIPAddress.value = '';
    }, 2000);
  }
}

async function setAutoDetect() {
  try {
    const data = await apiService.profileChangeValue(
      'TelescopeSettings-IndiAutoSearch',
      autoDetect.value
    );
    console.log(data);
  } catch (error) {
    console.error('Error setting auto detect:', error);
    autoDetect.value = !autoDetect.value; // revert on error
  }
}

onMounted(() => {
  initializeSettings();
});
</script>
