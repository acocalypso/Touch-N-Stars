<template>
  <div class="container py-10">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-white">PlateSolvePlus</h2>
          <p class="text-gray-400 text-sm mt-1">
            Remote PlatesolvePlus Console for your alternative Platesolve Camera V2
          </p>
        </div>

        <div class="text-xs text-gray-400">
          <div class="flex items-center gap-2 justify-end">
            <span class="inline-flex items-center gap-2">
              <span
                class="w-2 h-2 rounded-full"
                :class="wsConnected ? 'bg-green-500' : 'bg-gray-600'"
              ></span>
              WS {{ wsConnected ? 'connected' : 'disconnected' }}
            </span>
            <span class="text-gray-600">|</span>
            <span class="font-mono">{{ baseUrl }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div
        class="border border-gray-700 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg"
      >
        <div class="flex border-b border-gray-700">
          <button
            class="px-4 py-3 text-sm font-semibold"
            :class="
              activeTab === 'control'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            "
            @click="activeTab = 'control'"
          >
            Control
          </button>
          <button
            class="px-4 py-3 text-sm font-semibold"
            :class="
              activeTab === 'config'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            "
            @click="activeTab = 'config'"
          >
            Config
          </button>
        </div>

        <!-- CONTROL TAB -->
        <div v-if="activeTab === 'control'" class="p-5 space-y-5">
          <!-- Status -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
              <div class="flex items-center justify-between">
                <h3 class="text-white font-semibold">Status</h3>
                <button
                  class="text-xs px-3 py-1 rounded-md border border-gray-600 text-gray-200 hover:bg-white/10"
                  @click="refreshStatus"
                  :disabled="loadingStatus"
                >
                  {{ loadingStatus ? 'Refreshing…' : 'Refresh' }}
                </button>
              </div>

				<div class="mt-3 grid grid-cols-2 gap-2 text-sm">
				  <!-- green=true / red=false (Busy is inverted) -->
				  <StatusIcon label="busy" :value="status.busy === false" />
				  <StatusIcon label="importsReady" :value="!!status.importsReady" />
				  <StatusIcon label="mountConnected" :value="!!status.mountConnected" />
				  <StatusIcon label="secondaryConnected" :value="!!status.secondaryConnected" />
				</div>


              <div class="mt-3 text-xs text-gray-400 space-y-1">
                <div>
                  Last update:
                  <span class="text-gray-200">{{
                    lastStatusTs ? new Date(lastStatusTs).toLocaleString() : '—'
                  }}</span>
                </div>
                <div>
                  <span class="text-gray-400">statusText:</span>
                  <span class="text-gray-200">{{ status.statusText ?? '—' }}</span>
                </div>
                <div>
                  <span class="text-gray-400">detailsText:</span>
                  <span class="text-gray-300">{{ status.detailsText ?? '—' }}</span>
                </div>
                <div v-if="status.lastSolveSummary" class="pt-2 border-t border-gray-700">
                  <div class="text-gray-400">lastSolveSummary:</div>
                  <pre
                    class="text-xs text-gray-200 bg-black/30 border border-gray-700 rounded-md p-2 overflow-auto max-h-40"
                    >{{ status.lastSolveSummary }}</pre
                  >
                </div>
              </div>
            </div>

            <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
              <h3 class="text-white font-semibold">Actions</h3>

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  class="px-4 py-2 rounded-md bg-white text-black font-semibold hover:bg-gray-200 disabled:opacity-40"
                  @click="triggerCapture()"
                  :disabled="status.busy || !status.importsReady"
                  title="POST /capture"
                >
                  Capture
                </button>

                <button
                  class="px-4 py-2 rounded-md bg-white text-black font-semibold hover:bg-gray-200 disabled:opacity-40"
                  @click="triggerSolve()"
                  :disabled="status.busy || !status.importsReady"
                  title="POST /solve"
                >
                  Solve
                </button>

                <button
                  class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10 disabled:opacity-40"
                  @click="calibrateOffset()"
                  :disabled="status.busy || !status.mountConnected"
                  title="POST /offset/calibrate"
                >
                  Calibrate Offset
                </button>

                <button
                  class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10"
                  @click="refreshPreview(true)"
                >
                  Refresh Preview
                </button>
              </div>

              <!-- Progress (synthetic) -->
              <div class="mt-4 border border-gray-700 rounded-lg p-3 bg-black/20">
                <div class="flex items-center justify-between">
                  <div class="text-white text-sm font-semibold">Solve Progress</div>
                  <div class="text-xs text-gray-400">
                    Job: <span class="text-gray-200">{{ activeJobId ?? '—' }}</span>
                  </div>
                </div>

                <div class="mt-2 text-xs text-gray-300">
                  <div><span class="text-gray-400">Stage:</span> {{ progress.stage ?? '—' }}</div>
                  <div class="mt-1">
                    <span class="text-gray-400">Message:</span> {{ progress.message ?? '—' }}
                  </div>
                </div>

                <div class="mt-3 h-2 w-full bg-gray-700 rounded">
                  <div
                    class="h-2 bg-white rounded"
                    :style="{ width: progress.percent + '%' }"
                  ></div>
                </div>
                <div class="mt-1 text-xs text-gray-400">{{ progress.percent }}%</div>

                <div class="mt-2 text-[11px] text-gray-500">
                  Fake-Progress läuft zwischen <span class="font-mono">SolveStarted</span> und
                  <span class="font-mono">SolveFinished</span>.
                </div>
              </div>
            </div>
          </div>

          <!-- Preview + Offset -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
              <div class="flex items-center justify-between">
                <h3 class="text-white font-semibold">Preview</h3>
                <div class="flex items-center gap-2">
                  <label class="text-xs text-gray-300 inline-flex items-center gap-2 select-none">
                    <input type="checkbox" v-model="autoPreview" class="rounded" />
                    Auto refresh
                  </label>
                </div>
              </div>

              <div class="mt-3">
                <div
                  v-if="previewError"
                  class="text-xs text-red-300 border border-red-700/60 bg-red-900/20 rounded-md p-2"
                >
                  {{ previewError }}
                </div>

                <div
                  v-if="previewUrl"
                  class="mt-2 border border-gray-700 rounded-md overflow-hidden bg-black/30"
                >
                  <img :src="previewUrl" alt="Latest preview" class="w-full object-contain" />
                </div>

                <div v-else class="mt-2 text-xs text-gray-400">
                  Kein Preview geladen (oder Endpoint liefert noch nichts).
                </div>

                <div class="mt-2 text-xs text-gray-500">
                  Cache-Buster aktiv (<code>?t=</code>), und Server setzt zusätzlich
                  <code>Cache-Control: no-store</code>.
                </div>
              </div>
            </div>

            <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
              <h3 class="text-white font-semibold">Offset</h3>

              <div class="mt-3 text-sm text-gray-300 space-y-1">
                <div>
                  <span class="text-gray-400">offsetEnabled:</span>
                  <span class="text-gray-100 font-mono">{{
                    status.offsetEnabled ? 'true' : 'false'
                  }}</span>
                </div>
                <div>
                  <span class="text-gray-400">offsetMode:</span>
                  <span class="text-gray-100 font-mono">{{ status.offsetMode ?? '—' }}</span>
                </div>
                <div>
                  <span class="text-gray-400">ΔRA (arcsec):</span>
                  <span class="text-gray-100 font-mono">{{ status.offsetRaArcsec ?? '—' }}</span>
                </div>
                <div>
                  <span class="text-gray-400">ΔDec (arcsec):</span>
                  <span class="text-gray-100 font-mono">{{ status.offsetDecArcsec ?? '—' }}</span>
                </div>
                <div>
                  <span class="text-gray-400">rotation (quat):</span>
                  <span class="text-gray-100 font-mono">{{
                    status.rotation ? pretty(status.rotation) : '—'
                  }}</span>
                </div>
              </div>

              <div class="mt-4 border-t border-gray-700 pt-4">
                <div class="text-white text-sm font-semibold mb-2">Last result/status payload</div>
                <pre
                  class="text-xs text-gray-200 bg-black/30 border border-gray-700 rounded-md p-3 overflow-auto max-h-56"
                  >{{ pretty(status) }}</pre
                >
              </div>
            </div>
          </div>

          <!-- Event log -->
          <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
            <div class="flex items-center justify-between">
              <h3 class="text-white font-semibold">Event Log</h3>
              <button
                class="text-xs px-3 py-1 rounded-md border border-gray-600 text-gray-200 hover:bg-white/10"
                @click="log = []"
              >
                Clear
              </button>
            </div>
            <div class="mt-3 text-xs font-mono text-gray-200 space-y-1 max-h-56 overflow-auto">
              <div v-if="log.length === 0" class="text-gray-500">—</div>
              <div v-for="(line, idx) in log" :key="idx" class="whitespace-pre-wrap">
                {{ line }}
              </div>
            </div>
          </div>
        </div>

        <!-- CONFIG TAB -->
        <div v-else class="p-5 space-y-5">
          <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
            <h3 class="text-white font-semibold">Connection</h3>

            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-400">Host</label>
                <input
                  v-model.trim="cfg.host"
                  class="mt-1 w-full px-3 py-2 rounded-md bg-black/30 border border-gray-700 text-gray-100"
                  placeholder="127.0.0.1"
                />
              </div>

              <div>
                <label class="text-xs text-gray-400">Port</label>
                <input
                  v-model.number="cfg.port"
                  type="number"
                  min="1"
                  max="65535"
                  class="mt-1 w-full px-3 py-2 rounded-md bg-black/30 border border-gray-700 text-gray-100"
                  placeholder="1899"
                />
              </div>

              <div class="md:col-span-2">
                <label class="text-xs text-gray-400">Base Path</label>
                <input
                  v-model.trim="cfg.basePath"
                  class="mt-1 w-full px-3 py-2 rounded-md bg-black/30 border border-gray-700 text-gray-100"
                  placeholder="/api/platesolveplus"
                />
                <div class="mt-1 text-xs text-gray-500">
                  Default: <code>/api/platesolveplus</code>
                </div>
              </div>
            </div>

            <div class="mt-4 border-t border-gray-700 pt-4">
              <label class="text-xs text-gray-300 inline-flex items-center gap-2 select-none">
                <input type="checkbox" v-model="cfg.useToken" class="rounded" />
                Use token (optional)
              </label>

              <div class="mt-3">
                <label class="text-xs text-gray-400">Token</label>
                <input
                  v-model="cfg.token"
                  :disabled="!cfg.useToken"
                  class="mt-1 w-full px-3 py-2 rounded-md bg-black/30 border border-gray-700 text-gray-100 disabled:opacity-40"
                  placeholder="token…"
                />
                <div class="mt-1 text-xs text-gray-500">
                  Wird als Header <code>X-PSP-Token</code> gesendet (so erwartet es dein API Host).
                </div>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <button
                class="px-4 py-2 rounded-md bg-white text-black font-semibold hover:bg-gray-200"
                @click="saveConfig"
              >
                Save Config
              </button>
              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10"
                @click="loadConfig"
              >
                Reload from Storage
              </button>
              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10"
                @click="testConnection"
              >
                Test Connection
              </button>
            </div>

            <div
              v-if="testResult"
              class="mt-4 text-xs border rounded-md p-3"
              :class="
                testResult.ok
                  ? 'border-green-700/60 bg-green-900/20 text-green-200'
                  : 'border-red-700/60 bg-red-900/20 text-red-200'
              "
            >
              {{ testResult.message }}
            </div>

            <div class="mt-3 text-xs text-gray-500">
              Aktive URL: <span class="text-gray-200 font-mono">{{ baseUrl }}</span>
            </div>
          </div>

          <div class="border border-gray-700 rounded-lg p-4 bg-black/20">
            <h3 class="text-white font-semibold">WebSocket</h3>
            <div class="mt-2 text-xs text-gray-400">
              Endpoint: <span class="text-gray-200 font-mono">{{ wsUrl }}</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10"
                @click="connectWs(true)"
              >
                Reconnect WS
              </button>
              <button
                class="px-4 py-2 rounded-md border border-gray-600 text-gray-100 hover:bg-white/10"
                @click="disconnectWs"
              >
                Disconnect WS
              </button>
            </div>
            <div class="mt-3 text-xs text-gray-500">Auto-Reconnect aktiv (Backoff).</div>
          </div>
        </div>
      </div>

      <div class="mt-4 text-xs text-gray-600">
        REST:
        <span class="text-gray-300 font-mono">GET /status</span>,
        <span class="text-gray-300 font-mono">POST /capture</span>,
        <span class="text-gray-300 font-mono">POST /solve</span>,
        <span class="text-gray-300 font-mono">POST /offset/calibrate</span>,
        <span class="text-gray-300 font-mono">GET /preview/latest.jpg</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import StatusPill from '../components/StatusPill.vue';
import StatusIcon from '../components/StatusIcon.vue';
import { usePspConfig } from '../components/platesolveplus/usePspConfig';
import { usePspApi } from '../components/platesolveplus/usePspApi';
import { usePspWebSocket } from '../components/platesolveplus/usePspWebSocket';

const activeTab = ref('control');

// =========================
// State
// =========================
const status = reactive({
  busy: false,
  importsReady: false,
  mountConnected: false,
  secondaryConnected: false,

  statusText: null,
  detailsText: null,
  lastSolveSummary: null,
  lastGuiderSolveText: null,
  correctedSolveText: null,

  offsetEnabled: false,
  offsetMode: null,
  offsetRaArcsec: null,
  offsetDecArcsec: null,
  rotation: null,
});

const loadingStatus = ref(false);
const lastStatusTs = ref(null);

const activeJobId = ref(null);
const progress = reactive({ stage: null, message: null, percent: 0 });

const previewUrl = ref('');
const previewError = ref('');
const autoPreview = ref(true);

let log = ref([]);
const testResult = ref(null);

// Fake progress timer (between SolveStarted and SolveFinished)
let fakeProgressTimer = null;

function safeJson(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

function pretty(obj) {
  if (!obj) return '—';
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function pushLog(msg, obj) {
  const ts = new Date().toLocaleTimeString();
  const suffix = obj ? ` ${safeJson(obj)}` : '';
  log.value.unshift(`[${ts}] ${msg}${suffix}`);
  if (log.value.length > 250) log.value.length = 250;
}

// =========================
// Config + URLs
// =========================
const {
  cfg,
  baseUrl,
  wsUrl,
  authHeaders,
  saveConfig: saveCfg,
  loadConfig: loadCfg,
} = usePspConfig();

// =========================
// Preview
// =========================
function refreshPreview(force = false) {
  previewError.value = '';
  const t = Date.now();
  if (force || autoPreview.value) {
    previewUrl.value = `${baseUrl.value}/preview/latest.jpg?t=${t}`;
    pushLog('Preview refreshed');
  }
}

// =========================
// Progress helpers
// =========================
function resetProgress() {
  progress.stage = null;
  progress.message = null;
  progress.percent = 0;
}

function stopFakeProgress() {
  if (fakeProgressTimer) {
    clearInterval(fakeProgressTimer);
    fakeProgressTimer = null;
  }
}

function startFakeSolveProgress() {
  stopFakeProgress();

  progress.stage = 'solving';
  progress.message = 'Solving…';
  progress.percent = Math.max(progress.percent, 5);

  fakeProgressTimer = setInterval(() => {
    const target = 90;
    const cur = progress.percent;
    if (cur >= target) return;

    const step = Math.max(1, Math.floor((target - cur) * 0.12));
    progress.percent = Math.min(target, cur + step);

    if (progress.percent < 25) progress.stage = 'capturing';
    else if (progress.percent < 70) progress.stage = 'platesolving';
    else progress.stage = 'finishing';
  }, 450);
}

// =========================
// REST API composable
// =========================
const api = usePspApi({
  baseUrl,
  authHeaders,
  pushLog,
});

async function refreshStatus() {
  await api.refreshStatus({ status, lastStatusTs, loadingStatus });
}

async function triggerCapture() {
  await api.triggerCapture({
    activeJobId,
    refreshPreview,
    refreshStatusFn: refreshStatus,
  });
}

async function triggerSolve() {
  await api.triggerSolve({
    activeJobId,
    status,
    progress,
    startFakeSolveProgress,
  });
}

async function calibrateOffset() {
  await api.calibrateOffset({ activeJobId });
}

async function testConnection() {
  await api.testConnection({ testResult });
}

// =========================
// WebSocket composable
// =========================
function handleWsEvent(type, payload) {
  switch (type) {
    case 'Hello':
      break;

    case 'CaptureStarted':
      status.busy = true;
      progress.stage = 'capture';
      progress.message = 'Capture started';
      progress.percent = 5;
      activeJobId.value = payload.jobId ?? activeJobId.value;
      break;

    case 'CaptureFinished':
      status.busy = false;
      progress.stage = 'capture';
      progress.message = 'Capture finished';
      progress.percent = 100;
      activeJobId.value = payload.jobId ?? activeJobId.value;
      refreshPreview(true);
      refreshStatus();
      setTimeout(() => resetProgress(), 1200);
      break;

    case 'SolveStarted':
      activeJobId.value = payload.jobId ?? activeJobId.value;
      status.busy = true;
      progress.stage = 'started';
      progress.message = 'Solve started';
      progress.percent = 5;
      startFakeSolveProgress();
      break;

    case 'SolveFinished':
      status.busy = false;
      stopFakeProgress();
      progress.stage = 'finished';
      progress.message = 'Solve finished';
      progress.percent = 100;

      if (payload?.status) Object.assign(status, payload.status);

      refreshPreview(true);
      setTimeout(() => refreshStatus(), 250);
      setTimeout(() => resetProgress(), 1800);
      break;

    case 'OffsetCalibrateStarted':
      status.busy = true;
      progress.stage = 'offset';
      progress.message = 'Offset calibrate started';
      progress.percent = 10;
      activeJobId.value = payload.jobId ?? activeJobId.value;
      break;

    case 'OffsetCalibrateFinished':
      status.busy = false;
      progress.stage = 'offset';
      progress.message = 'Offset calibrate finished';
      progress.percent = 100;
      if (payload?.status) Object.assign(status, payload.status);
      setTimeout(() => refreshStatus(), 250);
      setTimeout(() => resetProgress(), 1500);
      break;

    default:
      break;
  }
}

const {
  wsConnected,
  connectWs,
  disconnectWs,
  cleanup: wsCleanup,
} = usePspWebSocket({
  wsUrl,
  pushLog,
  onEvent: handleWsEvent,
});

// =========================
// Config actions (wire up)
// =========================
function saveConfig() {
  saveCfg(pushLog);

  connectWs(true);
  refreshStatus();
  refreshPreview(true);
}

function loadConfig() {
  try {
    loadCfg(pushLog);

    connectWs(true);
    refreshStatus();
    refreshPreview(true);
  } catch (e) {
    pushLog('Config load failed', { error: e?.message ?? String(e) });
  }
}

// =========================
// Mount/Unmount timers
// =========================
let statusTimer = null;
let previewTimer = null;

onMounted(async () => {
  loadConfig();

  await refreshStatus();
  refreshPreview(true);

  connectWs(false);

  statusTimer = setInterval(() => refreshStatus(), 4000);

  previewTimer = setInterval(() => {
    if (autoPreview.value && !status.busy) refreshPreview(false);
  }, 5000);
});

onBeforeUnmount(() => {
  stopFakeProgress();
  if (statusTimer) clearInterval(statusTimer);
  if (previewTimer) clearInterval(previewTimer);
  wsCleanup();
});

// Reconnect WS when URL changes
watch(wsUrl, () => {
  if (activeTab.value === 'config') return;
  connectWs(true);
});
</script>
