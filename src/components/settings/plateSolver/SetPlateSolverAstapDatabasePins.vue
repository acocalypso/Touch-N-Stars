<template>
  <div class="flex flex-col gap-2 pt-1 border-t border-gray-700/60">
    <div class="flex items-center justify-between gap-3">
      <div class="flex flex-col">
        <span class="text-sm font-medium text-gray-300">ASTAP Star Database (PINS)</span>
        <span class="text-xs text-gray-500">
          Install missing ASTAP star databases directly on your PINS device.
        </span>
      </div>

      <button
        @click="loadPackages"
        :disabled="isLoading || isInstalling"
        class="default-button-gray h-8 px-3 text-xs"
      >
        {{ isLoading ? $t('common.loading') : $t('common.refresh') }}
      </button>
    </div>

    <div class="flex items-center gap-2">
      <select
        v-model="selectedDatabaseId"
        class="default-select h-8 w-full"
        :disabled="isLoading || isInstalling || isJobActive || !packages.length"
      >
        <option value="">
          {{
            packages.length ? 'Select a database' : 'No installable ASTAP star databases available'
          }}
        </option>
        <option v-for="pkg in packages" :key="pkg.databaseId" :value="pkg.databaseId">
          {{ pkg.label || pkg.databaseId }} - {{ pkg.description || pkg.databaseId }}
        </option>
      </select>

      <button
        @click="installSelectedDatabase"
        class="default-button-cyan h-8 px-3 text-xs whitespace-nowrap"
        :disabled="
          !selectedDatabaseId || isLoading || isInstalling || isJobActive || !packages.length
        "
      >
        {{ installButtonLabel }}
      </button>
    </div>

    <div v-if="checkedAt" class="text-xs text-gray-500">
      Last checked: {{ formatCheckedAt(checkedAt) }}
    </div>

    <div v-if="jobId" class="text-xs text-cyan-400">
      Job {{ jobId }}: {{ jobStatus || 'started' }}
    </div>

    <div v-if="feedbackMessage" :class="feedbackClass" class="text-xs">
      {{ feedbackMessage }}
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import apiPinsService from '@/services/apiPinsService';

const packages = ref([]);
const selectedDatabaseId = ref('');
const checkedAt = ref('');

const isLoading = ref(false);
const isInstalling = ref(false);
const jobId = ref('');
const jobStatus = ref('');

const feedbackMessage = ref('');
const feedbackTone = ref('info');

let pollTimer = null;

const isJobActive = computed(() => {
  const status = normalizeStatus(jobStatus.value);
  return status === 'started' || status === 'running';
});

const installButtonLabel = computed(() => {
  if (isJobActive.value) {
    return 'Installing...';
  }
  if (isInstalling.value) {
    return 'Starting...';
  }
  return 'Install';
});

const feedbackClass = computed(() => {
  if (feedbackTone.value === 'success') {
    return 'text-green-400';
  }
  if (feedbackTone.value === 'error') {
    return 'text-red-400';
  }
  return 'text-gray-300';
});

function normalizeStatus(value) {
  return String(value || '').toLowerCase();
}

function setFeedback(message, tone = 'info') {
  feedbackMessage.value = message;
  feedbackTone.value = tone;
}

function clearPollTimer() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

function scheduleJobPoll(delayMs = 1500) {
  clearPollTimer();
  if (!jobId.value || !isJobActive.value) {
    return;
  }

  pollTimer = setTimeout(() => {
    pollJobStatus();
  }, delayMs);
}

function extractErrorDetail(error) {
  const details = error?.response?.data;
  if (typeof details === 'string' && details.trim()) {
    return details.trim();
  }
  if (details && typeof details.detail === 'string' && details.detail.trim()) {
    return details.detail.trim();
  }
  if (details && typeof details.message === 'string' && details.message.trim()) {
    return details.message.trim();
  }
  return error?.message || 'Unknown error';
}

function formatCheckedAt(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function extractJobId(data) {
  if (data && typeof data === 'object' && data.jobId) {
    return String(data.jobId);
  }
  if (typeof data === 'string' || typeof data === 'number') {
    return String(data);
  }
  return '';
}

async function loadPackages() {
  isLoading.value = true;
  try {
    const payload = (await apiPinsService.getAstapStarDatabases()) || {};
    const availablePackages = Array.isArray(payload.packages) ? payload.packages : [];
    packages.value = availablePackages;
    checkedAt.value = payload.checkedAt || '';

    if (!availablePackages.some((pkg) => pkg.databaseId === selectedDatabaseId.value)) {
      selectedDatabaseId.value = availablePackages[0]?.databaseId || '';
    }

    if (!availablePackages.length) {
      setFeedback('All ASTAP star databases are already installed.', 'info');
    } else if (feedbackTone.value !== 'error') {
      setFeedback('');
    }
  } catch (error) {
    console.error('Failed to load ASTAP star databases:', error);
    setFeedback(`Failed to load databases: ${extractErrorDetail(error)}`, 'error');
  } finally {
    isLoading.value = false;
  }
}

async function pollJobStatus() {
  if (!jobId.value) {
    return;
  }

  try {
    const response = await apiPinsService.getPinsDaemonJob(jobId.value);

    const currentStatus = normalizeStatus(response?.status);
    jobStatus.value = currentStatus || 'running';

    if (currentStatus === 'success') {
      isInstalling.value = false;
      setFeedback(
        `ASTAP star database ${selectedDatabaseId.value} installed successfully.`,
        'success'
      );
      await loadPackages();
      return;
    }

    if (currentStatus === 'failed') {
      isInstalling.value = false;
      const exitCode = response?.exitCode ?? response?.exit_code;
      setFeedback(
        `ASTAP star database install failed${typeof exitCode === 'number' ? ` (exit code ${exitCode})` : ''}.`,
        'error'
      );
      await loadPackages();
      return;
    }

    scheduleJobPoll();
  } catch (error) {
    if (error?.response?.status === 401) {
      isInstalling.value = false;
      setFeedback('Unauthorized while checking install status.', 'error');
      return;
    }

    // Keep polling for transient errors while the job may still be running.
    setFeedback(`Status check failed: ${extractErrorDetail(error)}. Retrying...`, 'info');
    scheduleJobPoll(2500);
  }
}

async function installSelectedDatabase() {
  if (
    !selectedDatabaseId.value ||
    isLoading.value ||
    isInstalling.value ||
    isJobActive.value ||
    !packages.value.length
  ) {
    return;
  }

  isInstalling.value = true;
  setFeedback(`Starting installation for ${selectedDatabaseId.value}...`, 'info');

  try {
    const data = (await apiPinsService.installAstapStarDatabase(selectedDatabaseId.value)) || {};
    const returnedJobId = extractJobId(data);
    if (!returnedJobId) {
      isInstalling.value = false;
      setFeedback('Install request succeeded but no jobId was returned.', 'error');
      await loadPackages();
      return;
    }

    jobId.value = returnedJobId;
    jobStatus.value = normalizeStatus(data.status) || 'started';
    setFeedback(`Install job started for ${selectedDatabaseId.value}.`, 'info');
    scheduleJobPoll(0);
  } catch (error) {
    isInstalling.value = false;

    if (error?.response?.status === 409) {
      setFeedback(extractErrorDetail(error), 'info');
      await loadPackages();
      return;
    }

    if (error?.response?.status === 401) {
      setFeedback('Unauthorized while starting ASTAP star database install.', 'error');
      return;
    }

    setFeedback(`Failed to start install: ${extractErrorDetail(error)}`, 'error');
  }
}

onMounted(() => {
  loadPackages();
});

onBeforeUnmount(() => {
  clearPollTimer();
});
</script>
