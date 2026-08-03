<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-xl font-semibold text-content">
        {{ t('components.pinsWizard.mount.title') }}
      </h2>
      <p class="text-sm text-content-muted mt-1">
        {{ t('components.pinsWizard.mount.description') }}
      </p>
    </div>

    <!-- 1. INDI driver -->
    <IndiDriverSelect
      ref="driverSelect"
      deviceType="telescope"
      settingPath="TelescopeSettings-IndiDriver"
      listAction="mountAction"
      rescanKey="mount"
      profileSection="TelescopeSettings"
      :label="t('components.pinsWizard.mount.selectDriver')"
    />

    <!-- 2. Device + connect -->
    <div class="flex flex-col gap-1">
      <span class="text-xs font-semibold uppercase text-content-muted">
        {{ t('components.pinsWizard.mount.connectDevice') }}
      </span>
      <selectDevices
        apiAction="mountAction"
        :deviceName="$t('components.connectEquipment.mount.name')"
        :default-device-id="store.profileInfo?.TelescopeSettings?.Id"
        :isConnected="store.mountInfo?.Connected"
        @open-config="openMountSettings"
      />
    </div>

    <div
      v-if="store.mountInfo?.Connected"
      class="flex items-start gap-3 rounded-control border border-status-ok/40 bg-status-ok/10 p-3"
    >
      <span class="tns-dot bg-status-ok mt-1.5"></span>
      <p class="text-sm text-content">
        {{ t('components.pinsWizard.mount.connected', { name: store.mountInfo?.Name || '' }) }}
      </p>
    </div>

    <!-- 3. Mount not found -> 3rd party driver. Collapsed by default so the step
         stays focused, but everything inside opens at once. -->
    <button class="tns-btn-secondary" @click="toggleNotFound">
      <ChevronDownIcon
        class="w-5 h-5 transition-transform"
        :class="{ 'rotate-180': showNotFound }"
      />
      {{ t('components.pinsWizard.mount.notFound') }}
    </button>

    <div v-if="showNotFound" class="flex flex-col gap-3">
      <p class="text-sm text-content-muted">
        {{ t('components.pinsWizard.mount.notFoundHint') }}
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

    <!-- Mount settings modal (same split as connectEquipment.vue) -->
    <Modal :show="showMountSettings" @close="showMountSettings = false">
      <template #header>
        <h2 class="text-2xl font-semibold">{{ $t('components.mount.indi.settings') }}</h2>
      </template>
      <template #body>
        <SettingsAlpacaDirect
          v-if="isAlpacaDirect(selectedMountObj)"
          deviceType="telescope"
          :selectedDevice="selectedMountDevice"
          :deviceId="selectedMountObj?.Id"
        />
        <SettingsSerialConnection
          v-else
          equipmentType="mount"
          :selectedDevice="selectedMountDevice"
        />
      </template>
    </Modal>

    <PinsIndiInstallConfirmModal
      :show="showInstallModal"
      :selected-item="selectedDriver"
      :installing="isInstalling"
      :error-message="installError"
      @close="closeInstallModal"
      @confirm="installDriver"
    />

    <PinsIndiRegistryEditModal :show="showRegistryModal" @close="showRegistryModal = false" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronDownIcon } from '@heroicons/vue/24/outline';
import apiPinsService from '@/services/apiPinsService';
import { apiStore } from '@/store/store';
import Modal from '@/components/helpers/Modal.vue';
import selectDevices from '@/components/equipment/selectDevices.vue';
import SettingsAlpacaDirect from '@/components/equipment/SettingsAlpacaDirect.vue';
import SettingsSerialConnection from '@/components/equipment/SettingsSerialConnection.vue';
import IndiDriverSelect from '../IndiDriverSelect.vue';
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

const driverSelect = ref(null);
const showMountSettings = ref(false);
const selectedMountDevice = ref('');
const selectedMountObj = ref(null);

const showNotFound = ref(false);
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

function openMountSettings(payload) {
  selectedMountDevice.value = payload?.selectedDeviceDisplayName || '';
  selectedMountObj.value = payload?.selectedDeviceObj || null;
  showMountSettings.value = true;
}

watch(
  () => store.mountInfo?.Connected,
  (connected) => {
    if (connected) emit('completed');
  },
  { immediate: true }
);

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
    installStatus.value = t('components.pinsWizard.mount.driverListFailed', {
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
  installStatus.value = t('components.pinsWizard.mount.installing', { label: payload.label });

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
    installStatus.value = t('components.pinsWizard.mount.installSuccess', { label: payload.label });
    await loadDrivers();
    // The freshly installed driver only shows up after re-reading the INDI list.
    await driverSelect.value?.loadDrivers();
  } catch (error) {
    console.error('[PinsWizard] 3rd party install failed:', error);
    const detail = extractIndiInstallErrorDetail(error);
    installError.value = detail;
    installStatus.value = t('components.pinsWizard.mount.installFailed', { message: detail });
  } finally {
    isInstalling.value = false;
  }
}

function toggleNotFound() {
  showNotFound.value = !showNotFound.value;
  // Fetch once on first expand, so the whole panel - search, driver select,
  // install and config - is populated the moment it opens.
  if (showNotFound.value && !drivers.value.length) {
    // Bias the initial list towards mounts; the user can clear the search to widen it.
    if (!searchQuery.value) searchQuery.value = 'mount';
    loadDrivers();
  }
}
</script>
