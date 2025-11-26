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
        <option value="SERIAL">Serial</option>
        <option value="NETWORK">Network</option>
        <option value="USB">USB</option>
      </select>
    </div>

    <!-- Device Port -->
    <div class="flex flex-row items-center justify-between w-full mt-2 md:mt-3">
      <label for="devicePort" class="text-xs md:text-sm text-gray-200 mr-2">
        {{
          connectionMode === 'NETWORK'
            ? $t('components.mount.config.ipAddress')
            : $t('components.mount.config.devicePort')
        }}
      </label>
      <input
        id="devicePort"
        v-model="devicePort"
        @change="setDevicePort"
        type="text"
        class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
        :class="statusClassDevicePort"
        :placeholder="connectionMode === 'NETWORK' ? '192.168.1.100:9999' : '/dev/ttyUSB0'"
      />
    </div>

    <!-- Baud Rate (only for Serial/USB) -->
    <div
      v-if="connectionMode !== 'NETWORK'"
      class="flex flex-row items-center justify-between w-full mt-2 md:mt-3"
    >
      <label for="baudRate" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.mount.config.baudRate') }}
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

const connectionMode = ref('SERIAL');
const devicePort = ref('/dev/ttyUSB0');
const baudRate = ref(9600);

const statusClassConnectionMode = ref('');
const statusClassDevicePort = ref('');
const statusClassBaudRate = ref('');

const initializeSettings = () => {
  if (!store.profileInfo?.TelescopeSettings) {
    console.warn('TelescopeSettings not loaded');
    return;
  }

  connectionMode.value = store.profileInfo.TelescopeSettings.ConnectionMode ?? 'SERIAL';
  devicePort.value = store.profileInfo.TelescopeSettings.DevicePort ?? '/dev/ttyUSB0';
  baudRate.value = store.profileInfo.TelescopeSettings.BaudRate ?? 9600;
};

async function setConnectionMode() {
  try {
    const data = await apiService.profileChangeValue(
      'TelescopeSettings-ConnectionMode',
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
      'TelescopeSettings-DevicePort',
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
    const data = await apiService.profileChangeValue('TelescopeSettings-BaudRate', baudRate.value);
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

onMounted(() => {
  initializeSettings();
});
</script>
