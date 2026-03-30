<template>
  <!-- Connect/Disconnect All Buttons -->
  <div class="pb-5 flex gap-2">
    <!-- Connect All Button -->
    <button
      class="default-button-green flex-1"
      @click="connectAll"
      :disabled="isConnecting || allConnected"
    >
      <span>{{ $t('components.connectEquipment.connectAll') }}</span>
      <svg
        v-if="isConnecting"
        class="animate-spin h-5 w-5 text-white"
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

    <!-- Disconnect All Button -->
    <button
      class="default-button-red flex-1"
      @click="disconnectAll"
      :disabled="isDisconnecting || !hasAnyConnection"
    >
      <span>{{ $t('components.connectEquipment.disconnectAll') }}</span>
      <svg
        v-if="isDisconnecting"
        class="animate-spin h-5 w-5 text-white"
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
  <div class="flex flex-col gap-2">
    <selectDevices
      apiAction="cameraAction"
      :deviceName="$t('components.connectEquipment.camera.name')"
      :default-device-id="store.profileInfo?.CameraSettings?.Id"
      :isConnected="store.cameraInfo.Connected"
    />

    <selectDevices
      apiAction="mountAction"
      :deviceName="$t('components.connectEquipment.mount.name')"
      :default-device-id="store.profileInfo?.TelescopeSettings?.Id"
      :isConnected="store.mountInfo.Connected"
      @open-config="openMountSettings"
    />

    <selectDevices
      apiAction="focusAction"
      :deviceName="$t('components.connectEquipment.focuser.name')"
      :default-device-id="store.profileInfo?.FocuserSettings?.Id"
      :isConnected="store.focuserInfo.Connected"
      @open-config="openFocuserSettings"
    />

    <selectGuiderCam
      v-if="store.isPINS"
      :deviceName="$t('components.connectEquipment.guiderCam.name')"
    />

    <selectDevices
      apiAction="guiderAction"
      :deviceName="$t('components.connectEquipment.guider.name')"
      :default-device-id="store.profileInfo?.GuiderSettings?.GuiderName"
      :isConnected="store.guiderInfo.Connected"
      :disableConnect="isGuiderConnectDisabled"
      :disableConnectMessage="guiderDisabledMessage"
      @device-selected="selectedGuiderDevice = $event"
      @open-config="openGuiderSettings"
    />

    <selectDevices
      apiAction="filterAction"
      :deviceName="$t('components.connectEquipment.filter.name')"
      :default-device-id="store.profileInfo?.FilterWheelSettings?.Id"
      :isConnected="store.filterInfo.Connected"
      @open-config="openFilterSettings"
    />

    <selectDevices
      apiAction="rotatorAction"
      :deviceName="$t('components.connectEquipment.rotator.name')"
      :default-device-id="store.profileInfo?.RotatorSettings?.Id"
      :isConnected="store.rotatorInfo.Connected"
      @open-config="openRotatorSettings"
    />

    <selectDevices
      apiAction="weatherAction"
      :deviceName="$t('components.connectEquipment.weather.name')"
      :default-device-id="store.profileInfo?.WeatherDataSettings?.Id"
      :isConnected="store.weatherInfo.Connected"
      :alwaysEnableConfig="weatherHasApiKeySettings"
      @device-selected="selectedWeatherDeviceName = $event"
      @open-config="openWeatherSettings"
    />

    <selectDevices
      apiAction="safetyAction"
      :deviceName="$t('components.connectEquipment.safety.name')"
      :default-device-id="store.profileInfo?.SafetyMonitorSettings?.Id"
      :isConnected="store.safetyInfo.Connected"
    />

    <selectDevices
      apiAction="flatdeviceAction"
      :deviceName="$t('components.connectEquipment.flat.name')"
      :default-device-id="store.profileInfo?.FlatDeviceSettings?.Id"
      :isConnected="store.flatdeviceInfo.Connected"
      @open-config="openFlatDeviceSettings"
    />

    <selectDevices
      apiAction="domeAction"
      :deviceName="$t('components.connectEquipment.dome.name')"
      :default-device-id="store.profileInfo?.DomeSettings?.Id"
      :isConnected="store.domeInfo.Connected"
    />

    <selectDevices
      apiAction="switchAction"
      :deviceName="$t('components.connectEquipment.switch.name')"
      :default-device-id="store.profileInfo?.SwitchSettings?.Id"
      :isConnected="store.switchInfo.Connected"
    />
  </div>

  <!-- Guider Settings Modal -->
  <Modal :show="showGuiderSettings" @close="showGuiderSettings = false">
    <template #header>
      <h2 class="text-2xl font-semibold">{{ $t('components.guider.settings') }}</h2>
    </template>
    <template #body>
      <settingsGuiderConnect :selectedGuiderDevice="selectedGuiderDevice" />
    </template>
  </Modal>

  <!-- Mount Settings Modal -->
  <Modal :show="showMountSettings" @close="showMountSettings = false">
    <template #header>
      <h2 class="text-2xl font-semibold">{{ $t('components.mount.indi.settings') }}</h2>
    </template>
    <template #body>
      <SettingsSerialConnection equipmentType="mount" :selectedDevice="selectedMountDevice" />
    </template>
  </Modal>

  <!-- Focuser Settings Modal -->
  <Modal :show="showFocuserSettings" @close="showFocuserSettings = false">
    <template #header>
      <h2 class="text-2xl font-semibold">{{ $t('components.focuser.indi.settings') }}</h2>
    </template>
    <template #body>
      <SettingsSerialConnection equipmentType="focuser" :selectedDevice="selectedFocuserDevice" />
    </template>
  </Modal>

  <!-- Rotator Settings Modal -->
  <Modal :show="showRotatorSettings" @close="showRotatorSettings = false">
    <template #header>
      <h2 class="text-2xl font-semibold">{{ $t('components.rotator.indi.settings') }}</h2>
    </template>
    <template #body>
      <SettingsSerialConnection equipmentType="rotator" :selectedDevice="selectedRotatorDevice" />
    </template>
  </Modal>

  <!-- FlatDevice Settings Modal -->
  <Modal :show="showFlatDeviceSettings" @close="showFlatDeviceSettings = false">
    <template #header>
      <h2 class="text-2xl font-semibold">{{ $t('components.flat.indi.settings') }}</h2>
    </template>
    <template #body>
      <SettingsSerialConnection
        equipmentType="flatdevice"
        :selectedDevice="selectedFlatDeviceDevice"
      />
    </template>
  </Modal>

  <!-- Filter Settings Modal -->
  <Modal :show="showFilterSettings" @close="showFilterSettings = false">
    <template #header>
      <h2 class="text-2xl font-semibold">{{ $t('components.filterwheel.indi.settings') }}</h2>
    </template>
    <template #body>
      <SettingsSerialConnection
        equipmentType="filterwheel"
        :selectedDevice="selectedFilterDevice"
      />
    </template>
  </Modal>

  <!-- Weather Settings Modal -->
  <Modal :show="showWeatherSettings" @close="showWeatherSettings = false">
    <template #header>
      <h2 class="text-2xl font-semibold">{{ $t('components.weatherModal.indi.settings') }}</h2>
    </template>
    <template #body>
      <SettingsWeather :selectedDevice="selectedWeatherDevice" />
    </template>
  </Modal>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';
import { useGuiderStore } from '@/store/guiderStore';
import apiService from '@/services/apiService';
import selectDevices from '@/components/equipment/selectDevices.vue';
import selectGuiderCam from '@/components/guider/PHD2/selectGuiderCam.vue';
import Modal from '@/components/helpers/Modal.vue';
import settingsGuiderConnect from '@/components/guider/settingsGuiderConnect.vue';
import SettingsSerialConnection from '@/components/equipment/SettingsSerialConnection.vue';
import SettingsWeather from '@/components/equipment/SettingsWeather.vue';
import { checkMountConnectionPermission } from '@/utils/locationSyncUtils';

const { t } = useI18n();
const store = apiStore();
const guiderStore = useGuiderStore();
const isConnecting = ref(false);
const isDisconnecting = ref(false);
const showGuiderSettings = ref(false);
const selectedGuiderDevice = ref('');
const showMountSettings = ref(false);
const selectedMountDevice = ref('');
const showFocuserSettings = ref(false);
const selectedFocuserDevice = ref('');
const showRotatorSettings = ref(false);
const selectedRotatorDevice = ref('');
const showFlatDeviceSettings = ref(false);
const selectedFlatDeviceDevice = ref('');
const showFilterSettings = ref(false);
const selectedFilterDevice = ref('');
const showWeatherSettings = ref(false);
const selectedWeatherDevice = ref('');
const selectedWeatherDeviceName = ref(store.profileInfo?.WeatherDataSettings?.Id || '');

const WEATHER_API_KEY_DEVICES = ['OpenWeatherMap', 'TheWeatherCompany', 'Weather Underground'];
const weatherHasApiKeySettings = computed(() =>
  WEATHER_API_KEY_DEVICES.includes(selectedWeatherDeviceName.value)
);

const isGuiderConnectDisabled = computed(() => {
  return (
    selectedGuiderDevice.value === 'PHD2' &&
    store.isPINS &&
    (!store.mountInfo.Connected || !guiderStore.guidecamOk)
  );
});

const guiderDisabledMessage = computed(() => {
  if (selectedGuiderDevice.value !== 'PHD2' || !store.isPINS) return '';
  const messages = [];
  if (!store.mountInfo.Connected)
    messages.push(t('components.connectEquipment.guider.mountRequired'));
  if (!guiderStore.guidecamOk)
    messages.push(t('components.connectEquipment.guider.guideCamRequired'));
  return messages.join(' ');
});

const openGuiderSettings = (payload) => {
  selectedGuiderDevice.value = payload?.selectedDeviceDisplayName || '';
  showGuiderSettings.value = true;
};

const openMountSettings = (payload) => {
  selectedMountDevice.value = payload?.selectedDeviceDisplayName || '';
  showMountSettings.value = true;
};

const openFocuserSettings = (payload) => {
  selectedFocuserDevice.value = payload?.selectedDeviceDisplayName || '';
  showFocuserSettings.value = true;
};

const openRotatorSettings = (payload) => {
  selectedRotatorDevice.value = payload?.selectedDeviceDisplayName || '';
  showRotatorSettings.value = true;
};

const openFlatDeviceSettings = (payload) => {
  selectedFlatDeviceDevice.value = payload?.selectedDeviceDisplayName || '';
  showFlatDeviceSettings.value = true;
};

const openFilterSettings = (payload) => {
  selectedFilterDevice.value = payload?.selectedDeviceDisplayName || '';
  showFilterSettings.value = true;
};

const openWeatherSettings = (payload) => {
  selectedWeatherDevice.value = payload?.selectedDeviceDisplayName || '';
  showWeatherSettings.value = true;
};

const allConnected = computed(() => {
  return store.existingEquipmentList.every((device) => {
    switch (device.apiName) {
      case 'camera':
        return store.cameraInfo.Connected;
      case 'mount':
        return store.mountInfo.Connected;
      case 'filter':
        return store.filterInfo.Connected;
      case 'focuser':
        return store.focuserInfo.Connected;
      case 'rotator':
        return store.rotatorInfo.Connected;
      case 'guider':
        return store.guiderInfo.Connected;
      case 'safety':
        return store.safetyInfo.Connected;
      case 'flatdevice':
        return store.flatdeviceInfo.Connected;
      case 'dome':
        return store.domeInfo.Connected;
      case 'weather':
        return store.weatherInfo.Connected;
      case 'switch':
        return store.switchInfo.Connected;
      default:
        return false;
    }
  });
});

const hasAnyConnection = computed(() => {
  return store.existingEquipmentList.some((device) => {
    switch (device.apiName) {
      case 'camera':
        return store.cameraInfo.Connected;
      case 'mount':
        return store.mountInfo.Connected;
      case 'filter':
        return store.filterInfo.Connected;
      case 'focuser':
        return store.focuserInfo.Connected;
      case 'rotator':
        return store.rotatorInfo.Connected;
      case 'guider':
        return store.guiderInfo.Connected;
      case 'safety':
        return store.safetyInfo.Connected;
      case 'flatdevice':
        return store.flatdeviceInfo.Connected;
      case 'dome':
        return store.domeInfo.Connected;
      case 'weather':
        return store.weatherInfo.Connected;
      case 'switch':
        return store.switchInfo.Connected;
      default:
        return false;
    }
  });
});

async function connectAll() {
  isConnecting.value = true;
  try {
    for (const device of store.existingEquipmentList) {
      switch (device.apiName) {
        case 'camera':
          await apiService.cameraAction('connect');
          break;
        case 'mount':
          const canConnect = await checkMountConnectionPermission(t);
          if (!canConnect) {
            // Benutzer hat abgebrochen
            return;
          }
          await apiService.mountAction('connect');
          break;
        case 'filter':
          await apiService.filterAction('connect');
          break;
        case 'focuser':
          await apiService.focusAction('connect');
          break;
        case 'rotator':
          await apiService.rotatorAction('connect');
          break;
        case 'guider':
          if (store.isPINS) {
            if (!store.mountInfo.Connected || !guiderStore.guidecamOk) {
              console.warn(
                '[Connect Equipment] Mount must be connected or guide camera must be match before connecting guider in PINS mode'
              );
              continue;
            }
          }
          await apiService.guiderAction('connect');
          break;
        case 'safety':
          await apiService.safetyAction('connect');
          break;
        case 'flatdevice':
          await apiService.flatdeviceAction('connect');
          break;
        case 'dome':
          await apiService.domeAction('connect');
          break;
        case 'weather':
          await apiService.weatherAction('connect');
          break;
        case 'switch':
          await apiService.switchAction('connect');
          break;
      }
    }
  } catch (error) {
    console.error(t('components.connectEquipment.connectAllError'), error);
  } finally {
    isConnecting.value = false;
  }
}

async function disconnectAll() {
  isDisconnecting.value = true;
  try {
    for (const device of store.existingEquipmentList) {
      switch (device.apiName) {
        case 'camera':
          await apiService.cameraAction('disconnect');
          break;
        case 'mount':
          await apiService.mountAction('disconnect');
          break;
        case 'filter':
          await apiService.filterAction('disconnect');
          break;
        case 'focuser':
          await apiService.focusAction('disconnect');
          break;
        case 'rotator':
          await apiService.rotatorAction('disconnect');
          break;
        case 'guider':
          await apiService.guiderAction('disconnect');
          break;
        case 'safety':
          await apiService.safetyAction('disconnect');
          break;
        case 'flatdevice':
          await apiService.flatdeviceAction('disconnect');
          break;
        case 'dome':
          await apiService.domeAction('disconnect');
          break;
        case 'weather':
          await apiService.weatherAction('disconnect');
          break;
        case 'switch':
          await apiService.switchAction('disconnect');
          break;
      }
    }
  } catch (error) {
    console.error(t('components.connectEquipment.disconnectAllError'), error);
  } finally {
    isDisconnecting.value = false;
  }
}
</script>
