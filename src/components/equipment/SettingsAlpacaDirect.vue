<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col border border-gray-500 p-1 md:p-2 rounded-lg gap-2">
      <h4 class="text-sm font-semibold text-gray-200">
        {{ $t('components.alpacaDirect.title') }}
      </h4>

      <p v-if="isSharedGuid" class="text-xs text-yellow-400">
        {{ $t('components.alpacaDirect.sharedGuidWarning') }}
      </p>

      <p class="text-xs text-gray-400">
        {{ $t('components.alpacaDirect.noReconnectHint') }}
      </p>

      <div class="flex flex-row items-center justify-between w-full mt-2">
        <label for="adIpAddress" class="text-xs md:text-sm text-gray-200 mr-2 shrink-0">
          {{ $t('components.alpacaDirect.ipAddress') }}
        </label>
        <input
          id="adIpAddress"
          v-model="ipAddress"
          type="text"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
          :disabled="isLoading"
        />
      </div>

      <div class="flex flex-row items-center justify-between w-full">
        <label for="adPort" class="text-xs md:text-sm text-gray-200 mr-2 shrink-0">
          {{ $t('components.alpacaDirect.port') }}
        </label>
        <input
          id="adPort"
          v-model.number="port"
          type="number"
          min="1"
          max="65535"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
          :disabled="isLoading"
        />
      </div>

      <div class="flex flex-row items-center justify-between w-full">
        <label for="adDeviceNumber" class="text-xs md:text-sm text-gray-200 mr-2 shrink-0">
          {{ $t('components.alpacaDirect.deviceNumber') }}
        </label>
        <input
          id="adDeviceNumber"
          v-model.number="deviceNumber"
          type="number"
          min="0"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
          :disabled="isLoading"
        />
      </div>

      <div class="flex flex-row items-center justify-between w-full">
        <label for="adServiceType" class="text-xs md:text-sm text-gray-200 mr-2 shrink-0">
          {{ $t('components.alpacaDirect.serviceType') }}
        </label>
        <select
          id="adServiceType"
          v-model="serviceType"
          class="default-input h-7 md:h-8 text-xs md:text-sm w-48"
          :disabled="isLoading"
        >
          <option value="Http">Http</option>
          <option value="Https">Https</option>
        </select>
      </div>

      <p v-if="errorMessage" class="text-xs text-red-400 mt-1">{{ errorMessage }}</p>

      <div class="flex justify-end mt-2">
        <button
          class="default-button-cyan h-8 px-4 text-xs md:text-sm"
          :class="statusClassSave"
          :disabled="isLoading || isSaving"
          @click="save"
        >
          {{ $t('components.alpacaDirect.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import apiService from '@/services/apiService';

const props = defineProps({
  deviceType: { type: String, required: true },
  selectedDevice: { type: String, default: '' },
});

const ipAddress = ref('127.0.0.1');
const port = ref(5000);
const deviceNumber = ref(0);
const serviceType = ref('Http');

const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const statusClassSave = ref('');

const isSharedGuid = computed(
  () => props.deviceType === 'rotator' || props.deviceType === 'safetymonitor'
);

function applyGlowFeedback(success) {
  statusClassSave.value = success ? 'glow-green' : 'glow-red';
  setTimeout(() => {
    statusClassSave.value = '';
  }, 2000);
}

async function loadSettings() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiService.getAlpacaDirectSettings(props.deviceType);
    const data = response?.Response;
    if (response?.Success && data) {
      ipAddress.value = data.IpAddress ?? '127.0.0.1';
      port.value = data.Port ?? 5000;
      deviceNumber.value = data.DeviceNumber ?? 0;
      serviceType.value = data.ServiceType ?? 'Http';
    } else if (response?.Error) {
      errorMessage.value = response.Error;
    }
  } catch (err) {
    errorMessage.value = err?.response?.data?.Error || err?.message || 'Unknown error';
  } finally {
    isLoading.value = false;
  }
}

async function save() {
  isSaving.value = true;
  errorMessage.value = '';
  try {
    const response = await apiService.setAlpacaDirectSettings(props.deviceType, {
      IpAddress: ipAddress.value,
      Port: port.value,
      DeviceNumber: deviceNumber.value,
      ServiceType: serviceType.value,
    });
    if (response?.Success) {
      const data = response.Response;
      if (data) {
        ipAddress.value = data.IpAddress ?? ipAddress.value;
        port.value = data.Port ?? port.value;
        deviceNumber.value = data.DeviceNumber ?? deviceNumber.value;
        serviceType.value = data.ServiceType ?? serviceType.value;
      }
      applyGlowFeedback(true);
    } else {
      errorMessage.value = response?.Error || 'Failed to save settings.';
      applyGlowFeedback(false);
    }
  } catch (err) {
    errorMessage.value = err?.response?.data?.Error || err?.message || 'Unknown error';
    applyGlowFeedback(false);
  } finally {
    isSaving.value = false;
  }
}

watch(
  () => props.deviceType,
  () => {
    loadSettings();
  }
);

onMounted(() => {
  loadSettings();
});
</script>
