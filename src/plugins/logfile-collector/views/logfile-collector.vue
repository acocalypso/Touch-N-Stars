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
            @click="copyTokenToClipboard"
            class="ml-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          >
            {{ $t('plugins.logfileCollector.actions.copyToken') }}
          </button>
        </div>
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
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLogStore } from '@/store/logStore';
import { useLogCollectorStore } from '../store/logCollectorStore';
import { generateTimestampLogToken } from '../utils/tokenGenerator';
import pluginMeta from '../plugin.json';
import axios from 'axios';
import JSZip from 'jszip';
import apiService from '@/services/apiService';
import { ensureConsolePatched, consoleLogs } from '@/utils/consoleCapture';

const logStore = useLogStore();
const logCollectorStore = useLogCollectorStore();
const busy = ref(false);
const resultMsg = ref('');
const resultOk = ref(false);
const description = ref('');
const lastGeneratedToken = ref('');
const { t } = useI18n();

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
});

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

    // 4) Upload
    const form = new FormData();
    const zipFileName = `tns-logs-${Date.now()}.zip`;
    form.append('file', zipBlob, zipFileName);
    form.append('logtoken', logToken); // Add the log token to the request
    if (description.value?.trim()) {
      form.append('description', description.value.trim());
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
