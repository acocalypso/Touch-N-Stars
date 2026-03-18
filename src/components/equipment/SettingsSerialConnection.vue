<template>
  <div
    v-if="isEquipmentSelected"
    class="flex flex-col border border-gray-500 p-1 md:p-2 rounded-lg"
  >
    <!-- Connection Mode -->
    <div class="flex flex-row items-center justify-between w-full">
      <label for="connectionMode" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('indi.config.connectionMode') }}
      </label>
      <select
        id="connectionMode"
        v-model="connectionMode"
        @change="setConnectionMode"
        class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
        :class="statusClassConnectionMode"
      >
        <option value="CONNECTION_SERIAL">{{ $t('indi.config.serial') }}</option>
        <option value="CONNECTION_TCP">{{ $t('indi.config.network') }}</option>
      </select>
    </div>

    <!-- SERIAL Connection Settings -->
    <div v-if="connectionMode === 'CONNECTION_SERIAL'">
      <!-- Auto Detect Checkbox -->
      <div class="flex flex-row items-center justify-between w-full mt-2 md:mt-3">
        <label for="autoDetect" class="text-xs md:text-sm text-gray-200 mr-2">
          {{ $t('indi.config.autoDetect') }}
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
          {{ $t('indi.config.devicePort') }}
        </label>
        <select
          id="devicePort"
          v-model="devicePort"
          @change="setDevicePort"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
          :class="[
            statusClassDevicePort,
            autoDetect ? 'opacity-50 cursor-not-allowed bg-gray-600' : '',
          ]"
          :disabled="autoDetect"
        >
          <option value="" disabled>{{ $t('indi.config.selectPort') }}</option>
          <option v-for="port in availablePorts" :key="port" :value="port">
            {{ port }}
          </option>
        </select>
      </div>

      <!-- Baud Rate -->
      <div class="flex flex-row items-center justify-between w-full mt-2 md:mt-3">
        <label for="baudRate" class="text-xs md:text-sm text-gray-200 mr-2">
          {{ $t('indi.config.baudRate') }}
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
          {{ $t('indi.config.ipAddress') }}
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
          {{ $t('indi.config.tcpPort') }}
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
  equipmentType: { type: String, required: true }, // 'mount', 'focuser', 'rotator', 'flatdevice'
  selectedDevice: { type: String, default: '' },
});

const store = apiStore();

// Map equipment type to store info
const equipmentInfoMap = {
  mount: () => store.mountInfo,
  focuser: () => store.focuserInfo,
  rotator: () => store.rotatorInfo,
  flatdevice: () => store.flatdeviceInfo,
  weather: () => store.weatherInfo,
  filterwheel: () => store.filterInfo,
};

// Map equipment type to settings key in profileInfo
const settingsKeyMap = {
  mount: 'TelescopeSettings',
  focuser: 'FocuserSettings',
  rotator: 'RotatorSettings',
  flatdevice: 'FlatDeviceSettings',
  weather: 'WeatherDataSettings',
  filterwheel: 'FilterWheelSettings',
};

// Map equipment type to setting property prefixes
const settingsPrefixMap = {
  mount: {
    connection: 'IndiConnectionMode',
    port: 'IndiPort',
    baud: 'IndiBaudRate',
    address: 'IndiAddress',
    autoDetect: 'IndiAutoSearch',
  },
  focuser: {
    connection: 'IndiConnectionMode',
    port: 'IndiPort',
    baud: 'IndiBaudRate',
    address: 'IndiAddress',
    autoDetect: 'IndiAutoSearch',
  },
  rotator: {
    connection: 'IndiConnectionMode',
    port: 'IndiPort',
    baud: 'IndiBaudRate',
    address: 'IndiAddress',
    autoDetect: 'IndiAutoSearch',
  },
  flatdevice: {
    connection: 'IndiConnectionMode',
    port: 'IndiPort',
    baud: 'IndiBaudRate',
    address: 'IndiAddress',
    autoDetect: 'IndiAutoSearch',
  },
  weather: {
    connection: 'IndiConnectionMode',
    port: 'IndiPort',
    baud: 'IndiBaudRate',
    address: 'IndiAddress',
    autoDetect: 'IndiAutoSearch',
  },
  filterwheel: {
    connection: 'IndiConnectionMode',
    port: 'IndiPort',
    baud: 'IndiBaudRate',
    address: 'IndiAddress',
    autoDetect: 'IndiAutoSearch',
  },
};

const isEquipmentSelected = computed(() => {
  const deviceName = props.selectedDevice.toLowerCase();
  const equipInfo = equipmentInfoMap[props.equipmentType]?.();
  const driverInfo = equipInfo?.DriverInfo?.toLowerCase() || '';
  const category = equipInfo?.Category?.toLowerCase() || '';
  return deviceName.includes('indi') || driverInfo.includes('indi') || category.includes('indi');
});

const connectionMode = ref('CONNECTION_SERIAL');
const devicePort = ref('/dev/ttyUSB0');
const baudRate = ref(9600);
const ipAddress = ref('localhost');
const tcpPort = ref('3492');
const autoDetect = ref(false);
const availablePorts = ref([]);

const statusClassConnectionMode = ref('');
const statusClassDevicePort = ref('');
const statusClassBaudRate = ref('');
const statusClassIPAddress = ref('');
const statusClassTCPPort = ref('');

const initializeSettings = () => {
  const settingsKey = settingsKeyMap[props.equipmentType];
  const settings = store.profileInfo?.[settingsKey];

  if (!settings) {
    console.warn(`${settingsKey} not loaded`);
    return;
  }

  const prefix = settingsPrefixMap[props.equipmentType];

  if (prefix.connection) {
    connectionMode.value = settings[prefix.connection] ?? 'CONNECTION_SERIAL';
  }
  if (prefix.address) {
    ipAddress.value = settings[prefix.address] ?? 'localhost';
  }
  if (prefix.baud) {
    baudRate.value = settings[prefix.baud] ?? 9600;
  }
  if (prefix.autoDetect) {
    autoDetect.value = settings[prefix.autoDetect] ?? false;
  }

  // IndiPort is shared between serial and TCP, so load it into the appropriate field based on connection mode
  if (prefix.port) {
    const portValue = settings[prefix.port] ?? '3492';
    // If we're in TCP mode, load into tcpPort; otherwise, load into devicePort
    if (connectionMode.value === 'CONNECTION_TCP') {
      tcpPort.value = portValue;
      devicePort.value = '/dev/ttyUSB0'; // Set default for serial
    } else {
      devicePort.value = portValue;
      tcpPort.value = '3492'; // Keep default for TCP
    }
  }

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
    const prefix = settingsPrefixMap[props.equipmentType];
    await apiService.profileChangeValue(
      `${settingsKeyMap[props.equipmentType]}-${prefix.connection}`,
      connectionMode.value
    );

    // When switching modes, update the port setting to the appropriate value
    if (connectionMode.value === 'CONNECTION_TCP') {
      // Switching to TCP: save the TCP port
      await apiService.profileChangeValue(
        `${settingsKeyMap[props.equipmentType]}-${prefix.port}`,
        tcpPort.value
      );
    } else {
      // Switching to Serial: save the device port
      await apiService.profileChangeValue(
        `${settingsKeyMap[props.equipmentType]}-${prefix.port}`,
        devicePort.value
      );
    }

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
    const prefix = settingsPrefixMap[props.equipmentType];
    await apiService.profileChangeValue(
      `${settingsKeyMap[props.equipmentType]}-${prefix.port}`,
      devicePort.value
    );
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
    const prefix = settingsPrefixMap[props.equipmentType];
    await apiService.profileChangeValue(
      `${settingsKeyMap[props.equipmentType]}-${prefix.baud}`,
      baudRate.value
    );
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
    const prefix = settingsPrefixMap[props.equipmentType];
    await apiService.profileChangeValue(
      `${settingsKeyMap[props.equipmentType]}-${prefix.address}`,
      ipAddress.value
    );
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
    // Only save TCP port if we're actually in TCP mode
    if (connectionMode.value !== 'CONNECTION_TCP') {
      console.warn('Cannot set TCP port when not in TCP connection mode');
      return;
    }
    const prefix = settingsPrefixMap[props.equipmentType];
    await apiService.profileChangeValue(
      `${settingsKeyMap[props.equipmentType]}-${prefix.port}`,
      tcpPort.value
    );
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

async function setAutoDetect() {
  try {
    const prefix = settingsPrefixMap[props.equipmentType];
    if (!prefix.autoDetect) {
      console.warn('Auto detect not supported for this equipment');
      return;
    }
    await apiService.profileChangeValue(
      `${settingsKeyMap[props.equipmentType]}-${prefix.autoDetect}`,
      autoDetect.value
    );
  } catch (error) {
    console.error('Error setting auto detect:', error);
    autoDetect.value = !autoDetect.value; // revert on error
  }
}

onMounted(() => {
  initializeSettings();
});
</script>
