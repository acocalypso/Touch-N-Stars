<template>
  <div class="px-4 py-6 lg:px-8">
    <div class="mx-auto max-w-3xl space-y-6">
      <!-- Header -->
      <header
        class="rounded-2xl border border-gray-700/70 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-5 shadow-lg backdrop-blur"
      >
        <h1 class="text-2xl font-bold text-white">{{ $t('plugins.filterOffset.title') }}</h1>
        <p class="mt-1 text-sm text-gray-400">{{ $t('plugins.filterOffset.subtitle') }}</p>
      </header>

      <!-- ── Setup section (visible when Idle / Error) ─────────────────────── -->
      <section v-if="status.State === 'Idle' || status.State === 'Error'" class="space-y-4">
        <!-- Iterations -->
        <div
          class="flex items-center gap-4 rounded-xl border border-gray-700/70 bg-gray-900/50 p-4"
        >
          <label class="w-40 shrink-0 text-sm text-gray-300">
            {{ $t('plugins.filterOffset.iterations') }}
          </label>
          <input
            v-model.number="loops"
            type="number"
            min="1"
            max="20"
            class="w-24 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-center text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <!-- Filter selection table -->
        <div class="rounded-xl border border-gray-700/70 bg-gray-900/50 p-4">
          <h2 class="mb-3 text-sm font-semibold text-gray-300">
            {{ $t('plugins.filterOffset.selectFilters') }}
          </h2>

          <div v-if="filters.length === 0" class="py-8 text-center text-gray-500">
            {{ $t('plugins.filterOffset.noFilters') }}
          </div>

          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-700 text-left text-xs text-gray-400">
                <th class="pb-2 pr-4 font-medium">{{ $t('plugins.filterOffset.calculate') }}</th>
                <th class="pb-2 pr-4 font-medium">{{ $t('plugins.filterOffset.position') }}</th>
                <th class="pb-2 font-medium">{{ $t('plugins.filterOffset.filter') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="f in filters"
                :key="f.position"
                class="border-b border-gray-800/50 last:border-0"
              >
                <td class="py-2 pr-4">
                  <input
                    type="checkbox"
                    :checked="selectedPositions.includes(f.position)"
                    @change="toggleFilter(f.position)"
                    class="h-4 w-4 rounded border-gray-600 bg-gray-800 accent-blue-500"
                  />
                </td>
                <td class="py-2 pr-4 text-gray-400">{{ f.position }}</td>
                <td class="py-2 text-white">{{ f.name }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Error message -->
        <div
          v-if="status.State === 'Error'"
          class="rounded-xl border border-red-700/50 bg-red-900/30 p-4 text-sm text-red-300"
        >
          {{ $t('plugins.filterOffset.errorLabel') }}: {{ status.Error }}
        </div>

        <!-- Connection warnings -->
        <div v-if="connectionWarnings.length" class="space-y-1">
          <div
            v-for="(warn, i) in connectionWarnings"
            :key="'cw' + i"
            class="rounded-lg bg-amber-900/40 px-4 py-2 text-center text-sm text-amber-200"
          >
            {{ warn }}
          </div>
        </div>

        <!-- Validation issues -->
        <div v-if="issues.length" class="space-y-1">
          <div
            v-for="(issue, i) in issues"
            :key="i"
            class="rounded-lg bg-red-900/40 px-4 py-2 text-center text-sm text-red-200"
          >
            {{ issue }}
          </div>
        </div>

        <!-- Start button -->
        <button
          :disabled="
            selectedPositions.length < 2 ||
            loading ||
            !store.isCameraConnected ||
            !store.isFocuserConnected ||
            !store.isFilterConnected
          "
          class="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          @click="startCalculation"
        >
          {{ $t('plugins.filterOffset.start') }}
        </button>
      </section>

      <!-- ── Running section ────────────────────────────────────────────────── -->
      <section v-else-if="status.State === 'Running'" class="space-y-4">
        <div class="rounded-xl border border-blue-700/50 bg-blue-900/20 p-5 space-y-4">
          <!-- Loop progress -->
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-300">{{ $t('plugins.filterOffset.loop') }}</span>
            <span class="font-mono text-white">
              {{ status.CurrentLoop }} / {{ status.TotalLoops }}
            </span>
          </div>
          <div class="h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              class="h-full rounded-full bg-blue-500 transition-all"
              :style="{ width: loopProgressPct + '%' }"
            />
          </div>

          <!-- Filter progress -->
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-300">{{ $t('plugins.filterOffset.filterProgress') }}</span>
            <span class="font-mono text-white">
              {{ status.CurrentFilterIndex }} / {{ status.TotalFilters }}
            </span>
          </div>
          <div class="h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              class="h-full rounded-full bg-green-500 transition-all"
              :style="{ width: filterProgressPct + '%' }"
            />
          </div>

          <!-- Current filter name -->
          <p v-if="status.CurrentFilterName" class="text-center text-sm text-gray-300">
            {{ $t('plugins.filterOffset.runningFilter') }}:
            <span class="font-semibold text-white">{{ status.CurrentFilterName }}</span>
          </p>
        </div>

        <!-- Stop button -->
        <button
          class="w-full rounded-xl bg-red-700 px-6 py-3 font-semibold text-white transition hover:bg-red-600"
          @click="stopCalculation"
        >
          {{ $t('plugins.filterOffset.stop') }}
        </button>
      </section>

      <!-- ── Result / pending dialog section ───────────────────────────────── -->
      <section v-else-if="status.State === 'PendingResult' && result" class="space-y-5">
        <!-- Old / New offsets side by side -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Old offsets -->
          <div class="rounded-xl border border-gray-700/70 bg-gray-900/50 p-4">
            <h3 class="mb-3 text-sm font-semibold text-gray-300">
              {{ $t('plugins.filterOffset.currentOffsets') }}
            </h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-700 text-xs text-gray-400">
                  <th class="pb-2 pr-2 font-medium text-left">
                    {{ $t('plugins.filterOffset.position') }}
                  </th>
                  <th class="pb-2 pr-2 font-medium text-left">
                    {{ $t('plugins.filterOffset.filter') }}
                  </th>
                  <th class="pb-2 font-medium text-right">
                    {{ $t('plugins.filterOffset.offset') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="o in result.OldOffsets"
                  :key="o.Position"
                  class="border-b border-gray-800/50 last:border-0"
                >
                  <td class="py-1.5 pr-2 text-gray-400">{{ o.Position }}</td>
                  <td class="py-1.5 pr-2 text-white">{{ o.Name }}</td>
                  <td class="py-1.5 text-right font-mono text-gray-300">{{ o.FocusOffset }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- New offsets -->
          <div class="rounded-xl border border-green-700/50 bg-green-900/10 p-4">
            <h3 class="mb-3 text-sm font-semibold text-green-300">
              {{ $t('plugins.filterOffset.newOffsets') }}
            </h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-700 text-xs text-gray-400">
                  <th class="pb-2 pr-2 font-medium text-left">
                    {{ $t('plugins.filterOffset.position') }}
                  </th>
                  <th class="pb-2 pr-2 font-medium text-left">
                    {{ $t('plugins.filterOffset.filter') }}
                  </th>
                  <th class="pb-2 font-medium text-right">
                    {{ $t('plugins.filterOffset.offset') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="o in displayedNewOffsets"
                  :key="o.Position"
                  class="border-b border-gray-800/50 last:border-0"
                >
                  <td class="py-1.5 pr-2 text-gray-400">{{ o.Position }}</td>
                  <td class="py-1.5 pr-2 text-white">{{ o.Name }}</td>
                  <td class="py-1.5 text-right font-mono text-green-200">{{ o.FocusOffset }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Use Relative Offsets toggle -->
        <div
          class="flex items-center justify-between rounded-xl border border-gray-700/70 bg-gray-900/50 px-5 py-3"
        >
          <label class="text-sm text-gray-300">{{
            $t('plugins.filterOffset.useRelativeOffsets')
          }}</label>
          <button
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              useRelativeOffsets ? 'bg-blue-600' : 'bg-gray-700',
            ]"
            @click="useRelativeOffsets = !useRelativeOffsets"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                useRelativeOffsets ? 'translate-x-6' : 'translate-x-1',
              ]"
            />
          </button>
        </div>

        <!-- Old AutoFocus filter -->
        <div
          class="flex items-center gap-4 rounded-xl border border-gray-700/70 bg-gray-900/50 px-5 py-3"
        >
          <span class="flex-1 text-sm text-gray-400">{{
            $t('plugins.filterOffset.currentAutoFocusFilter')
          }}</span>
          <span class="text-sm text-white">{{
            oldDefaultFilterName || $t('plugins.filterOffset.none')
          }}</span>
        </div>

        <!-- New AutoFocus filter selector -->
        <div
          class="flex items-center gap-4 rounded-xl border border-gray-700/70 bg-gray-900/50 px-5 py-3"
        >
          <label class="flex-1 shrink-0 text-sm text-gray-300">
            {{ $t('plugins.filterOffset.newAutoFocusFilter') }}
          </label>
          <select
            v-model="newDefaultFilterPosition"
            class="w-40 rounded-lg border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option :value="null">{{ $t('plugins.filterOffset.none') }}</option>
            <option v-for="o in result.NewOffsets" :key="o.Position" :value="o.Position">
              {{ o.Name }}
            </option>
          </select>
        </div>

        <!-- Accept / Abort buttons -->
        <div class="grid grid-cols-2 gap-3">
          <button
            class="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-600"
            :disabled="loading"
            @click="applyResult"
          >
            {{ $t('plugins.filterOffset.accept') }}
          </button>
          <button
            class="rounded-xl border border-gray-600 bg-gray-800 px-6 py-3 font-semibold text-gray-200 transition hover:bg-gray-700"
            :disabled="loading"
            @click="discardResult"
          >
            {{ $t('plugins.filterOffset.abort') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { getActivePinia } from 'pinia';
import { apiStore } from '@/store/store';

const { t } = useI18n();
const store = apiStore();

// ── API base URL ────────────────────────────────────────────────────────────
function getApiUrl() {
  const pinia = getActivePinia();
  const settings = pinia?._s.get('settings');
  const protocol = settings?.backendProtocol || 'http';
  const host = settings?.connection?.ip || window.location.hostname;
  const port = settings?.connection?.port || window.location.port || 80;
  return `${protocol}://${host}:${port}/api`;
}

// ── Reactive state ──────────────────────────────────────────────────────────
const filters = ref([]);
const selectedPositions = ref([]);
const loops = ref(3);
const loading = ref(false);

const status = ref({
  State: 'Idle',
  CurrentLoop: 0,
  TotalLoops: 0,
  CurrentFilterIndex: 0,
  TotalFilters: 0,
  CurrentFilterName: '',
  Error: '',
});

const result = ref(null);
const useRelativeOffsets = ref(false);
const newDefaultFilterPosition = ref(null);

const issues = ref([]);

// ── Connection warnings (computed, no state) ────────────────────────────────
const connectionWarnings = computed(() => {
  const warns = [];
  if (!store.isCameraConnected)
    warns.push(
      t('plugins.filterOffset.notConnected', { device: t('plugins.filterOffset.deviceCamera') })
    );
  if (!store.isFocuserConnected)
    warns.push(
      t('plugins.filterOffset.notConnected', { device: t('plugins.filterOffset.deviceFocuser') })
    );
  if (!store.isFilterConnected)
    warns.push(
      t('plugins.filterOffset.notConnected', {
        device: t('plugins.filterOffset.deviceFilterWheel'),
      })
    );
  return warns;
});

let pollTimer = null;

// ── Computed ────────────────────────────────────────────────────────────────
const loopProgressPct = computed(() => {
  if (!status.value.TotalLoops) return 0;
  return Math.round((status.value.CurrentLoop / status.value.TotalLoops) * 100);
});

const filterProgressPct = computed(() => {
  if (!status.value.TotalFilters) return 0;
  return Math.round((status.value.CurrentFilterIndex / status.value.TotalFilters) * 100);
});

/** Returns new offsets adjusted for relative mode */
const displayedNewOffsets = computed(() => {
  if (!result.value) return [];
  if (!useRelativeOffsets.value || newDefaultFilterPosition.value === null) {
    return result.value.NewOffsets;
  }
  const base = result.value.NewOffsets.find((o) => o.Position === newDefaultFilterPosition.value);
  const baseVal = base ? base.FocusOffset : 0;
  return result.value.NewOffsets.map((o) => ({ ...o, FocusOffset: o.FocusOffset - baseVal }));
});

const oldDefaultFilterName = computed(() => {
  if (result.value?.OldDefaultFilterPosition == null) return null;
  const f = filters.value.find((f) => f.position === result.value.OldDefaultFilterPosition);
  return f?.name ?? null;
});

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchFilters();
  await fetchStatus();
  startPolling();
});

onBeforeUnmount(() => {
  stopPolling();
});

// ── Data fetching ────────────────────────────────────────────────────────────
async function fetchFilters() {
  try {
    const { data } = await axios.get(`${getApiUrl()}/filter-offset/filters`);
    if (data.Success) {
      filters.value = data.Response.Filters ?? [];
      // Pre-select all filters by default (mirrors WPF behaviour)
      if (selectedPositions.value.length === 0) {
        selectedPositions.value = filters.value.map((f) => f.position);
      }
    }
  } catch (err) {
    console.error('[FilterOffset] fetchFilters error:', err);
  }
}

async function fetchStatus() {
  try {
    const { data } = await axios.get(`${getApiUrl()}/filter-offset/status`);
    if (data.Success) {
      status.value = data.Response;

      if (data.Response.State === 'PendingResult' && !result.value) {
        await fetchResult();
      }
    }
  } catch (err) {
    console.error('[FilterOffset] fetchStatus error:', err);
  }
}

async function fetchResult() {
  try {
    const { data } = await axios.get(`${getApiUrl()}/filter-offset/result`);
    if (data.Success) {
      result.value = data.Response;
      newDefaultFilterPosition.value = data.Response.SuggestedDefaultFilterPosition ?? null;
    }
  } catch (err) {
    console.error('[FilterOffset] fetchResult error:', err);
  }
}

// ── Polling ──────────────────────────────────────────────────────────────────
function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(fetchStatus, 2000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────
function toggleFilter(position) {
  const idx = selectedPositions.value.indexOf(position);
  if (idx >= 0) {
    selectedPositions.value.splice(idx, 1);
  } else {
    selectedPositions.value.push(position);
  }
  validateSelection();
}

function validateSelection() {
  issues.value = [];
  if (selectedPositions.value.length < 2) {
    issues.value.push(t('plugins.filterOffset.minTwoFilters'));
  }
}

async function startCalculation() {
  validateSelection();
  if (issues.value.length) return;

  loading.value = true;
  try {
    await axios.post(`${getApiUrl()}/filter-offset/start`, {
      Loops: loops.value,
      FilterPositions: selectedPositions.value,
    });
    result.value = null;
    useRelativeOffsets.value = false;
    await fetchStatus();
  } catch (err) {
    console.error('[FilterOffset] start error:', err);
    issues.value.push(err.response?.data?.Error ?? err.message);
  } finally {
    loading.value = false;
  }
}

async function stopCalculation() {
  try {
    await axios.get(`${getApiUrl()}/filter-offset/stop`);
  } catch (err) {
    console.error('[FilterOffset] stop error:', err);
  }
}

async function applyResult() {
  loading.value = true;
  try {
    await axios.post(`${getApiUrl()}/filter-offset/apply`, {
      UseRelativeOffsets: useRelativeOffsets.value,
      NewDefaultFilterPosition: newDefaultFilterPosition.value,
    });
    result.value = null;
    await fetchFilters();
    await fetchStatus();
  } catch (err) {
    console.error('[FilterOffset] apply error:', err);
  } finally {
    loading.value = false;
  }
}

async function discardResult() {
  loading.value = true;
  try {
    await axios.get(`${getApiUrl()}/filter-offset/discard`);
    result.value = null;
    await fetchStatus();
  } catch (err) {
    console.error('[FilterOffset] discard error:', err);
  } finally {
    loading.value = false;
  }
}
</script>
