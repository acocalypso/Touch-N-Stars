<template>
  <!-- Toggle All Connections Button -->
  <div class="pb-5">
    <button
      class="px-4 py-2 rounded transition-colors flex items-center justify-center gap-2 w-full"
      :class="allConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'"
      @click="toggleAllConnections"
      :disabled="isLoading"
    >
      <span>{{
        allConnected
          ? $t('components.connectEquipment.disconnectAll')
          : $t('components.connectEquipment.connectAll')
      }}</span>
      <svg
        v-if="isLoading"
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
      :default-device-id="store.profileInfo.CameraSettings.Id"
      :isConnected="store.cameraInfo.Connected"
    />

    <selectDevices
      apiAction="mountAction"
      :deviceName="$t('components.connectEquipment.mount.name')"
      :default-device-id="store.profileInfo.TelescopeSettings.Id"
      :isConnected="store.mountInfo.Connected"
    />

    <selectDevices
      apiAction="focusAction"
      :deviceName="$t('components.connectEquipment.focuser.name')"
      :default-device-id="store.profileInfo.FocuserSettings.Id"
      :isConnected="store.focuserInfo.Connected"
    />

    <selectDevices
      apiAction="guiderAction"
      :deviceName="$t('components.connectEquipment.guider.name')"
      :default-device-id="store.profileInfo.GuiderSettings.GuiderName"
      :isConnected="store.guiderInfo.Connected"
    />

    <selectDevices
      apiAction="filterAction"
      :deviceName="$t('components.connectEquipment.filter.name')"
      :default-device-id="store.profileInfo.FilterWheelSettings.Id"
      :isConnected="store.filterInfo.Connected"
    />

    <selectDevices
      apiAction="rotatorAction"
      :deviceName="$t('components.connectEquipment.rotator.name')"
      :default-device-id="store.profileInfo.RotatorSettings.Id"
      :isConnected="store.rotatorInfo.Connected"
    />

    <selectDevices
      apiAction="weatherAction"
      :deviceName="$t('components.connectEquipment.weather.name')"
      :default-device-id="store.profileInfo.WeatherDataSettings.Id"
      :isConnected="store.weatherInfo.Connected"
    />

    <selectDevices
      apiAction="safetyAction"
      :deviceName="$t('components.connectEquipment.safety.name')"
      :default-device-id="store.profileInfo.SafetyMonitorSettings.Id"
      :isConnected="store.safetyInfo.Connected"
    />

    <selectDevices
      apiAction="flatdeviceAction"
      :deviceName="$t('components.connectEquipment.flat.name')"
      :default-device-id="store.profileInfo.FlatDeviceSettings.Id"
      :isConnected="store.flatdeviceInfo.Connected"
    />

    <selectDevices
      apiAction="domeAction"
      :deviceName="$t('components.connectEquipment.dome.name')"
      :default-device-id="store.profileInfo.DomeSettings.Id"
      :isConnected="store.domeInfo.Connected"
    />

    <selectDevices
      apiAction="switchAction"
      :deviceName="$t('components.connectEquipment.switch.name')"
      :default-device-id="store.profileInfo.SwitchSettings.Id"
      :isConnected="store.switchInfo.Connected"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import selectDevices from '@/components/equipment/selectDevices.vue';
import { checkMountConnectionPermission } from '@/utils/locationSyncUtils';

const { t } = useI18n();
const store = apiStore();
const isLoading = ref(false);

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

async function toggleAllConnections() {
  isLoading.value = true;
  try {
    if (allConnected.value) {
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
    } else {
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
    }
  } catch (error) {
    console.error(
      allConnected.value
        ? t('components.connectEquipment.disconnectAllError')
        : t('components.connectEquipment.connectAllError'),
      error
    );
  } finally {
    isLoading.value = false;
  }
}
</script>
