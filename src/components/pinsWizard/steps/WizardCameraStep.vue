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
    <button class="tns-btn-secondary" @click="toggleNotFound">
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
        ref="driverSelect"
        deviceType="camera"
        settingPath="CameraSettings-IndiDriver"
        listAction="cameraAction"
        rescanKey="camera"
        profileSection="CameraSettings"
        :label="t('components.pinsWizard.camera.selectDriver')"
      />

      <p class="text-sm text-content-muted">
        {{ t('components.pinsWizard.camera.thirdPartyHint') }}
      </p>

      <PinsIndi3rdpartyCard
        :drivers="drivers"
        :loading="isLoadingDrivers"
        :installing="isInstalling"
        :search-query="searchQuery"
        :selected-asset="selectedAsset"
        @refresh="loadDrivers"
        @search="loadDrivers"
        @install="openInstallModal"
        @edit-config="showRegistryModal = true"
        @update:search-query="searchQuery = $event"
        @update:selected-asset="selectedAsset = $event"
      />

      <p v-if="installStatus" class="text-sm text-content-muted break-words">{{ installStatus }}</p>
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

    <PinsIndiInstallConfirmModal
      :show="showInstallModal"
      :selected-item="selectedDriver"
      :installing="isInstalling"
      :error-message="installError"
      zIndex="z-[75]"
      @close="closeInstallModal"
      @confirm="installDriver"
    />

    <PinsIndiRegistryEditModal
      :show="showRegistryModal"
      zIndex="z-[75]"
      @close="showRegistryModal = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronDownIcon } from '@heroicons/vue/24/outline';
import apiPinsService from '@/services/apiPinsService';
import { apiStore } from '@/store/store';
import { useEquipmentStore } from '@/store/equipmentStore';
import Modal from '@/components/helpers/Modal.vue';
import selectDevices from '@/components/equipment/selectDevices.vue';
import SettingsAlpacaDirect from '@/components/equipment/SettingsAlpacaDirect.vue';
import IndiDriverSelect from '../IndiDriverSelect.vue';
import CameraSensorSettings from '../CameraSensorSettings.vue';
import PinsIndi3rdpartyCard from '@/plugins/pins/components/PinsIndi3rdpartyCard.vue';
import PinsIndiInstallConfirmModal from '@/plugins/pins/components/PinsIndiInstallConfirmModal.vue';
import PinsIndiRegistryEditModal from '@/plugins/pins/components/PinsIndiRegistryEditModal.vue';
import {
  buildIndiInstallPayload,
  extractIndiInstallErrorDetail,
  parseIndiInstallJobId,
} from '@/plugins/pins/composables/indiInstallUtils';
import { pollJobUntilFinished } from '@/plugins/pins/composables/pinsJobPolling';

const emit = defineEmits(['completed']);
const { t } = useI18n();
const store = apiStore();
const equipmentStore = useEquipmentStore();

const driverSelect = ref(null);
const showNotFound = ref(false);
const showCameraSettings = ref(false);
const selectedCameraDevice = ref('');
const selectedCameraObj = ref(null);

const drivers = ref([]);
const isLoadingDrivers = ref(false);
const searchQuery = ref('');
const selectedAsset = ref('');
const showInstallModal = ref(false);
const showRegistryModal = ref(false);
const isInstalling = ref(false);
const installError = ref('');
const installStatus = ref('');

const selectedDriver = computed(
  () => drivers.value.find((pkg) => pkg.assetName === selectedAsset.value) || null
);

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

function toggleNotFound() {
  showNotFound.value = !showNotFound.value;
  // Fetch once on first expand so the whole panel is populated when it opens.
  if (showNotFound.value && !drivers.value.length) {
    if (!searchQuery.value) searchQuery.value = 'camera';
    loadDrivers();
  }
}

async function loadDrivers() {
  if (isLoadingDrivers.value) return;
  isLoadingDrivers.value = true;
  try {
    const response = await apiPinsService.getPinsIndi3rdpartyPackages({
      onlyNotInstalled: true,
      q: searchQuery.value?.trim() || undefined,
    });
    const packages = response?.packages || [];
    drivers.value = packages;
    if (!packages.some((pkg) => pkg.assetName === selectedAsset.value)) {
      selectedAsset.value = packages[0]?.assetName || '';
    }
  } catch (error) {
    console.error('[PinsWizard] 3rd party driver list failed:', error);
    installStatus.value = t('components.pinsWizard.driver.listFailed', {
      message: error.message,
    });
  } finally {
    isLoadingDrivers.value = false;
  }
}

function openInstallModal() {
  if (isInstalling.value || !selectedDriver.value) return;
  installError.value = '';
  showInstallModal.value = true;
}

function closeInstallModal() {
  if (isInstalling.value) return;
  showInstallModal.value = false;
  installError.value = '';
}

async function installDriver(formInput) {
  if (isInstalling.value || !selectedDriver.value) return;

  let payload;
  try {
    payload = buildIndiInstallPayload(selectedDriver.value, formInput || {});
  } catch (error) {
    installError.value = error.message;
    return;
  }

  isInstalling.value = true;
  installError.value = '';
  installStatus.value = t('components.pinsWizard.camera.installing', { label: payload.label });

  try {
    const data = await apiPinsService.installPinsIndi3rdparty(payload);
    const jobId = parseIndiInstallJobId(data);

    if (jobId) {
      const pollResult = await pollJobUntilFinished(jobId);
      if (!pollResult.success) {
        throw new Error(pollResult.result?.status || 'unknown');
      }
    }

    showInstallModal.value = false;
    installStatus.value = t('components.pinsWizard.camera.installSuccess', {
      label: payload.label,
    });
    await loadDrivers();
    // The freshly installed driver only shows up after re-reading the INDI list.
    await driverSelect.value?.loadDrivers();
  } catch (error) {
    console.error('[PinsWizard] 3rd party install failed:', error);
    const detail = extractIndiInstallErrorDetail(error);
    installError.value = detail;
    installStatus.value = t('components.pinsWizard.camera.installFailed', { message: detail });
  } finally {
    isInstalling.value = false;
  }
}

onMounted(async () => {
  // The wizard can open over any route, so the profile may be stale or unread.
  // Fetch it first, then reload the device list - selectDevices only resolves
  // its preselection once defaultDeviceId is current.
  await store.fetchProfilInfos();
  equipmentStore.triggerReload();
});
</script>
