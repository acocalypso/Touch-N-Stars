<template>
  <div v-if="isFocuserSelected" class="flex flex-col border border-gray-500 p-1 md:p-2 rounded-lg">
    <!-- Connection Mode -->
    <div class="flex flex-row items-center justify-between w-full">
      <label for="connectionMode" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.focuser.config.connectionMode') }}
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
      <!-- Device Port (Serial) -->
      <div class="flex flex-row items-center justify-between w-full mt-2 md:mt-3">
        <label for="devicePort" class="text-xs md:text-sm text-gray-200 mr-2">
          {{ $t('components.focuser.config.devicePort') }}
        </label>
        <select
          id="devicePort"
          v-model="devicePort"
          @change="setDevicePort"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
          :class="statusClassDevicePort"
        >
          <option value="" disabled>-- Select a port --</option>
          <option
            v-for="port in availablePorts"
            :key="port.PortName"
            :value="port.PortName"
            :disabled="!port.IsAvailable"
          >
            {{ port.DisplayName }}
          </option>
        </select>
      </div>

      <!-- Baud Rate -->
      <div class="flex flex-row items-center justify-between w-full mt-2 md:mt-3">
        <label for="baudRate" class="text-xs md:text-sm text-gray-200 mr-2">
          {{ $t('components.focuser.config.baudRate') }}
        </label>
        <select
          id="baudRate"
          v-model.number="baudRate"
          @change="setBaudRate"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
          :class="statusClassBaudRate"
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
          {{ $t('components.focuser.config.ipAddress') }}
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
        <label for="tcpPort" class="text-xs md:text-sm text-gray-200 mr-2">
          {{ $t('components.focuser.config.tcpPort') }}
        </label>
        <input
          id="tcpPort"
          v-model="tcpPort"
          @change="setTCPPort"
          type="text"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
          :class="statusClassTCPPort"
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
  selectedFocuserDevice: { type: String, default: '' },
});

const store = apiStore();

const isFocuserSelected = computed(() => {
  const deviceName = props.selectedFocuserDevice.toLowerCase();
  const driverInfo = store.focuserInfo?.DriverInfo?.toLowerCase() || '';
  const category = store.focuserInfo?.Category?.toLowerCase() || '';
  return deviceName.includes('indi') || driverInfo.includes('indi') || category.includes('indi');
});

const connectionMode = ref('CONNECTION_SERIAL');
const devicePort = ref('/dev/ttyUSB0');
const baudRate = ref(9600);
const ipAddress = ref('localhost');
const tcpPort = ref('3492');
const availablePorts = ref([]);

const statusClassConnectionMode = ref('');
const statusClassDevicePort = ref('');
const statusClassBaudRate = ref('');
const statusClassIPAddress = ref('');
const statusClassTCPPort = ref('');

const initializeSettings = () => {
  if (!store.profileInfo?.FocuserSettings) {
    console.warn('FocuserSettings not loaded');
    return;
  }

  connectionMode.value =
    store.profileInfo.FocuserSettings.FocuserConnectionMode ?? 'CONNECTION_SERIAL';
  devicePort.value = store.profileInfo.FocuserSettings.FocuserPort ?? '/dev/ttyUSB0';
  baudRate.value = store.profileInfo.FocuserSettings.FocuserBaudRate ?? 9600;
  ipAddress.value = store.profileInfo.FocuserSettings.FocuserAddress ?? 'localhost';

  // Fetch available ports if in serial mode
  if (connectionMode.value === 'CONNECTION_SERIAL') {
    fetchAvailablePorts();
  }
};

async function fetchAvailablePorts() {
  try {
    const ports = await apiService.availableSerialPorts();
    availablePorts.value = ports;
  } catch (error) {
    console.error('Error fetching serial ports:', error);
    availablePorts.value = [];
  }
}

async function setConnectionMode() {
  try {
    await apiService.profileChangeValue(
      'FocuserSettings-FocuserConnectionMode',
      connectionMode.value
    );
    statusClassConnectionMode.value = 'glow-green';

    if (connectionMode.value === 'CONNECTION_SERIAL') {
      fetchAvailablePorts();
    }
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
    await apiService.profileChangeValue('FocuserSettings-FocuserPort', devicePort.value);
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
    await apiService.profileChangeValue('FocuserSettings-FocuserBaudRate', baudRate.value);
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
    await apiService.profileChangeValue('FocuserSettings-FocuserAddress', ipAddress.value);
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

async function setTCPPort() {
  try {
    await apiService.profileChangeValue('FocuserSettings-FocuserPort', tcpPort.value);
    statusClassTCPPort.value = 'glow-green';
  } catch (error) {
    console.error('Error setting TCP port:', error);
    statusClassTCPPort.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassTCPPort.value = '';
    }, 2000);
  }
}

onMounted(() => {
  initializeSettings();
});
</script>
