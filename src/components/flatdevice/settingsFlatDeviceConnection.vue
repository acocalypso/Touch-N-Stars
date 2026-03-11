<template>
  <div
    v-if="isFlatDeviceSelected"
    class="flex flex-col border border-gray-500 p-1 md:p-2 rounded-lg"
  >
    <!-- Device Port -->
    <div class="flex flex-row items-center justify-between w-full">
      <label for="portName" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.flatdevice.config.port') }}
      </label>
      <select
        id="portName"
        v-model="portName"
        @change="setPortName"
        class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
        :class="statusClassPortName"
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const props = defineProps({
  selectedFlatDeviceDevice: { type: String, default: '' },
});

const store = apiStore();

const isFlatDeviceSelected = computed(() => {
  const deviceName = props.selectedFlatDeviceDevice.toLowerCase();
  const driverInfo = store.flatDeviceInfo?.DriverInfo?.toLowerCase() || '';
  const category = store.flatDeviceInfo?.Category?.toLowerCase() || '';
  return deviceName.includes('indi') || driverInfo.includes('indi') || category.includes('indi');
});

const portName = ref('/dev/ttyUSB0');
const availablePorts = ref([]);
const statusClassPortName = ref('');

const initializeSettings = () => {
  if (!store.profileInfo?.FlatDeviceSettings) {
    console.warn('FlatDeviceSettings not loaded');
    return;
  }

  portName.value = store.profileInfo.FlatDeviceSettings.PortName ?? '/dev/ttyUSB0';
  fetchAvailablePorts();
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

async function setPortName() {
  try {
    await apiService.profileChangeValue('FlatDeviceSettings-PortName', portName.value);
    statusClassPortName.value = 'glow-green';
  } catch (error) {
    console.error('Error setting port name:', error);
    statusClassPortName.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassPortName.value = '';
    }, 2000);
  }
}

onMounted(() => {
  initializeSettings();
});
</script>
