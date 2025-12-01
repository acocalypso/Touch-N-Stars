<template>
  <div class="px-6 py-10 text-gray-100">
    <div class="mx-auto max-w-6xl space-y-8">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold text-white">System Metrics</h1>
          <p class="text-sm text-gray-400">
            Auto refresh every {{ autoRefreshSeconds }}s · Last refreshed: {{ lastUpdatedText }}
          </p>
          <p v-if="backendTimestampText" class="text-xs text-gray-500">
            Backend timestamp: {{ backendTimestampText }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="pending && !loading" class="text-xs text-gray-400"> Updating... </span>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md border border-indigo-400 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            @click="handleManualRefresh"
            :disabled="pending"
          >
            <svg
              v-if="loading"
              class="h-4 w-4 animate-spin text-indigo-200"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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
                d="M4 12a8 8 0 018-8"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
              ></path>
            </svg>
            <svg
              v-else
              class="h-4 w-4 text-indigo-200"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.93 4.93a10 10 0 0114.14 0l1.06 1.06M19.07 19.07a10 10 0 01-14.14 0L3.87 18"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M4.22 10.22v-5h5M19.78 13.78v5h-5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
            <span>{{ loading ? 'Refreshing' : 'Refresh' }}</span>
          </button>
        </div>
      </header>

      <div
        v-if="errorMessage"
        class="rounded-md border border-red-500/60 bg-red-500/10 p-4 text-sm text-red-100"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="isInitialLoading"
        class="rounded-md border border-gray-700 bg-gray-900/60 p-6 text-sm text-gray-400"
      >
        Loading system metrics...
      </div>

      <div v-else-if="metrics" class="space-y-8">
        <section class="grid gap-6 md:grid-cols-2">
          <article class="rounded-xl border border-gray-700 bg-gray-900/60 p-6 shadow-lg">
            <header class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-white">CPU Usage</h2>
              <span class="text-sm text-gray-400">{{ formatPercent(cpuUsagePercent) }} used</span>
            </header>
            <div class="mt-4 h-3 rounded-full bg-gray-800">
              <div
                class="h-full rounded-full bg-indigo-500 transition-all duration-500"
                :style="{ width: percentToWidth(cpuUsagePercent) }"
              ></div>
            </div>
          </article>

          <article
            v-if="memoryMetrics"
            class="rounded-xl border border-gray-700 bg-gray-900/60 p-6 shadow-lg"
          >
            <header class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-white">Memory</h2>
              <span class="text-sm text-gray-400"
                >{{ formatPercent(memoryUsagePercent) }} used</span
              >
            </header>
            <div class="mt-4 h-3 rounded-full bg-gray-800">
              <div
                class="h-full rounded-full bg-emerald-500 transition-all duration-500"
                :style="{ width: percentToWidth(memoryUsagePercent) }"
              ></div>
            </div>
            <dl class="mt-4 space-y-2 text-sm text-gray-300">
              <div class="flex justify-between">
                <dt>Used</dt>
                <dd>{{ formatBytes(memoryMetrics.UsedBytes) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt>Available</dt>
                <dd>{{ formatBytes(memoryMetrics.AvailableBytes) }}</dd>
              </div>
              <div class="flex justify-between text-gray-400">
                <dt>Total</dt>
                <dd>{{ formatBytes(memoryMetrics.TotalBytes) }}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section v-if="diskMetrics.length" class="space-y-4">
          <h2 class="text-lg font-semibold text-white">Disks</h2>
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="disk in diskMetrics"
              :key="disk.Name"
              class="rounded-xl border border-gray-700 bg-gray-900/60 p-5 shadow-md"
            >
              <header class="flex items-center justify-between">
                <h3 class="text-base font-semibold text-white">{{ disk.Name }}</h3>
                <span class="text-xs text-gray-400"
                  >{{ formatPercent(disk.UsedPercent) }} used</span
                >
              </header>
              <div class="mt-3 h-2.5 rounded-full bg-gray-800">
                <div
                  class="h-full rounded-full bg-sky-500 transition-all duration-500"
                  :style="{ width: percentToWidth(disk.UsedPercent) }"
                ></div>
              </div>
              <dl class="mt-4 space-y-1.5 text-xs text-gray-300">
                <div class="flex justify-between">
                  <dt>Used</dt>
                  <dd>{{ formatBytes(disk.UsedBytes) }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt>Available</dt>
                  <dd>{{ formatBytes(disk.AvailableBytes) }}</dd>
                </div>
                <div class="flex justify-between text-gray-400">
                  <dt>Total</dt>
                  <dd>{{ formatBytes(disk.TotalBytes) }}</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>
      </div>

      <div
        v-else
        class="rounded-md border border-gray-700 bg-gray-900/60 p-6 text-sm text-gray-400"
      >
        No metrics available. Try refreshing the dashboard.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import systemMetricsService from '../services/systemMetricsService';

const REFRESH_INTERVAL_MS = 10000;
const autoRefreshSeconds = REFRESH_INTERVAL_MS / 1000;

const metrics = ref(null);
const pending = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const lastPolledAt = ref(null);

let refreshTimerId;

const percentFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

const toSafeNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const clampPercent = (value) => {
  const numeric = toSafeNumber(value);
  return Math.min(100, Math.max(0, numeric));
};

const percentToWidth = (value) => `${clampPercent(value)}%`;

const formatPercent = (value) => `${percentFormatter.format(clampPercent(value))}%`;

const formatBytes = (bytes) => {
  const numeric = Number(bytes);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '0 B';
  }

  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  const exponent = Math.min(Math.floor(Math.log(numeric) / Math.log(1024)), units.length - 1);
  const value = numeric / Math.pow(1024, exponent);
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[exponent]}`;
};

const parseBackendTimestamp = (timestamp) => {
  if (!timestamp) {
    return null;
  }

  const hasTimezone = /[z+-]/i.test(timestamp);
  const normalized = hasTimezone ? timestamp : `${timestamp}Z`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const backendTimestamp = computed(() => parseBackendTimestamp(metrics.value?.TimestampUtc));

const backendTimestampText = computed(() => {
  if (!backendTimestamp.value) {
    return '';
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(backendTimestamp.value);
});

const lastUpdatedText = computed(() => {
  if (!lastPolledAt.value) {
    return 'Never';
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(lastPolledAt.value);
});

const cpuUsagePercent = computed(() => clampPercent(metrics.value?.CpuUsagePercent));
const memoryMetrics = computed(() => metrics.value?.Memory ?? null);
const memoryUsagePercent = computed(() => clampPercent(memoryMetrics.value?.UsedPercent));
const diskMetrics = computed(() => metrics.value?.Disks ?? []);

const isInitialLoading = computed(() => !metrics.value && pending.value);

const fetchMetrics = async (options = {}) => {
  const { silent = false } = options;

  if (pending.value) {
    return;
  }

  pending.value = true;
  if (!silent) {
    loading.value = true;
    errorMessage.value = '';
  }

  try {
    const data = await systemMetricsService.fetchSystemMetrics();
    metrics.value = data;
    lastPolledAt.value = new Date();
    errorMessage.value = '';
  } catch (error) {
    const message = error?.message || 'Unable to load system metrics';
    errorMessage.value = message;
  } finally {
    if (!silent) {
      loading.value = false;
    }
    pending.value = false;
  }
};

const scheduleAutoRefresh = () => {
  clearInterval(refreshTimerId);
  // Ensure the timer resets after manual refreshes so cadence stays consistent
  refreshTimerId = setInterval(() => {
    fetchMetrics({ silent: true });
  }, REFRESH_INTERVAL_MS);
};

const handleManualRefresh = async () => {
  await fetchMetrics();
  scheduleAutoRefresh();
};

onMounted(() => {
  fetchMetrics();
  scheduleAutoRefresh();
});

onBeforeUnmount(() => {
  clearInterval(refreshTimerId);
});
</script>
