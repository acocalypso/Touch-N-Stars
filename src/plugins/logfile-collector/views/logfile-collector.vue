<template>
  <div class="p-4 space-y-4">
    <h5 class="text-2xl font-bold text-white">{{ $t('plugins.logfileCollector.title') }}</h5>

    <div
      class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5 space-y-4"
    >
      <p class="text-gray-300">
        {{ $t('plugins.logfileCollector.intro') }}
      </p>

      <div class="space-y-2">
        <label class="block text-sm text-gray-300" for="desc">
          {{ $t('plugins.logfileCollector.descriptionLabel') }}
        </label>
        <textarea
          id="desc"
          v-model="description"
          rows="4"
          class="w-full text-sm rounded-md bg-gray-900 border border-gray-700 p-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          :placeholder="$t('plugins.logfileCollector.descriptionPlaceholder')"
        ></textarea>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="collectAndUpload"
          :disabled="busy"
          class="default-button-green px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="busy" class="inline-flex items-center gap-2">
            <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="2" opacity=".25" />
              <path d="M4 12a8 8 0 0 1 8-8" stroke-width="2" stroke-linecap="round" />
            </svg>
            {{ $t('plugins.logfileCollector.actions.uploading') }}
          </span>
          <span v-else>{{ $t('plugins.logfileCollector.actions.collectUpload') }}</span>
        </button>
        <span
          v-if="resultMsg"
          :class="resultOk ? 'text-green-400' : 'text-red-400'"
          class="text-sm"
        >
          {{ resultMsg }}
        </span>
      </div>

      <!-- Generated Token Display -->
      <div v-if="lastGeneratedToken" class="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
        <h6 class="text-sm font-semibold text-gray-300 mb-2">
          {{ $t('plugins.logfileCollector.lastToken') }}
        </h6>
        <div class="flex items-center justify-between">
          <code class="text-xs text-cyan-400 font-mono">{{ lastGeneratedToken }}</code>
          <button
            @click="copyTokenToClipboard(lastGeneratedToken)"
            class="ml-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          >
            {{ $t('plugins.logfileCollector.actions.copyToken') }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="apiState.isPINS"
      class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5 space-y-4"
    >
      <div class="flex items-center justify-between gap-4">
        <h6 class="text-lg font-semibold text-white">
          {{ $t('plugins.logfileCollector.diagnostics.title') }}
        </h6>
        <button
          @click="loadDiagnosticsOptions"
          :disabled="diagnosticsOptionsLoading || diagnosticsUiState.isBusy"
          class="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
        >
          {{
            diagnosticsOptionsLoading
              ? $t('plugins.logfileCollector.diagnostics.loadingOptions')
              : $t('plugins.logfileCollector.diagnostics.refreshOptions')
          }}
        </button>
      </div>

      <p class="text-gray-300 text-sm">{{ $t('plugins.logfileCollector.diagnostics.intro') }}</p>

      <div class="space-y-3">
        <h6 class="text-sm font-semibold text-gray-300">
          {{ $t('plugins.logfileCollector.diagnostics.sectionsTitle') }}
        </h6>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label
            v-for="section in diagnosticsSections"
            :key="section.key"
            class="flex items-center gap-2 rounded border border-gray-700 bg-gray-900/40 p-2 text-sm text-gray-200"
          >
            <input v-model="section.enabled" type="checkbox" class="accent-cyan-500" />
            <span>{{ section.label }}</span>
          </label>
        </div>
        <p v-if="diagnosticsValidationErrors.sections" class="text-xs text-red-400">
          {{ diagnosticsValidationErrors.sections }}
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="block text-sm text-gray-300" for="journalLines">
            {{ $t('plugins.logfileCollector.diagnostics.journalLines') }}
          </label>
          <input
            id="journalLines"
            v-model.number="diagnosticsJournalLines"
            type="number"
            min="100"
            max="50000"
            class="w-full text-sm rounded-md bg-gray-900 border border-gray-700 p-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <p v-if="diagnosticsValidationErrors.journalLines" class="text-xs text-red-400">
            {{ diagnosticsValidationErrors.journalLines }}
          </p>
        </div>

        <div class="space-y-1">
          <label class="block text-sm text-gray-300" for="dmesgLines">
            {{ $t('plugins.logfileCollector.diagnostics.dmesgLines') }}
          </label>
          <input
            id="dmesgLines"
            v-model.number="diagnosticsDmesgLines"
            type="number"
            min="100"
            max="50000"
            class="w-full text-sm rounded-md bg-gray-900 border border-gray-700 p-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <p v-if="diagnosticsValidationErrors.dmesgLines" class="text-xs text-red-400">
            {{ diagnosticsValidationErrors.dmesgLines }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          @click="startDiagnosticsCollection"
          :disabled="!diagnosticsCanStart"
          class="default-button-green px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="diagnosticsUiState.isBusy" class="inline-flex items-center gap-2">
            <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="2" opacity=".25" />
              <path d="M4 12a8 8 0 0 1 8-8" stroke-width="2" stroke-linecap="round" />
            </svg>
            {{ $t('plugins.logfileCollector.diagnostics.running') }}
          </span>
          <span v-else>{{ $t('plugins.logfileCollector.diagnostics.start') }}</span>
        </button>

        <button
          @click="downloadDiagnosticsArchiveManual"
          :disabled="!diagnosticsCanDownload"
          class="px-4 py-2 rounded bg-cyan-700 hover:bg-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{
            diagnosticsDownloadBusy
              ? $t('plugins.logfileCollector.diagnostics.downloadBusy')
              : $t('plugins.logfileCollector.diagnostics.download')
          }}
        </button>
      </div>

      <div class="rounded border border-gray-700 bg-gray-900/40 p-3 space-y-1 text-sm">
        <p class="text-gray-300">
          {{ $t('plugins.logfileCollector.diagnostics.statusLabel') }}:
          <span
            class="font-semibold"
            :class="
              diagnosticsUiState.kind === 'success'
                ? 'text-green-400'
                : diagnosticsUiState.kind === 'failed'
                  ? 'text-red-400'
                  : diagnosticsUiState.kind === 'running'
                    ? 'text-yellow-400'
                    : 'text-gray-300'
            "
          >
            {{ diagnosticsStatusText }}
          </span>
        </p>
        <p v-if="logCollectorStore.diagnosticsRun.archiveId" class="text-gray-400">
          {{ $t('plugins.logfileCollector.diagnostics.archiveId') }}:
          <code class="text-cyan-400">{{ logCollectorStore.diagnosticsRun.archiveId }}</code>
        </p>
        <p v-if="logCollectorStore.diagnosticsRun.error" class="text-red-400">
          {{ logCollectorStore.diagnosticsRun.error }}
        </p>
        <p v-if="logCollectorStore.diagnosticsRun.lastMessage" class="text-gray-400">
          {{ logCollectorStore.diagnosticsRun.lastMessage }}
        </p>
        <p
          v-if="
            logCollectorStore.diagnosticsRun.status === 'success' &&
            logCollectorStore.diagnosticsRun.autoDownloaded
          "
          class="text-green-400"
        >
          {{ $t('plugins.logfileCollector.diagnostics.autoDownloaded') }}
        </p>
      </div>
    </div>

    <!-- Submission History -->
    <div
      v-if="logCollectorStore.getAllSubmissions.length > 0"
      class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5 space-y-4"
    >
      <h6 class="text-lg font-semibold text-white">
        {{ $t('plugins.logfileCollector.submissionHistory') }}
      </h6>

      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="submission in logCollectorStore.getAllSubmissions"
          :key="submission.id"
          class="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-600"
        >
          <div class="flex-1">
            <div class="text-sm text-gray-300">
              <strong>{{ $t('plugins.logfileCollector.submissionFields.date') }}:</strong>
              {{ formatDate(submission.date) }}
            </div>
            <div class="text-sm text-gray-300">
              <strong>{{ $t('plugins.logfileCollector.submissionFields.filename') }}:</strong>
              {{ submission.filename }}
            </div>
            <div class="text-sm text-gray-400">
              <strong>{{ $t('plugins.logfileCollector.submissionFields.token') }}:</strong>
              <code class="text-xs text-cyan-400 font-mono">{{ submission.token }}</code>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="copyTokenToClipboard(submission.token)"
              class="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            >
              {{ $t('plugins.logfileCollector.actions.copyToken') }}
            </button>
            <button
              @click="removeSubmission(submission.id)"
              class="px-2 py-1 text-xs bg-red-700 hover:bg-red-600 rounded"
            >
              {{ $t('plugins.logfileCollector.actions.remove') }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <button
          @click="clearAllSubmissions"
          class="px-3 py-1 text-sm bg-red-700 hover:bg-red-600 rounded"
        >
          {{ $t('plugins.logfileCollector.actions.clearAll') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLogStore } from '@/store/logStore';
import { useLogCollectorStore } from '../store/logCollectorStore';
import { generateTimestampLogToken } from '../utils/tokenGenerator';
import pluginMeta from '../plugin.json';
import axios from 'axios';
import JSZip from 'jszip';
import apiService from '@/services/apiService';
import { ensureConsolePatched, consoleLogs } from '@/utils/consoleCapture';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { createDiagnosticsApi } from '../utils/diagnosticsApi';
import {
  DIAGNOSTICS_DEFAULTS,
  DIAGNOSTICS_STATUS,
  buildDiagnosticsPayload,
  getDiagnosticsUiStatus,
  normalizeDiagnosticsOptions,
  validateDiagnosticsConfig,
} from '../utils/diagnosticsSupport';

const logStore = useLogStore();
const logCollectorStore = useLogCollectorStore();
const apiState = apiStore();
const settingsStore = useSettingsStore();
const busy = ref(false);
const resultMsg = ref('');
const resultOk = ref(false);
const description = ref('');
const lastGeneratedToken = ref('');
const diagnosticsSections = ref([]);
const diagnosticsJournalLines = ref(DIAGNOSTICS_DEFAULTS.journalLines);
const diagnosticsDmesgLines = ref(DIAGNOSTICS_DEFAULTS.dmesgLines);
const diagnosticsOptionsLoading = ref(false);
const diagnosticsValidationErrors = ref({});
const diagnosticsDownloadBusy = ref(false);
const { t } = useI18n();
const PORT = 8000;
const TOKEN = 'zZDqJ3IKeFaIZqG2JIFvsxzA5E48GC2gyGVagHFZqC0OMtgoupUDZCPhQDYKm35d';

const diagnosticsApi = createDiagnosticsApi({
  getIp,
  port: PORT,
  token: TOKEN,
});

let diagnosticsPollInterval = null;
let diagnosticsPollInFlight = false;

const diagnosticsUiState = computed(() => getDiagnosticsUiStatus(logCollectorStore.diagnosticsRun));
const diagnosticsStatusText = computed(() => {
  const status = logCollectorStore.diagnosticsRun.status;
  if (status === DIAGNOSTICS_STATUS.QUEUED)
    return t('plugins.logfileCollector.diagnostics.statusQueued');
  if (status === DIAGNOSTICS_STATUS.RUNNING)
    return t('plugins.logfileCollector.diagnostics.statusRunning');
  if (status === DIAGNOSTICS_STATUS.SUCCESS)
    return t('plugins.logfileCollector.diagnostics.statusSuccess');
  if (status === DIAGNOSTICS_STATUS.FAILED)
    return t('plugins.logfileCollector.diagnostics.statusFailed');
  if (status === DIAGNOSTICS_STATUS.TIMEOUT)
    return t('plugins.logfileCollector.diagnostics.statusTimeout');
  return t('plugins.logfileCollector.diagnostics.statusIdle');
});
const diagnosticsCanStart = computed(() => {
  return apiState.isPINS && !diagnosticsUiState.value.isBusy;
});
const diagnosticsCanDownload = computed(() => {
  return (
    apiState.isPINS &&
    diagnosticsUiState.value.canDownload &&
    Boolean(logCollectorStore.diagnosticsRun.archiveId) &&
    !diagnosticsDownloadBusy.value
  );
});

onMounted(() => {
  // Make sure we have recent logs
  try {
    logStore.fetchLogInfos?.();
  } catch (e) {
    // ignore
  }
  // Ensure console capture is active
  try {
    ensureConsolePatched();
  } catch (e) {
    /* ignore */
  }

  if (apiState.isPINS) {
    loadDiagnosticsOptions();
  }
});

onUnmounted(() => {
  stopDiagnosticsPolling();
});

watch(
  () => apiState.isPINS,
  (isPins) => {
    if (isPins && diagnosticsSections.value.length === 0) {
      loadDiagnosticsOptions();
    }
    if (!isPins) {
      stopDiagnosticsPolling();
    }
  }
);

async function buildZip(filesMap) {
  const zip = new JSZip();
  for (const [path, data] of filesMap) {
    zip.file(path, data);
  }
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

async function collectAndUpload() {
  busy.value = true;
  resultMsg.value = '';
  resultOk.value = false;
  try {
    // 1) Generate log token
    const logToken = generateTimestampLogToken();
    lastGeneratedToken.value = logToken;

    // 2) Collect logs: general and debug
    const dateStr = new Date().toISOString().slice(0, 10);
    const filesMap = new Map();

    // General logs (last 1000 entries)
    const generalLogs = await apiService.getLastLogs('1000');
    const generalText = (generalLogs || [])
      .map((e) => `[${new Date(e.timestamp).toISOString()}] ${e.level}: ${e.message}`)
      .join('\n');
    filesMap.set(`tns/tns-logs-${dateStr}.log`, generalText);

    // Debug logs from console capture (last 1000 entries)
    const captured = Array.isArray(consoleLogs.value) ? consoleLogs.value : [];
    const recentConsole = captured.slice(-1000);
    const consoleText = recentConsole
      .map(
        (e) =>
          `[${new Date(e.ts || Date.now()).toISOString()}] ${e.type?.toUpperCase?.() || 'LOG'}: ${e.message}`
      )
      .join('\n');
    filesMap.set(`tns/tns-debug-${dateStr}.log`, consoleText);

    // 3) Build ZIP
    const zipBlob = await buildZip(filesMap);

    const zipFileName = `tns-logs-${Date.now()}.zip`;
    const res = await uploadZipBlob(zipBlob, zipFileName, description.value, logToken);

    resultOk.value = res.status >= 200 && res.status < 300;

    if (resultOk.value) {
      // 5) Store submission information
      logCollectorStore.addSubmission({
        date: new Date().toISOString(),
        filename: zipFileName,
        token: logToken,
      });

      resultMsg.value = t('plugins.logfileCollector.result.success');

      // Clear description after successful upload
      description.value = '';
    } else {
      resultMsg.value = t('plugins.logfileCollector.result.failedWithStatus', {
        status: res.status,
      });
    }
  } catch (err) {
    console.error('Log upload failed', err);
    resultOk.value = false;
    resultMsg.value = t('plugins.logfileCollector.result.failed');
    lastGeneratedToken.value = ''; // Clear token on failure
  } finally {
    busy.value = false;
  }
}

function getIp() {
  return settingsStore.connection.ip || window.location.hostname;
}

function getDefaultDiagnosticsSections() {
  return [
    { key: 'includePinsJournal', label: 'PINS Journal', enabled: true },
    { key: 'includeApiJournal', label: 'API Journal', enabled: true },
    { key: 'includeUsb', label: 'USB', enabled: true },
    { key: 'includeDmesg', label: 'dmesg', enabled: true },
    { key: 'includeSystemInfo', label: 'System Info', enabled: true },
    { key: 'includeNetworkInfo', label: 'Network Info', enabled: true },
    { key: 'includeKernelModules', label: 'Kernel Modules', enabled: true },
  ];
}

async function loadDiagnosticsOptions() {
  if (!apiState.isPINS) {
    return;
  }

  diagnosticsOptionsLoading.value = true;
  diagnosticsValidationErrors.value = {};
  try {
    const raw = await diagnosticsApi.fetchDiagnosticsOptions();
    const normalized = normalizeDiagnosticsOptions(raw);
    diagnosticsSections.value =
      normalized.sections.length > 0 ? normalized.sections : getDefaultDiagnosticsSections();
    diagnosticsJournalLines.value = normalized.journalLines;
    diagnosticsDmesgLines.value = normalized.dmesgLines;
    logCollectorStore.setDiagnosticsLastMessage(
      t('plugins.logfileCollector.diagnostics.optionsLoaded')
    );
  } catch (error) {
    console.error('Failed to load diagnostics options:', error);
    diagnosticsSections.value = getDefaultDiagnosticsSections();
    logCollectorStore.setDiagnosticsLastMessage(
      t('plugins.logfileCollector.diagnostics.optionsLoadFailed')
    );
  } finally {
    diagnosticsOptionsLoading.value = false;
  }
}

async function startDiagnosticsCollection() {
  if (!apiState.isPINS) {
    return;
  }

  const validation = validateDiagnosticsConfig({
    sections: diagnosticsSections.value,
    journalLines: diagnosticsJournalLines.value,
    dmesgLines: diagnosticsDmesgLines.value,
  });
  diagnosticsValidationErrors.value = validation.errors;
  if (!validation.isValid) {
    return;
  }

  stopDiagnosticsPolling();
  logCollectorStore.resetDiagnosticsRun();

  try {
    const payload = buildDiagnosticsPayload({
      sections: diagnosticsSections.value,
      journalLines: diagnosticsJournalLines.value,
      dmesgLines: diagnosticsDmesgLines.value,
    });

    const startResponse = await diagnosticsApi.startDiagnosticsArchive(payload);
    logCollectorStore.beginDiagnosticsRun(startResponse);
    logCollectorStore.setDiagnosticsLastMessage(t('plugins.logfileCollector.diagnostics.started'));
    startDiagnosticsPolling();
  } catch (error) {
    console.error('Failed to start diagnostics archive:', error);
    logCollectorStore.setDiagnosticsError(
      extractErrorMessage(error, t('plugins.logfileCollector.diagnostics.startFailed'))
    );
  }
}

function startDiagnosticsPolling() {
  if (diagnosticsPollInterval || !logCollectorStore.diagnosticsRun.archiveId) {
    return;
  }

  diagnosticsPollInterval = setInterval(() => {
    pollDiagnosticsStatus();
  }, DIAGNOSTICS_DEFAULTS.pollIntervalMs);

  pollDiagnosticsStatus();
}

function stopDiagnosticsPolling() {
  if (diagnosticsPollInterval) {
    clearInterval(diagnosticsPollInterval);
    diagnosticsPollInterval = null;
  }
}

async function pollDiagnosticsStatus() {
  if (diagnosticsPollInFlight) {
    return;
  }

  const archiveId = logCollectorStore.diagnosticsRun.archiveId;
  if (!archiveId) {
    return;
  }

  diagnosticsPollInFlight = true;
  try {
    const statusResponse = await diagnosticsApi.getDiagnosticsArchiveStatus(archiveId);
    logCollectorStore.setDiagnosticsStatusResponse(statusResponse, {
      maxDurationMs: DIAGNOSTICS_DEFAULTS.maxPollingDurationMs,
    });

    const current = logCollectorStore.diagnosticsRun;
    if (current.status === DIAGNOSTICS_STATUS.SUCCESS) {
      stopDiagnosticsPolling();
      if (!current.autoDownloaded) {
        await downloadAndUploadDiagnosticsArchive(true);
      }
    } else if (
      current.status === DIAGNOSTICS_STATUS.FAILED ||
      current.status === DIAGNOSTICS_STATUS.TIMEOUT
    ) {
      stopDiagnosticsPolling();
    }
  } catch (error) {
    console.error('Diagnostics status polling error:', error);
    const message = extractErrorMessage(
      error,
      t('plugins.logfileCollector.diagnostics.pollFailed')
    );
    logCollectorStore.setDiagnosticsLastMessage(message);
  } finally {
    diagnosticsPollInFlight = false;
  }
}

async function downloadDiagnosticsArchiveManual() {
  await downloadAndUploadDiagnosticsArchive(false);
}

async function downloadAndUploadDiagnosticsArchive(isAuto) {
  const archiveId = logCollectorStore.diagnosticsRun.archiveId;
  if (!archiveId || diagnosticsDownloadBusy.value) {
    return;
  }

  diagnosticsDownloadBusy.value = true;
  try {
    const { blob, filename } = await diagnosticsApi.downloadDiagnosticsArchive(archiveId);
    triggerBrowserDownload(blob, filename);

    if (isAuto) {
      logCollectorStore.markDiagnosticsAutoDownloaded();
    }

    const generatedToken = generateTimestampLogToken();
    lastGeneratedToken.value = generatedToken;
    await uploadZipBlob(blob, filename, description.value, generatedToken);
    logCollectorStore.markDiagnosticsUploadedToSupport();
    logCollectorStore.setDiagnosticsLastMessage(t('plugins.logfileCollector.diagnostics.uploaded'));
  } catch (error) {
    if (error?.httpStatus === 409) {
      logCollectorStore.setDiagnosticsLastMessage(
        t('plugins.logfileCollector.diagnostics.stillPreparing')
      );
      return;
    }

    console.error('Diagnostics download/upload failed:', error);
    logCollectorStore.setDiagnosticsLastMessage(
      extractErrorMessage(error, t('plugins.logfileCollector.diagnostics.downloadFailed'))
    );
  } finally {
    diagnosticsDownloadBusy.value = false;
  }
}

function triggerBrowserDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

async function uploadZipBlob(zipBlob, zipFileName, uploadDescription, logToken) {
  const form = new FormData();
  form.append('file', zipBlob, zipFileName);
  form.append('logtoken', logToken);
  if (uploadDescription?.trim()) {
    form.append('description', uploadDescription.trim());
  }

  const url = pluginMeta.config?.uploadUrl;
  const token = pluginMeta.config?.authToken;

  if (!url || !token) {
    throw new Error('Upload URL or token missing in plugin config');
  }

  const res = await axios.post(url, form, {
    headers: { Authorization: `Bearer ${token}` },
    maxBodyLength: 50 * 1024 * 1024,
  });

  if (res.status >= 200 && res.status < 300) {
    logCollectorStore.addSubmission({
      date: new Date().toISOString(),
      filename: zipFileName,
      token: logToken,
    });
    return res;
  }

  throw new Error(`Upload failed with status ${res.status}`);
}

function extractErrorMessage(error, fallback) {
  const responseData = error?.response?.data;
  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }
  if (responseData && typeof responseData.message === 'string' && responseData.message.trim()) {
    return responseData.message;
  }
  if (responseData && typeof responseData.error === 'string' && responseData.error.trim()) {
    return responseData.error;
  }
  return error?.message || fallback;
}

// Utility functions for the new features
async function copyTokenToClipboard(token = lastGeneratedToken.value) {
  try {
    await navigator.clipboard.writeText(token);
    resultMsg.value = t('plugins.logfileCollector.result.tokenCopied');
    resultOk.value = true;

    // Clear the message after 3 seconds
    setTimeout(() => {
      resultMsg.value = '';
    }, 3000);
  } catch (err) {
    console.error('Failed to copy token to clipboard:', err);
    resultMsg.value = t('plugins.logfileCollector.result.tokenCopyFailed');
    resultOk.value = false;
  }
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } catch (err) {
    return dateString;
  }
}

function removeSubmission(id) {
  const success = logCollectorStore.removeSubmission(id);
  if (success) {
    resultMsg.value = t('plugins.logfileCollector.result.submissionRemoved');
    resultOk.value = true;

    // Clear the message after 2 seconds
    setTimeout(() => {
      resultMsg.value = '';
    }, 2000);
  }
}

function clearAllSubmissions() {
  if (confirm(t('plugins.logfileCollector.confirmClearAll'))) {
    logCollectorStore.clearAllSubmissions();
    resultMsg.value = t('plugins.logfileCollector.result.allSubmissionsCleared');
    resultOk.value = true;

    // Clear the message after 2 seconds
    setTimeout(() => {
      resultMsg.value = '';
    }, 2000);
  }
}
</script>

<style scoped>
.default-button-green {
  background: #059669;
  color: #fff;
}
</style>
