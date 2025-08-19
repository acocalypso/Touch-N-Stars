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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLogStore } from '@/store/logStore';
import pluginMeta from '../plugin.json';
import axios from 'axios';
import JSZip from 'jszip';
import apiService from '@/services/apiService';
import { ensureConsolePatched, consoleLogs } from '@/utils/consoleCapture';

const logStore = useLogStore();
const busy = ref(false);
const resultMsg = ref('');
const resultOk = ref(false);
const description = ref('');
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
    // 1) Collect logs: general and debug
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

    // 2) Build ZIP
    const zipBlob = await buildZip(filesMap);

    // 3) Upload
    const form = new FormData();
    const zipFileName = `tns-logs-${Date.now()}.zip`;
    form.append('file', zipBlob, zipFileName);
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
    resultMsg.value = resultOk.value
      ? t('plugins.logfileCollector.result.success')
      : t('plugins.logfileCollector.result.failedWithStatus', { status: res.status });
  } catch (err) {
    console.error('Log upload failed', err);
    resultOk.value = false;
    resultMsg.value = t('plugins.logfileCollector.result.failed');
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.default-button-green {
  background: #059669;
  color: #fff;
}
</style>
