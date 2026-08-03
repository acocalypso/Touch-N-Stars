<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-xl font-semibold text-content">
        {{ t('components.pinsWizard.camera.title') }}
      </h2>
      <p class="text-sm text-content-muted mt-1">
        {{ t('components.pinsWizard.camera.description') }}
      </p>
    </div>

    <!-- 1. Device + connect. Natively supported cameras show up here without any
         INDI driver, so this comes first - the reverse of the mount step. -->
    <div class="flex flex-col gap-1">
      <span class="text-xs font-semibold uppercase text-content-muted">
        {{ t('components.pinsWizard.camera.connectDevice') }}
      </span>
      <selectDevices
        apiAction="cameraAction"
        :deviceName="$t('components.connectEquipment.camera.name')"
        :default-device-id="store.profileInfo?.CameraSettings?.Id"
        :isConnected="store.cameraInfo?.Connected"
        @open-config="openCameraSettings"
      />
    </div>

    <div
      v-if="store.cameraInfo?.Connected"
      class="flex items-start gap-3 rounded-control border border-status-ok/40 bg-status-ok/10 p-3"
    >
      <span class="tns-dot bg-status-ok mt-1.5"></span>
      <p class="text-sm text-content">
        {{ t('components.pinsWizard.camera.connected', { name: store.cameraInfo?.Name || '' }) }}
      </p>
    </div>

    <!-- 2. Only if the camera is not natively detected: pick an INDI driver. -->
    <button class="tns-btn-secondary" @click="showNotFound = !showNotFound">
      <ChevronDownIcon
        class="w-5 h-5 transition-transform"
        :class="{ 'rotate-180': showNotFound }"
      />
      {{ t('components.pinsWizard.camera.notFound') }}
    </button>

    <div v-if="showNotFound" class="flex flex-col gap-3">
      <p class="text-sm text-content-muted">
        {{ t('components.pinsWizard.camera.notFoundHint') }}
      </p>

      <IndiDriverSelect
        deviceType="camera"
        settingPath="CameraSettings-IndiDriver"
        listAction="cameraAction"
        rescanKey="camera"
        profileSection="CameraSettings"
        :label="t('components.pinsWizard.camera.selectDriver')"
      />

      <!-- The PINS daemon cannot install camera drivers: ALLOWED_INDI_DRIVER_TYPES
           covers filterwheel/flatpanel/focuser/rotator/switches/telescope/weather only. -->
      <p class="text-xs text-content-faint">
        {{ t('components.pinsWizard.camera.noThirdPartyHint') }}
      </p>
    </div>

    <!-- 3. Sensor geometry -->
    <CameraSensorSettings />

    <!-- Camera settings modal: unlike the mount there is no serial/INDI form here.
         zIndex must clear the wizard overlay (z-70) but stay under the PINS
         upgrade overlay (z-[80]) - all of these teleport to body. -->
    <Modal :show="showCameraSettings" zIndex="z-[75]" @close="showCameraSettings = false">
      <template #header>
        <h2 class="text-2xl font-semibold">{{ $t('components.alpacaDirect.title') }}</h2>
      </template>
      <template #body>
        <SettingsAlpacaDirect
          v-if="isAlpacaDirect(selectedCameraObj)"
          deviceType="camera"
          :selectedDevice="selectedCameraDevice"
          :deviceId="selectedCameraObj?.Id"
        />
        <p v-else class="text-sm text-gray-300">
          {{ $t('components.alpacaDirect.cameraNoSettings') }}
        </p>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronDownIcon } from '@heroicons/vue/24/outline';
import { apiStore } from '@/store/store';
import { useEquipmentStore } from '@/store/equipmentStore';
import Modal from '@/components/helpers/Modal.vue';
import selectDevices from '@/components/equipment/selectDevices.vue';
import SettingsAlpacaDirect from '@/components/equipment/SettingsAlpacaDirect.vue';
import IndiDriverSelect from '../IndiDriverSelect.vue';
import CameraSensorSettings from '../CameraSensorSettings.vue';

const emit = defineEmits(['completed']);
const { t } = useI18n();
const store = apiStore();
const equipmentStore = useEquipmentStore();

const showNotFound = ref(false);
const showCameraSettings = ref(false);
const selectedCameraDevice = ref('');
const selectedCameraObj = ref(null);

const isAlpacaDirect = (device) => device?.Category === 'ASCOM Alpaca';

function openCameraSettings(payload) {
  selectedCameraDevice.value = payload?.selectedDeviceDisplayName || '';
  selectedCameraObj.value = payload?.selectedDeviceObj || null;
  showCameraSettings.value = true;
}

watch(
  () => store.cameraInfo?.Connected,
  (connected) => {
    if (connected) emit('completed');
  },
  { immediate: true }
);

onMounted(async () => {
  // The wizard can open over any route, so the profile may be stale or unread.
  // Fetch it first, then reload the device list - selectDevices only resolves
  // its preselection once defaultDeviceId is current.
  await store.fetchProfilInfos();
  equipmentStore.triggerReload();
});
</script>
