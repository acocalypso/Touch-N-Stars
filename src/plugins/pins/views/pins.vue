<template>
  <div class="container py-8 sm:py-16 flex items-center justify-center px-4">
    <div class="container max-w-4xl p-0 sm:p-4 w-full">
      <h5
        class="text-2xl text-center font-bold text-white mb-2 flex items-center justify-center gap-3"
      >
        <span>{{ $t('plugins.pins.title') }}</span>
      </h5>

      <div v-if="availableUpdatePackages.length > 0" class="text-center mb-4">
        <button
          @click="showUpdatesModal = true"
          class="text-amber-300 hover:text-amber-200 underline underline-offset-4 transition-colors"
        >
          {{ $t('plugins.pins.updatesAvailable', { count: availableUpdatePackages.length }) }}
        </button>
      </div>

      <!-- Control Panel -->
      <div v-if="store.isPINS" class="flex flex-col space-y-6 animate-fade-in-up">
        <PinsSambaCard
          :enabled="sambaEnabled"
          :disabled="status === 'Running'"
          @toggle="handleSambaToggle"
        />

        <PinsPhd2Card
          :enabled="phd2Enabled"
          :running="phd2Running"
          :disabled="status === 'Running'"
          @toggle="handlePhd2Toggle"
        />

        <PinsWifiCard
          :stationary-mode="stationaryMode"
          :is-scanning="isScanning"
          :wifi-list="wifiList"
          :selected-ssid="selectedSsid"
          :wifi-password="wifiPassword"
          :selected-band="selectedBand"
          :auto-connect="autoConnect"
          :hotspot-configured="hotspotConfigured"
          :hotspot-password="hotspotPassword"
          :hotspot-loading="isHotspotLoading"
          :hotspot-saving="isHotspotSaving"
          :disabled="status === 'Running'"
          @toggle-stationary="handleStationaryToggle"
          @scan-wifi="scanWifi"
          @connect-wifi="connectWifi"
          @disconnect-wifi="requestDisableWifi"
          @update:selected-ssid="selectedSsid = $event"
          @update:wifi-password="wifiPassword = $event"
          @update:selected-band="selectedBand = $event"
          @update:auto-connect="autoConnect = $event"
          @update:hotspot-password="hotspotPassword = $event"
          @load-hotspot="loadHotspotPasswordConfig"
          @save-hotspot="saveHotspotPassword"
        />

        <PinsIndi3rdpartyCard
          :drivers="indi3rdpartyDrivers"
          :loading="isIndi3rdpartyLoading"
          :installing="isIndi3rdpartyInstalling"
          :search-query="indi3rdpartyQuery"
          :selected-asset="selectedIndi3rdpartyAsset"
          :disabled="status === 'Running'"
          @refresh="loadIndi3rdpartyDrivers"
          @search="loadIndi3rdpartyDrivers"
          @install="installIndi3rdpartyDriver"
          @update:search-query="indi3rdpartyQuery = $event"
          @update:selected-asset="selectedIndi3rdpartyAsset = $event"
        />

        <PinsDhcpClientsCard
          v-if="!stationaryMode"
          :clients="dhcpClients"
          :loading="isDhcpClientsLoading"
          @refresh="loadDhcpClients"
        />

        <!-- System Time Card -->
        <div
          class="border border-gray-700 rounded-lg bg-gray-800 shadow-xl p-6 relative overflow-hidden flex flex-row items-center justify-between"
        >
          <div class="absolute top-0 right-20 p-4 opacity-10 pointer-events-none">
            <svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="relative z-10">
            <h3 class="text-xl font-bold text-white mb-1">{{ $t('plugins.pins.systemTime') }}</h3>
            <p class="text-gray-400 text-sm" v-if="deviceTime">
              {{ $t('plugins.pins.deviceTime') }}:
              {{ new Date(deviceTime * 1000).toLocaleString() }}
            </p>
            <p class="text-gray-400 text-sm" v-else>
              {{ $t('plugins.pins.loadingTime') }}
            </p>
          </div>
          <div class="relative z-10 flex flex-col items-end gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 uppercase font-bold">{{
                $t('plugins.pins.autoSync')
              }}</span>
              <toggleButton
                :status-value="pinsStore.timeSyncEnabled"
                @update:status-value="handleTimeSyncToggle"
                :disabled="status === 'Running'"
              />
            </div>
            <button
              @click="manualTimeSync"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-md shadow-blue-900/20 transition-all disabled:opacity-50 text-xs sm:text-sm"
              :disabled="status === 'Running'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {{ $t('plugins.pins.syncNow') }}
            </button>
          </div>
        </div>

        <PinsUpgradeCard
          :status="status"
          :active-operation="activeOperation"
          :upgrade-exit-code="upgradeExitCode"
          @start-upgrade="startUpgrade"
        />

        <PinsTerminalOutput :logs="logs" @clear="pinsStore.clearTerminalLogs()" />

        <Modal
          :show="showDisconnectWifiModal"
          @close="showDisconnectWifiModal = false"
          maxWidth="max-w-md"
        >
          <template #header>
            <h2 class="text-xl font-bold text-white">
              {{ $t('plugins.pins.disconnectConfirmTitle') }}
            </h2>
          </template>

          <template #body>
            <div class="w-full">
              <p class="text-gray-300 text-sm leading-relaxed mb-6">
                {{ $t('plugins.pins.disconnectConfirmMessage') }}
              </p>
              <div class="flex justify-end gap-3">
                <button @click="showDisconnectWifiModal = false" class="default-button-gray">
                  {{ $t('common.cancel') }}
                </button>
                <button @click="confirmDisableWifi" class="default-button-red">
                  {{ $t('common.confirm') }}
                </button>
              </div>
            </div>
          </template>
        </Modal>

        <Modal :show="showUpdatesModal" @close="showUpdatesModal = false" maxWidth="max-w-2xl">
          <template #header>
            <h2 class="text-xl font-bold text-white">{{ $t('plugins.pins.updatesModalTitle') }}</h2>
          </template>

          <template #body>
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center justify-between gap-2 text-sm text-gray-400">
                <span>
                  {{ $t('plugins.pins.updatesCheckedAt') }}:
                  {{
                    updatesCheckResult?.checkedAt
                      ? new Date(updatesCheckResult.checkedAt).toLocaleString()
                      : '-'
                  }}
                </span>
                <button
                  @click="checkUpdates()"
                  class="text-blue-400 hover:text-white transition-colors disabled:opacity-50"
                  :disabled="isCheckingUpdates"
                >
                  {{
                    isCheckingUpdates
                      ? $t('plugins.pins.checkingUpdates')
                      : $t('plugins.pins.checkUpdates')
                  }}
                </button>
              </div>

              <div
                v-if="availableUpdatePackages.length === 0"
                class="text-gray-300 text-sm py-6 text-center"
              >
                {{ $t('plugins.pins.noUpdatesAvailable') }}
              </div>

              <div v-else class="max-h-80 overflow-y-auto border border-gray-700 rounded-lg">
                <table class="w-full text-left text-sm">
                  <thead class="bg-gray-900 text-gray-300 sticky top-0">
                    <tr>
                      <th class="px-4 py-3">{{ $t('plugins.pins.updatesPackage') }}</th>
                      <th class="px-4 py-3">{{ $t('plugins.pins.updatesInstalled') }}</th>
                      <th class="px-4 py-3">{{ $t('plugins.pins.updatesLatest') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="pkg in availableUpdatePackages"
                      :key="pkg.name"
                      class="border-t border-gray-700 text-gray-200"
                    >
                      <td class="px-4 py-3 font-medium">{{ pkg.name }}</td>
                      <td class="px-4 py-3">{{ pkg.installedVersion || '-' }}</td>
                      <td class="px-4 py-3">{{ pkg.latestVersion || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="flex justify-end">
                <button @click="showUpdatesModal = false" class="default-button-gray">
                  {{ $t('common.cancel') }}
                </button>
              </div>
            </div>
          </template>
        </Modal>
      </div>

      <!-- Unavailable State -->
      <div
        v-else
        class="border border-red-900/50 bg-red-900/20 rounded-lg p-8 text-center animate-fade-in-up"
      >
        <svg
          class="w-16 h-16 text-red-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 class="text-xl font-bold text-red-400 mb-2">{{ $t('plugins.pins.title') }}</h3>
        <p class="text-gray-400">{{ $t('plugins.pins.notAvailable') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { usePinsStore } from '../store/pinsStore';
import { apiStore } from '@/store/store';
import axios from 'axios';
import toggleButton from '@/components/helpers/toggleButton.vue';
import Modal from '@/components/helpers/Modal.vue';
import PinsUpgradeCard from '../components/PinsUpgradeCard.vue';
import PinsTerminalOutput from '../components/PinsTerminalOutput.vue';
import PinsSambaCard from '../components/PinsSambaCard.vue';
import PinsPhd2Card from '../components/PinsPhd2Card.vue';
import PinsWifiCard from '../components/PinsWifiCard.vue';
import PinsDhcpClientsCard from '../components/PinsDhcpClientsCard.vue';
import PinsIndi3rdpartyCard from '../components/PinsIndi3rdpartyCard.vue';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const store = apiStore();
const pinsStore = usePinsStore();

const deviceTime = ref(null);
const sambaEnabled = ref(false);
const phd2Enabled = ref(false);
const phd2Running = ref(false);
const hotspotPassword = ref('');
const hotspotConfigured = ref(false);
const isHotspotLoading = ref(false);
const isHotspotSaving = ref(false);
const showDisconnectWifiModal = ref(false);
const showUpdatesModal = ref(false);
const isCheckingUpdates = ref(false);
const updatesCheckResult = ref(null);
const indi3rdpartyDrivers = ref([]);
const isIndi3rdpartyLoading = ref(false);
const isIndi3rdpartyInstalling = ref(false);
const indi3rdpartyQuery = ref('');
const dhcpClients = ref([]);
const isDhcpClientsLoading = ref(false);
const selectedIndi3rdpartyAsset = ref('');
const {
  stationaryMode,
  wifiList,
  selectedSsid,
  wifiPassword,
  selectedBand,
  autoConnect,
  isScanning,
  wifiConnected,
  terminalLogs: logs,
  terminalStatus: status,
  activeOperation,
  currentJobId: jobId,
} = storeToRefs(pinsStore);
let ws = null;
let isComponentUnmounting = false;

const PORT = 8000;
const TOKEN = 'zZDqJ3IKeFaIZqG2JIFvsxzA5E48GC2gyGVagHFZqC0OMtgoupUDZCPhQDYKm35d';
const LAST_UPGRADE_JOB_ID_KEY = 'lastUpgradeJobId';
const LAST_UPGRADE_JOB_RESULT_KEY = 'lastUpgradeJobResult';
const UPGRADE_POLL_INTERVAL_MS = 3000;
const UPGRADE_INITIAL_BACKOFF_MS = 2000;
const UPGRADE_MAX_BACKOFF_MS = 30000;

const upgradeExitCode = ref(null);
let hasRestoredUpgradeState = false;
let upgradePollTimer = null;
let upgradePollBackoffMs = UPGRADE_INITIAL_BACKOFF_MS;
let isUpgradePolling = false;
let lastUpgradeStatus = null;

const availableUpdatePackages = computed(() => {
  const packages = updatesCheckResult.value?.packages || [];
  return packages.filter((pkg) => pkg.updateAvailable);
});

watch(selectedSsid, (newSsid) => {
  if (newSsid) {
    selectedBand.value = 'auto';
    const savedPassword = pinsStore.getPassword(newSsid);
    if (savedPassword) {
      wifiPassword.value = savedPassword;
    } else {
      wifiPassword.value = '';
    }
  }
});

function appendLog(message) {
  pinsStore.appendTerminalLog(message);
}

function getStorageItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write errors.
  }
}

function removeStorageItem(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage remove errors.
  }
}

function toFiniteNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUpgradeJob(rawJob) {
  if (!rawJob || typeof rawJob !== 'object') {
    return null;
  }

  return {
    jobId: rawJob.jobId ?? null,
    status: String(rawJob.status ?? '').toLowerCase(),
    exitCode: rawJob.exitCode ?? rawJob.exit_code ?? null,
    startedAt: toFiniteNumber(rawJob.startedAt),
    finishedAt: toFiniteNumber(rawJob.finishedAt),
    command: rawJob.command ?? null,
  };
}

function isUpgradeTerminalStatus(statusValue) {
  return statusValue === 'success' || statusValue === 'failed';
}

function isUpgradeInProgressStatus(statusValue) {
  return statusValue === 'started' || statusValue === 'running';
}

function setUpgradeJobId(nextJobId) {
  pinsStore.setCurrentJobId(nextJobId || null);
  if (nextJobId) {
    setStorageItem(LAST_UPGRADE_JOB_ID_KEY, String(nextJobId));
  } else {
    removeStorageItem(LAST_UPGRADE_JOB_ID_KEY);
  }
}

function getStoredUpgradeJobId() {
  return getStorageItem(LAST_UPGRADE_JOB_ID_KEY);
}

function saveUpgradeFinalResult(job) {
  setStorageItem(LAST_UPGRADE_JOB_RESULT_KEY, JSON.stringify(job));
}

function clearStoredUpgradeFinalResult() {
  removeStorageItem(LAST_UPGRADE_JOB_RESULT_KEY);
}

function getStoredUpgradeFinalResult() {
  const raw = getStorageItem(LAST_UPGRADE_JOB_RESULT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeUpgradeJob(JSON.parse(raw));
  } catch {
    return null;
  }
}

function clearUpgradePollTimer() {
  if (upgradePollTimer) {
    clearTimeout(upgradePollTimer);
    upgradePollTimer = null;
  }
}

function stopUpgradePolling() {
  isUpgradePolling = false;
  clearUpgradePollTimer();
  upgradePollBackoffMs = UPGRADE_INITIAL_BACKOFF_MS;
}

function scheduleUpgradePolling(ip, delayMs = UPGRADE_POLL_INTERVAL_MS) {
  if (!isUpgradePolling || !ip) {
    return;
  }

  clearUpgradePollTimer();
  upgradePollTimer = setTimeout(() => {
    pollUpgradeStatus(ip);
  }, delayMs);
}

function shouldRetryUpgradePolling(error) {
  const statusCode = error?.response?.status;
  if (!error?.response) {
    return true;
  }
  if (statusCode >= 500) {
    return true;
  }
  return statusCode === 408 || statusCode === 429;
}

function applyUpgradeJobState(job, { persistFinal = true } = {}) {
  const normalized = normalizeUpgradeJob(job);
  if (!normalized) {
    return false;
  }

  const previousStatus = lastUpgradeStatus;
  if (normalized.jobId) {
    setUpgradeJobId(normalized.jobId);
  }

  if (normalized.status && normalized.status !== previousStatus) {
    appendLog(t('plugins.pins.logs.jobStatus', { status: normalized.status }));
  }

  if (normalized.exitCode !== null && normalized.exitCode !== undefined) {
    upgradeExitCode.value = normalized.exitCode;
  }

  lastUpgradeStatus = normalized.status || previousStatus;
  pinsStore.setActiveOperation('upgrade');

  if (persistFinal || !isUpgradeTerminalStatus(normalized.status)) {
    saveUpgradeFinalResult(normalized);
  }

  if (normalized.status === 'success') {
    status.value = 'Success';
    if (previousStatus !== 'success') {
      appendLog(t('plugins.pins.logs.upgradeSuccess'));
    }
    stopUpgradePolling();
    return true;
  }

  if (normalized.status === 'failed') {
    status.value = 'Failed';
    if (previousStatus !== 'failed') {
      appendLog(
        t('plugins.pins.logs.upgradeFailed', {
          exitCode: normalized.exitCode ?? 'Unknown',
        })
      );
    }
    stopUpgradePolling();
    return true;
  }

  if (isUpgradeInProgressStatus(normalized.status)) {
    status.value = 'Running';
    return false;
  }

  status.value = 'Running';
  return false;
}

async function fetchUpgradeJobById(ip, id) {
  const directAxios = axios.create({ headers: {} });
  const response = await directAxios.get(`http://${ip}:${PORT}/jobs/${id}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
    timeout: 8000,
  });

  return normalizeUpgradeJob(response.data);
}

async function fetchLatestUpgradeJob(ip) {
  const directAxios = axios.create({ headers: {} });
  const response = await directAxios.get(`http://${ip}:${PORT}/jobs/latest`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
    timeout: 8000,
  });

  return normalizeUpgradeJob(response.data);
}

function selectPreferredJob(storedFinalResult, latestJob) {
  if (!storedFinalResult) {
    return latestJob;
  }
  if (!latestJob) {
    return storedFinalResult;
  }
  if (storedFinalResult.jobId === latestJob.jobId) {
    return latestJob;
  }

  const storedStartedAt = storedFinalResult.startedAt ?? -Infinity;
  const latestStartedAt = latestJob.startedAt ?? -Infinity;
  return latestStartedAt >= storedStartedAt ? latestJob : storedFinalResult;
}

async function pollUpgradeStatus(ip) {
  if (!isUpgradePolling) {
    return;
  }

  const trackedJobId = jobId.value || getStoredUpgradeJobId();
  if (!trackedJobId) {
    stopUpgradePolling();
    return;
  }

  try {
    const currentJob = await fetchUpgradeJobById(ip, trackedJobId);
    upgradePollBackoffMs = UPGRADE_INITIAL_BACKOFF_MS;
    const terminal = applyUpgradeJobState(currentJob);
    if (!terminal) {
      scheduleUpgradePolling(ip);
    }
    return;
  } catch (error) {
    if (error?.response?.status === 404) {
      try {
        const latestJob = await fetchLatestUpgradeJob(ip);
        const storedFinal = getStoredUpgradeFinalResult();
        const selectedJob = selectPreferredJob(storedFinal, latestJob);

        if (selectedJob?.jobId && selectedJob.jobId !== trackedJobId) {
          setUpgradeJobId(selectedJob.jobId);
        }

        upgradePollBackoffMs = UPGRADE_INITIAL_BACKOFF_MS;
        const terminal = applyUpgradeJobState(selectedJob);
        if (!terminal) {
          scheduleUpgradePolling(ip);
        }
        return;
      } catch (latestError) {
        if (latestError?.response?.status === 404) {
          const retryDelay = Math.min(upgradePollBackoffMs, UPGRADE_MAX_BACKOFF_MS);
          appendLog(
            t('plugins.pins.logs.error', {
              message: `No jobs found yet. Retrying in ${Math.round(retryDelay / 1000)}s.`,
            })
          );
          upgradePollBackoffMs = Math.min(upgradePollBackoffMs * 2, UPGRADE_MAX_BACKOFF_MS);
          scheduleUpgradePolling(ip, retryDelay);
          return;
        }

        error = latestError;
      }
    }

    if (error?.response?.status === 401) {
      appendLog(
        t('plugins.pins.logs.serverError', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        })
      );
      appendLog(
        t('plugins.pins.logs.error', {
          message: 'Unauthorized. Please re-authenticate or refresh your token.',
        })
      );
      status.value = 'Failed';
      stopUpgradePolling();
      return;
    }

    if (shouldRetryUpgradePolling(error)) {
      const retryDelay = Math.min(upgradePollBackoffMs, UPGRADE_MAX_BACKOFF_MS);
      upgradePollBackoffMs = Math.min(upgradePollBackoffMs * 2, UPGRADE_MAX_BACKOFF_MS);
      appendLog(
        t('plugins.pins.logs.error', {
          message: `Status check failed (${error.message}). Retrying in ${Math.round(
            retryDelay / 1000
          )}s.`,
        })
      );
      scheduleUpgradePolling(ip, retryDelay);
      return;
    }

    appendLog(t('plugins.pins.logs.statusFetchFailed', { message: error.message }));
    status.value = 'Failed';
    stopUpgradePolling();
  }
}

function beginUpgradeTracking(ip, nextJobId) {
  if (!ip || !nextJobId) {
    return;
  }

  isUpgradePolling = true;
  upgradePollBackoffMs = UPGRADE_INITIAL_BACKOFF_MS;
  setUpgradeJobId(nextJobId);
  scheduleUpgradePolling(ip, 0);
}

function restoreUpgradeState() {
  if (hasRestoredUpgradeState) {
    return;
  }
  hasRestoredUpgradeState = true;

  const ip = getIp();
  if (!ip) {
    return;
  }

  const storedFinalResult = getStoredUpgradeFinalResult();
  if (storedFinalResult && isUpgradeTerminalStatus(storedFinalResult.status)) {
    pinsStore.setActiveOperation('upgrade');
    lastUpgradeStatus = storedFinalResult.status;
    upgradeExitCode.value = storedFinalResult.exitCode;
    status.value = storedFinalResult.status === 'success' ? 'Success' : 'Failed';
  }

  const trackedJobId = jobId.value || getStoredUpgradeJobId();
  if (!trackedJobId) {
    return;
  }

  setUpgradeJobId(trackedJobId);
  if (!storedFinalResult || !isUpgradeTerminalStatus(storedFinalResult.status)) {
    pinsStore.setActiveOperation('upgrade');
    status.value = 'Running';
    beginUpgradeTracking(ip, trackedJobId);
  }
}

watch(
  () => store.isPINS,
  (newValue) => {
    if (newValue) {
      checkSambaStatus();
      checkPhd2Status();
      checkSystemTime();
      loadHotspotPasswordConfig();
      checkUpdates();
      loadIndi3rdpartyDrivers();
      loadDhcpClients();
      restoreUpgradeState();
    } else {
      stopUpgradePolling();
    }
  },
  { immediate: true }
);

async function loadIndi3rdpartyDrivers() {
  const ip = getIp();
  if (!ip || isIndi3rdpartyLoading.value) return;

  isIndi3rdpartyLoading.value = true;
  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/packages/indi3rdparty`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      params: {
        onlyNotInstalled: true,
        ...(indi3rdpartyQuery.value?.trim() ? { q: indi3rdpartyQuery.value.trim() } : {}),
      },
      timeout: 15000,
    });

    const packages = response.data?.packages || [];
    indi3rdpartyDrivers.value = packages;

    if (!packages.some((pkg) => pkg.assetName === selectedIndi3rdpartyAsset.value)) {
      selectedIndi3rdpartyAsset.value = packages[0]?.assetName || '';
    }
  } catch (error) {
    console.error(error);
    appendLog(t('plugins.pins.logs.indi3rdpartyLoadFailed', { message: error.message }));
  } finally {
    isIndi3rdpartyLoading.value = false;
  }
}

async function installIndi3rdpartyDriver() {
  if (
    status.value === 'Running' ||
    isIndi3rdpartyInstalling.value ||
    !selectedIndi3rdpartyAsset.value
  ) {
    return;
  }

  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    return;
  }

  status.value = 'Running';
  pinsStore.setActiveOperation('indi3rdparty');
  pinsStore.clearTerminalLogs();
  appendLog(t('plugins.pins.logs.init', { ip }));
  appendLog(
    t('plugins.pins.logs.indi3rdpartyInstallStart', {
      assetName: selectedIndi3rdpartyAsset.value,
    })
  );

  isIndi3rdpartyInstalling.value = true;
  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.post(
      `http://${ip}:${PORT}/packages/indi3rdparty/install`,
      {
        assetName: selectedIndi3rdpartyAsset.value,
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const data = response.data;
    let returnedJobId;

    if (data && typeof data === 'object' && data.jobId) {
      returnedJobId = data.jobId;
    } else if (typeof data === 'string' || typeof data === 'number') {
      returnedJobId = data;
    }

    if (returnedJobId) {
      jobId.value = returnedJobId;
      appendLog(t('plugins.pins.logs.jobCreated', { jobId: returnedJobId }));
      connectWebSocket(ip, returnedJobId);
    } else {
      appendLog(
        t('plugins.pins.logs.indi3rdpartyInstallSuccess', {
          message: data?.message || JSON.stringify(data),
        })
      );
      status.value = 'Success';
    }

    await loadIndi3rdpartyDrivers();
  } catch (error) {
    console.error(error);
    status.value = 'Failed';
    appendLog(t('plugins.pins.logs.indi3rdpartyInstallFailed', { message: error.message }));

    if (error.response) {
      appendLog(
        t('plugins.pins.logs.serverError', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        })
      );
    }
  } finally {
    isIndi3rdpartyInstalling.value = false;
  }
}

async function checkUpdates() {
  const ip = getIp();
  if (!ip || isCheckingUpdates.value) return;

  isCheckingUpdates.value = true;
  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/updates/check`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 10000,
    });

    updatesCheckResult.value = response.data || null;
  } catch (error) {
    console.error(error);
    appendLog(t('plugins.pins.logs.updateCheckFailed', { message: error.message }));
  } finally {
    isCheckingUpdates.value = false;
  }
}

async function loadHotspotPasswordConfig() {
  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    return;
  }

  isHotspotLoading.value = true;
  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/wifi/hotspot/password`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });

    const data = response.data || {};
    hotspotConfigured.value = Boolean(data.configured);
    if (!hotspotConfigured.value) {
      hotspotPassword.value = '';
    }

    appendLog(
      t('plugins.pins.logs.hotspotFetched', {
        configured: hotspotConfigured.value ? 'true' : 'false',
        source: data.source || 'unknown',
      })
    );
  } catch (error) {
    console.error(error);
    appendLog(
      t('plugins.pins.logs.error', { message: 'Hotspot password fetch failed: ' + error.message })
    );
  } finally {
    isHotspotLoading.value = false;
  }
}

async function saveHotspotPassword() {
  if (status.value === 'Running' || isHotspotSaving.value) return;

  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    return;
  }

  if (!hotspotPassword.value || hotspotPassword.value.length < 8) {
    appendLog(t('plugins.pins.logs.hotspotPasswordTooShort'));
    return;
  }

  isHotspotSaving.value = true;
  appendLog(t('plugins.pins.logs.hotspotSaving'));

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.post(
      `http://${ip}:${PORT}/wifi/hotspot/password`,
      {
        password: hotspotPassword.value,
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const data = response.data || {};
    hotspotConfigured.value = Boolean(data.configured);
    appendLog(
      t('plugins.pins.logs.hotspotSaved', {
        message: data.message || 'OK',
      })
    );

    // Refresh status/source after update.
    await loadHotspotPasswordConfig();
  } catch (error) {
    console.error(error);
    appendLog(
      t('plugins.pins.logs.error', { message: 'Hotspot password save failed: ' + error.message })
    );

    if (error.response) {
      appendLog(
        t('plugins.pins.logs.serverError', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        })
      );
    }
  } finally {
    isHotspotSaving.value = false;
  }
}

async function checkSystemTime() {
  const ip = getIp();
  if (!ip) return;

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/system/time`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });

    if (response.data && response.data.timestamp) {
      deviceTime.value = response.data.timestamp;

      if (pinsStore.timeSyncEnabled) {
        syncSystemTime(response.data.timestamp);
      }
    }
  } catch (error) {
    console.error('Failed to check system time:', error);
  }
}

async function syncSystemTime(remoteTimestamp, force = false) {
  const ip = getIp();
  if (!ip) return;

  const localTime = Date.now() / 1000;
  const diff = Math.abs(remoteTimestamp - localTime);

  if (diff > 5 || force) {
    if (force) {
      console.log('Forcing time sync...');
      appendLog(t('plugins.pins.logs.forcingSync'));
    } else {
      console.log(`Time difference detected: ${diff.toFixed(2)}s. Syncing...`);
      appendLog(t('plugins.pins.logs.syncingTime', { diff: diff.toFixed(1) }));
    }

    try {
      const directAxios = axios.create({ headers: {} });
      await directAxios.post(
        `http://${ip}:${PORT}/system/time`,
        {
          timestamp: localTime,
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );
      appendLog(t('plugins.pins.logs.timeSynced'));
      // Refresh time after sync
      setTimeout(checkSystemTime, 2000);
    } catch (error) {
      console.error('Failed to sync system time:', error);
      appendLog(t('plugins.pins.logs.error', { message: 'Time Sync Failed: ' + error.message }));
    }
  } else {
    appendLog(t('plugins.pins.logs.timeInSync', { diff: diff.toFixed(3) }));
  }
}

async function manualTimeSync() {
  const ip = getIp();
  if (!ip) return;

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/system/time`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      timeout: 5000,
    });
    if (response.data && response.data.timestamp) {
      syncSystemTime(response.data.timestamp, true);
    }
  } catch (e) {
    console.error(e);
    appendLog(
      t('plugins.pins.logs.error', { message: 'Failed to fetch time for sync: ' + e.message })
    );
  }
}

async function handleTimeSyncToggle(newValue) {
  pinsStore.setTimeSync(newValue);
  if (newValue) {
    checkSystemTime();
  }
}

async function checkSambaStatus() {
  const ip = getIp();
  if (!ip) return;

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/samba`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });

    if (response.data && typeof response.data.enabled !== 'undefined') {
      sambaEnabled.value = response.data.enabled;
    }
  } catch (error) {
    console.error('Failed to check Samba status:', error);
  }
}

async function checkPhd2Status() {
  const ip = getIp();
  if (!ip) return;

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/phd2`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });

    if (response.data) {
      if (typeof response.data.enabled !== 'undefined') {
        phd2Enabled.value = response.data.enabled;
      }
      if (typeof response.data.running !== 'undefined') {
        phd2Running.value = response.data.running;
      }
    }
  } catch (error) {
    console.error('Failed to check PHD2 status:', error);
  }
}

async function loadDhcpClients() {
  const ip = getIp();
  if (!ip) return;

  isDhcpClientsLoading.value = true;
  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/wifi/clients`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });
    dhcpClients.value = response.data?.clients || [];
  } catch (error) {
    console.error('Failed to load DHCP clients:', error);
    dhcpClients.value = [];
  } finally {
    isDhcpClientsLoading.value = false;
  }
}

async function handlePhd2Toggle(newValue) {
  if (status.value === 'Running') return;

  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    return;
  }

  // Update logic: Set specific operation
  status.value = 'Running';
  pinsStore.setActiveOperation('phd2');
  pinsStore.clearTerminalLogs();

  phd2Enabled.value = newValue; // Optimistic update
  appendLog(t('plugins.pins.logs.init', { ip }));
  const actionKey = newValue ? 'plugins.pins.logs.phd2Enabling' : 'plugins.pins.logs.phd2Disabling';
  appendLog(
    t('plugins.pins.logs.phd2Action', {
      action: t(actionKey),
    })
  );

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.post(
      `http://${ip}:${PORT}/phd2`,
      { enable: newValue },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // Increased timeout for systemctl
      }
    );

    // Check for Job ID pattern just in case
    const data = response.data;
    let returnedJobId;

    if (data && typeof data === 'object' && data.jobId) {
      returnedJobId = data.jobId;
    } else if (typeof data === 'string' || typeof data === 'number') {
      returnedJobId = data;
    }

    if (returnedJobId) {
      jobId.value = returnedJobId;
      appendLog(t('plugins.pins.logs.jobCreated', { jobId: returnedJobId }));
      connectWebSocket(ip, returnedJobId);
    } else {
      appendLog(t('plugins.pins.logs.phd2Success'));
      status.value = 'Success';

      // Update running state immediately if successful
      if (newValue) {
        phd2Running.value = true;
      } else {
        phd2Running.value = false;
      }

      // Double check status after delay
      setTimeout(checkPhd2Status, 2000);
    }
  } catch (error) {
    status.value = 'Failed';
    phd2Enabled.value = !newValue; // Revert
    console.error(error);
    appendLog(t('plugins.pins.logs.phd2Failed', { message: error.message }));

    if (error.response) {
      appendLog(
        t('plugins.pins.logs.serverError', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        })
      );
    }
  }
}

// Function to get the current connection IP
function getIp() {
  return settingsStore.connection.ip || window.location.hostname;
}

async function handleStationaryToggle(newValue) {
  if (status.value === 'Running') return;
  stationaryMode.value = newValue;
  if (newValue) {
    scanWifi();
  } else {
    wifiList.value = [];
    selectedSsid.value = '';
    wifiPassword.value = '';
  }
}

async function scanWifi() {
  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    return;
  }

  isScanning.value = true;
  wifiList.value = [];

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.get(`http://${ip}:${PORT}/wifi/scan`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 15000,
    });

    let networks = response.data || [];
    // Deduplicate by SSID and filter empty SSIDs
    const seen = new Set();
    wifiList.value = networks
      .filter((n) => {
        if (!n.ssid) return false;
        if (seen.has(n.ssid)) return false;
        seen.add(n.ssid);
        return true;
      })
      .sort((a, b) => b.signal_strength - a.signal_strength);
  } catch (error) {
    console.error(error);
    appendLog(t('plugins.pins.logs.error', { message: 'Wifi Scan Failed: ' + error.message }));
  } finally {
    isScanning.value = false;
  }
}

async function connectWifi() {
  if (status.value === 'Running') return;

  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    return;
  }

  status.value = 'Running';
  pinsStore.setActiveOperation('wifi');
  pinsStore.clearTerminalLogs();
  appendLog(t('plugins.pins.logs.init', { ip }));
  appendLog(t('plugins.pins.logs.connectingToWifi', { ssid: selectedSsid.value }));

  // Save password to store
  if (selectedSsid.value && wifiPassword.value) {
    pinsStore.savePassword(selectedSsid.value, wifiPassword.value);
  }

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.post(
      `http://${ip}:${PORT}/wifi/connect`,
      {
        ssid: selectedSsid.value,
        password: wifiPassword.value,
        auto_connect: autoConnect.value,
        band: selectedBand.value === 'auto' ? null : selectedBand.value,
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const data = response.data;
    let returnedJobId;

    if (data && typeof data === 'object' && data.jobId) {
      returnedJobId = data.jobId;
    } else if (typeof data === 'string' || typeof data === 'number') {
      returnedJobId = data;
    }

    if (returnedJobId) {
      jobId.value = returnedJobId;
      wifiConnected.value = true;
      appendLog(t('plugins.pins.logs.jobCreated', { jobId: returnedJobId }));
      connectWebSocket(ip, returnedJobId);
    } else {
      appendLog(t('plugins.pins.logs.wifiResponse', { response: JSON.stringify(data) }));
      wifiConnected.value = true;
      status.value = 'Success';
    }
  } catch (error) {
    console.error(error);
    status.value = 'Failed';
    appendLog(
      t('plugins.pins.logs.error', { message: 'Wifi Connection Failed: ' + error.message })
    );

    if (error.response) {
      appendLog(
        t('plugins.pins.logs.serverError', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        })
      );
    }
  }
}

function requestDisableWifi() {
  if (status.value === 'Running') return;
  showDisconnectWifiModal.value = true;
}

function confirmDisableWifi() {
  showDisconnectWifiModal.value = false;
  disableWifi();
}

async function disableWifi() {
  if (status.value === 'Running') return;

  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    return;
  }

  status.value = 'Running';
  pinsStore.setActiveOperation('wifi');
  pinsStore.clearTerminalLogs();
  appendLog(t('plugins.pins.logs.init', { ip }));
  appendLog(t('plugins.pins.logs.wifiDisabling'));

  try {
    const directAxios = axios.create({ headers: {} });
    const response = await directAxios.post(`http://${ip}:${PORT}/wifi/disable`, null, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 30000,
    });

    const data = response.data;
    let returnedJobId;

    if (data && typeof data === 'object' && data.jobId) {
      returnedJobId = data.jobId;
    } else if (typeof data === 'string' || typeof data === 'number') {
      returnedJobId = data;
    }

    if (returnedJobId) {
      jobId.value = returnedJobId;
      wifiConnected.value = false;
      appendLog(t('plugins.pins.logs.jobCreated', { jobId: returnedJobId }));
      connectWebSocket(ip, returnedJobId);
    } else {
      appendLog(t('plugins.pins.logs.wifiDisabled'));
      wifiConnected.value = false;
      status.value = 'Success';
    }
  } catch (error) {
    console.error(error);
    status.value = 'Failed';
    appendLog(
      t('plugins.pins.logs.error', { message: 'Wifi Disconnect Failed: ' + error.message })
    );

    if (error.response) {
      appendLog(
        t('plugins.pins.logs.serverError', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        })
      );
    }
  }
}

async function handleSambaToggle(newValue) {
  if (status.value === 'Running') return;

  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    return;
  }

  sambaEnabled.value = newValue;
  status.value = 'Running';
  pinsStore.setActiveOperation('samba');
  pinsStore.clearTerminalLogs();
  appendLog(t('plugins.pins.logs.init', { ip }));

  const actionKey = newValue ? 'plugins.pins.logs.sambaEnable' : 'plugins.pins.logs.sambaDisable';
  appendLog(t('plugins.pins.logs.sambaAction', { action: t(actionKey) }));

  try {
    const directAxios = axios.create({ headers: {} });

    const response = await directAxios.post(
      `http://${ip}:${PORT}/samba`,
      { enable: newValue },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    const data = response.data;
    let returnedJobId;

    if (data && typeof data === 'object' && data.jobId) {
      returnedJobId = data.jobId;
    } else if (typeof data === 'string' || typeof data === 'number') {
      returnedJobId = data;
    }

    if (!returnedJobId) {
      throw new Error('No valid Job ID returned. server response: ' + JSON.stringify(data));
    }

    jobId.value = returnedJobId;
    appendLog(t('plugins.pins.logs.jobCreated', { jobId: returnedJobId }));

    connectWebSocket(ip, returnedJobId);
  } catch (error) {
    console.error(error);
    status.value = 'Failed';
    sambaEnabled.value = !newValue; // Revert on failure
    appendLog(t('plugins.pins.logs.daemonCheck', { ip, port: PORT }));

    if (error.response) {
      appendLog(
        t('plugins.pins.logs.serverError', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        })
      );
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      appendLog(t('plugins.pins.logs.networkError'));
    } else if (error.request) {
      appendLog(t('plugins.pins.logs.noResponse'));
    } else {
      appendLog(t('plugins.pins.logs.error', { message: error.message }));
    }
  }
}

async function startUpgrade() {
  if (status.value === 'Running') return;

  const ip = getIp();
  if (!ip) {
    appendLog(t('plugins.pins.logs.noIp'));
    status.value = 'Failed';
    return;
  }

  status.value = 'Running';
  pinsStore.setActiveOperation('upgrade');
  pinsStore.clearTerminalLogs();
  stopUpgradePolling();
  clearStoredUpgradeFinalResult();
  upgradeExitCode.value = null;
  lastUpgradeStatus = null;
  appendLog(t('plugins.pins.logs.init', { ip }));

  try {
    // Create a clean axios instance to avoid global interceptors
    const directAxios = axios.create({
      headers: {}, // Start with empty headers
    });

    const response = await directAxios.post(
      `http://${ip}:${PORT}/upgrade`,
      { dryRun: false },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    // Flexible handling of job ID
    const data = response.data;
    let returnedJobId;

    if (data && typeof data === 'object' && data.jobId) {
      returnedJobId = data.jobId;
    } else if (typeof data === 'string' || typeof data === 'number') {
      returnedJobId = data;
    }

    if (!returnedJobId) {
      throw new Error('No valid Job ID returned. server response: ' + JSON.stringify(data));
    }

    setUpgradeJobId(returnedJobId);
    appendLog(t('plugins.pins.logs.jobCreated', { jobId: returnedJobId }));

    const normalizedResponseJob = normalizeUpgradeJob(data);
    if (normalizedResponseJob) {
      applyUpgradeJobState(
        { ...normalizedResponseJob, jobId: returnedJobId },
        { persistFinal: false }
      );
    }

    beginUpgradeTracking(ip, returnedJobId);

    connectWebSocket(ip, returnedJobId);
  } catch (error) {
    console.error(error);
    status.value = 'Failed';
    appendLog(t('plugins.pins.logs.daemonCheck', { ip, port: PORT }));

    // Detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      appendLog(
        t('plugins.pins.logs.serverError', {
          status: error.response.status,
          data: JSON.stringify(error.response.data),
        })
      );
      if (error.response.status === 405) {
        appendLog(t('plugins.pins.logs.corsHint'));
      }
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      appendLog(t('plugins.pins.logs.networkError'));
    } else if (error.request) {
      // The request was made but no response was received
      appendLog(t('plugins.pins.logs.noResponse'));
    } else {
      // Something happened in setting up the request that triggered an Error
      appendLog(t('plugins.pins.logs.error', { message: error.message }));
    }
  }
}

function connectWebSocket(ip, id) {
  if (ws) {
    ws.close();
  }

  const wsUrl = `ws://${ip}:${PORT}/logs/${id}?token=${TOKEN}`;
  appendLog(t('plugins.pins.logs.wsConnecting', { wsUrl }));

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      appendLog(t('plugins.pins.logs.wsConnected'));
    };

    ws.onmessage = (event) => {
      if (event.data) {
        appendLog(event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      appendLog(t('plugins.pins.logs.wsError'));
    };

    ws.onclose = (event) => {
      if (isComponentUnmounting) {
        return;
      }

      appendLog(t('plugins.pins.logs.wsClosed', { code: event.code }));
      ws = null;

      // Upgrade status resolution uses polling with /jobs/{id} and /jobs/latest fallback.
      if (activeOperation.value === 'upgrade' && isUpgradePolling) {
        scheduleUpgradePolling(ip, 0);
        return;
      }

      // Non-upgrade operations still use a single final status fetch.
      checkFinalStatus(ip, id);
    };
  } catch (e) {
    appendLog(t('plugins.pins.logs.wsCreationFailed', { message: e.message }));
    status.value = 'Failed';
  }
}

async function checkFinalStatus(ip, id) {
  appendLog(t('plugins.pins.logs.verifyingStatus'));
  try {
    const directAxios = axios.create();
    const response = await directAxios.get(`http://${ip}:${PORT}/jobs/${id}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      timeout: 5000,
    });

    const result = response.data;
    if (typeof result === 'object') {
      appendLog(t('plugins.pins.logs.jobReport', { report: JSON.stringify(result, null, 2) }));

      // Check for success indicators
      const isSuccess =
        result.status === 'success' ||
        result.status === 'completed' ||
        result.exit_code === 0 ||
        result.exitCode === 0 ||
        result.success === true;

      if (isSuccess) {
        status.value = 'Success';
        appendLog(t('plugins.pins.logs.upgradeSuccess'));
      } else {
        status.value = 'Failed';
        appendLog(t('plugins.pins.logs.upgradeFailed', { exitCode: result.exitCode ?? 'Unknown' }));
      }
    } else {
      appendLog(t('plugins.pins.logs.jobStatus', { status: result }));
      status.value = 'Idle'; // Ambiguous
    }
  } catch (e) {
    appendLog(t('plugins.pins.logs.statusFetchFailed', { message: e.message }));
    // If we can't verify, we leave it as Idle or keep last state?
    // Let's set to finish but unknown
    if (status.value === 'Running') status.value = 'Idle';
  }
}

onUnmounted(() => {
  isComponentUnmounting = true;
  stopUpgradePolling();
  if (ws) {
    ws.close();
    ws = null;
  }
});
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom scrollbar for terminal */
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-track {
  background: #111827;
}
::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 5px;
  border: 2px solid #111827;
}
::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}
</style>
