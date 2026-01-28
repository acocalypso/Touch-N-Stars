<template>
  <div
    :class="borderClass"
    class="flex flex-col sm:flex-row border p-2 rounded-lg h-full gap-2 sm:items-center transition-all duration-300"
  >
    <label class="text-sm sm:w-36 shrink-0" for="deviceSelect">{{ deviceName }}:</label>
    <div class="flex gap-2 items-center w-full">
      <select
        id="deviceSelect"
        class="w-full default-select min-w-0"
        v-model="selectedDevice"
        :disabled="isConnected"
      >
        <option disabled>{{ selectedDevice }}</option>
        <option
          v-for="device in devices"
          :key="device.DisplayName"
          :value="String(device.DisplayName)"
        >
          {{ device.DisplayName }}
        </option>
      </select>
      <div class="flex shrink-0 gap-1">
      <button
        v-if="store.isPINS"
        @click="configDevice"
        :disabled="
          isScanning || isConnected || !(selectedDeviceObj && selectedDeviceObj.HasSetupDialog)
        "
        class="flex justify-center items-center w-10 h-10 border border-cyan-500/20 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-70"
      >
        <Cog6ToothIcon
          class="w-6 h-6"
          :class="{
            'text-gray-400':
              isScanning || isConnected || !(selectedDeviceObj && selectedDeviceObj.HasSetupDialog),
          }"
        />
      </button>
      <button
        @click="rescanDevices"
        :disabled="isScanning || isConnected"
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

    <!-- Modal entfernt - verwendet jetzt toastModal -->
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import apiService from '@/services/apiService';
import { ArrowPathIcon, LinkIcon, LinkSlashIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useI18n } from 'vue-i18n';
import { checkMountConnectionPermission } from '@/utils/locationSyncUtils';
import { apiStore } from '@/store/store';

const equipmentStore = useEquipmentStore();
const store = apiStore();
const { t } = useI18n();

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
const borderClass = ref('border-gray-500');

const selectedDeviceObj = computed(() =>
  devices.value.find((d) => d.DisplayName === selectedDevice.value)
);

// Funktion für API-Aufruf mit dynamischem `apiAction` mit Retry bei Backend-Neustart
async function getDevices(retryCount = 0, maxRetries = 3, delayMs = 1000) {
  error.value = false;

  // Prüfung ob apiAction definiert ist
  if (!props.apiAction) {
    console.error('apiAction is not defined');
    return;
  }

  const apiName = props.apiAction.replace('Action', '');
  if (
    Array.isArray(equipmentStore.availableDevices[apiName]) &&
    equipmentStore.availableDevices[apiName].length > 0
  ) {
    devices.value = equipmentStore.availableDevices[apiName];
    console.log(`[${apiName}] Devices loaded from store`);
    return;
  }
  isScanning.value = true;
  try {
    if (!apiService[props.apiAction]) {
      throw new Error(`Invalid API method: ${props.apiAction}`);
    }
    const response = await apiService[props.apiAction]('list-devices');
    if (response.Error) {
      // Retry bei Fehler (Backend könnte noch nicht vollständig initialisiert sein)
      if (retryCount < maxRetries) {
        console.warn(
          `[${apiName}] API Error, retrying in ${delayMs}ms... (${retryCount + 1}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return getDevices(retryCount + 1, maxRetries, delayMs);
      }
      error.value = true;
      console.error('API Error:', response.Error);
      return;
    }

    if (Array.isArray(response.Response)) {
      devices.value = response.Response;
      equipmentStore.availableDevices[apiName] = response.Response;
    } else {
      error.value = true;
      console.error('Faulty API response:', response);
    }
  } catch (err) {
    // Retry bei Fehler (Backend könnte noch nicht vollständig initialisiert sein)
    if (retryCount < maxRetries) {
      console.warn(
        `[${apiName}] Error, retrying in ${delayMs}ms... (${retryCount + 1}/${maxRetries})`,
        err.message
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return getDevices(retryCount + 1, maxRetries, delayMs);
    }
    error.value = true;
    console.error('Error:', err);
  } finally {
    isScanning.value = false;
  }
}

const emit = defineEmits(['openConfig']);

async function configDevice() {
  emit('openConfig', {
    deviceName: props.deviceName,
    apiAction: props.apiAction,
    selectedDeviceDisplayName: selectedDevice.value,
  });
}

async function rescanDevices() {
  // Prüfung ob apiAction definiert ist
  if (!props.apiAction) {
    console.error('apiAction is not defined');
    return;
  }

  const apiName = props.apiAction.replace('Action', '');
  error.value = false;
  console.log('scan');
  isScanning.value = true;
  try {
    if (!apiService[props.apiAction]) {
      throw new Error(`Invalid API method: ${props.apiAction}`);
    }
    const response = await apiService[props.apiAction]('rescan');
    console.log(response);
    isScanning.value = false;
    if (response.Error) {
      error.value = true;
      console.error('API Error:', response.Error);
      isScanning.value = false;
      return;
    }

    if (Array.isArray(response.Response)) {
      devices.value = response.Response;
      equipmentStore.availableDevices[apiName] = response.Response;
    } else {
      error.value = true;
      console.error('Faulty API response:', response);
    }
  } catch (err) {
    error.value = true;
    console.error('Error:', err);
  }
}

async function toggleConnection() {
  error.value = false;
  isToggleCon.value = true;

  const deviceId = getDeviceId(selectedDevice.value);
  const encodedId = encodeURIComponent(deviceId);
  console.log('props.apiAction', props.apiAction);

  try {
    if (props.isConnected) {
      console.log('disconnect');
      const response = await apiService[props.apiAction]('disconnect');
      if (deviceId == 'PHD2_Single') {
        await apiService.disconnectPHD2();
      }
      console.log('response', response);
    } else {
      // Prüfung vor dem Verbinden der Montierung
      if (props.apiAction === 'mountAction') {
        const canConnect = await checkMountConnectionPermission(t);
        if (!canConnect) {
          // Benutzer hat abgebrochen
          return;
        }
      }
      console.log('connect to', selectedDevice.value, 'ID:', deviceId);
      const response = await apiService[props.apiAction]('connect?to=' + encodedId);
      console.log('response', response);
      if (deviceId == 'PHD2_Single') {
        await apiService.connectPHD2();
      }

      if (!response.Success) {
        throw new Error(response.Error || 'Unbekannter Verbindungsfehler');
      }
    }
  } catch (err) {
    error.value = true;
    console.error('Error connect device: ', err);
  } finally {
    isToggleCon.value = false;
    updateBorderClass();
  }
}

function updateBorderClass() {
  if (error.value) {
    borderClass.value = 'border-red-500 error-glow';
  } else if (props.isConnected) {
    borderClass.value = 'border-green-500 connected-glow';
  } else {
    borderClass.value = 'border-gray-500';
  }
}

function getDeviceName(deviceId) {
  const device = devices.value.find((d) => String(d.Id) === String(deviceId));
  return device ? device.DisplayName : '';
}

function getDeviceId(deviceName) {
  const device = devices.value.find((d) => d.DisplayName === deviceName);
  return device ? String(device.Id) : '';
}

watch(
  () => props.isConnected,
  () => {
    console.log('isConnected', props.deviceName);
    isToggleCon.value = false;
    updateBorderClass();
  }
);
watch(
  () => props.defaultDeviceId,
  (newValues) => {
    selectedDevice.value = getDeviceName(newValues);
    updateBorderClass();
  }
);

watch(
  () => equipmentStore.rescanTrigger[props.apiAction.replace('Action', '')],
  (newValue, oldValue) => {
    if (newValue > 0 && newValue !== oldValue) {
      rescanDevices();
    }
  }
);

onMounted(async () => {
  await getDevices();
  selectedDevice.value = props.defaultDeviceId;
  selectedDevice.value = getDeviceName(selectedDevice.value);
  updateBorderClass();
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

.warning-glow {
  box-shadow: 0 0 6px rgba(245, 91, 2, 0.925);
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
