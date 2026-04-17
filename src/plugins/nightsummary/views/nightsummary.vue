<template>
  <div class="min-h-screen bg-gray-900">
    <div class="container py-6 px-4 max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-6">{{ $t('nightsummary.title') }}</h1>

      <!-- Plugin not installed -->
      <div
        v-if="store.pluginInstalled === false"
        class="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center"
      >
        <p class="text-gray-400 text-lg">{{ $t('nightsummary.notAvailable') }}</p>
      </div>

      <template v-else-if="store.pluginInstalled === true">
        <!-- Tabs -->
        <div class="flex gap-1 mb-6 border-b border-gray-700">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-t transition',
              activeTab === tab.id
                ? 'bg-gray-800 text-white border border-b-0 border-gray-700'
                : 'text-gray-400 hover:text-white',
            ]"
          >
            {{ $t('nightsummary.' + tab.i18n) }}
          </button>
        </div>

        <!-- Loading state -->
        <div v-if="store.settingsLoading" class="text-gray-400 py-4">
          {{ $t('common.loading') }}
        </div>

        <!-- ─── SETTINGS TAB ─── -->
        <div v-else-if="activeTab === 'settings' && store.settings">
          <SettingsTab />
        </div>

        <!-- ─── SESSIONS TAB ─── -->
        <div v-else-if="activeTab === 'sessions'">
          <!-- Session selector -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <select
              v-model="selectedSessionId"
              @change="onSelectSession"
              class="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
              :disabled="store.loadingSessions"
            >
              <option value="" disabled>
                {{
                  store.loadingSessions
                    ? $t('common.loading')
                    : $t('nightsummary.sessions.placeholder')
                }}
              </option>
              <option v-for="s in store.sessions" :key="s.SessionId" :value="s.SessionId">
                {{ formatSessionLabel(s) }}
              </option>
            </select>
            <button
              @click="store.fetchSessions()"
              :disabled="store.loadingSessions"
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-lg transition"
            >
              {{ $t('common.refresh') }}
            </button>
          </div>

          <!-- Session actions -->
          <div v-if="selectedSessionId" class="flex gap-3 mb-4">
            <button
              @click="store.fetchSessionDetail(selectedSessionId)"
              :disabled="store.loadingDetail"
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-lg transition"
            >
              {{ store.loadingDetail ? $t('common.loading') : $t('common.refresh') }}
            </button>
            <button
              @click="store.resendSession(selectedSessionId)"
              :disabled="store.resendingSession"
              class="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm rounded-lg transition"
            >
              {{
                store.resendingSession
                  ? $t('common.loading')
                  : $t('nightsummary.sessions.resend')
              }}
            </button>
            <button
              @click="confirmDelete = true"
              class="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition"
            >
              {{ $t('nightsummary.sessions.delete') }}
            </button>
            <StatusBadge
              v-if="store.resendStatus"
              :ok="store.resendStatus.ok"
              :message="store.resendStatus.message"
            />
          </div>

          <!-- Delete confirmation -->
          <div
            v-if="confirmDelete"
            class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          >
            <div class="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
              <h3 class="text-lg font-semibold text-white mb-3">
                {{ $t('nightsummary.sessions.deleteTitle') }}
              </h3>
              <p class="text-gray-300 mb-5 text-sm">
                {{ $t('nightsummary.sessions.deleteConfirm') }}
              </p>
              <div class="flex gap-3">
                <button
                  @click="doDelete"
                  class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition"
                >
                  {{ $t('general.delete') }}
                </button>
                <button
                  @click="confirmDelete = false"
                  class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold transition"
                >
                  {{ $t('general.cancel') }}
                </button>
              </div>
            </div>
          </div>

          <!-- No session -->
          <div
            v-if="!selectedSessionId"
            class="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center"
          >
            <p class="text-gray-500">{{ $t('nightsummary.sessions.noSessions') }}</p>
          </div>
          <div v-else-if="store.loadingDetail" class="text-gray-400 py-8 text-center">
            {{ $t('common.loading') }}
          </div>

          <!-- Session detail -->
          <div v-else-if="store.sessionDetail" class="space-y-4">
            <SessionHeader />

            <!-- Event Timeline (detailLevel >= 1) -->
            <div
              v-if="
                store.sessionDetail.Events?.length && store.settings?.ReportDetailLevel >= 1
              "
              class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-gray-700">
                <h3 class="text-white font-medium">
                  Events ({{ store.sessionDetail.Events.length }})
                </h3>
              </div>
              <div class="divide-y divide-gray-700/40 max-h-80 overflow-y-auto">
                <div
                  v-for="ev in store.sessionDetail.Events"
                  :key="ev.Id"
                  class="px-4 py-2 flex items-start gap-3 text-sm"
                >
                  <span class="text-gray-500 text-xs shrink-0 mt-0.5 w-11 tabular-nums">{{
                    formatTime(ev.Timestamp)
                  }}</span>
                  <span
                    :class="eventTypeColor(ev.EventType)"
                    class="shrink-0 text-xs font-semibold uppercase tracking-wide w-24"
                    >{{ ev.EventType }}</span
                  >
                  <span class="text-gray-300 flex-1 min-w-0">{{ ev.Description }}</span>
                  <span
                    v-if="ev.AfSucceeded !== null && ev.AfSucceeded !== undefined"
                    :class="ev.AfSucceeded ? 'text-green-400' : 'text-red-400'"
                    class="ml-2 text-xs shrink-0 font-medium"
                  >
                    {{ ev.AfSucceeded ? '✓' : '✗'
                    }}{{ ev.AfHfr ? ' HFR ' + ev.AfHfr.toFixed(2) : '' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Session Overview -->
            <div class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div class="px-4 py-3 border-b border-gray-700">
                <h3 class="text-white font-medium">Session Overview</h3>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
                <!-- Total Images -->
                <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center">
                  <details v-if="sessionFilterBreakdown.length" class="group">
                    <summary class="list-none cursor-pointer">
                      <div class="text-2xl font-bold text-cyan-400">
                        {{ store.sessionDetail.Stats.TotalImages }}
                        <span class="text-base text-cyan-600 group-open:hidden">▼</span>
                        <span class="text-base text-cyan-600 hidden group-open:inline">▲</span>
                        <span
                          v-if="store.sessionDetail.Stats.SkippedExposures > 0"
                          class="text-sm text-red-400 font-normal"
                          >(+{{ store.sessionDetail.Stats.SkippedExposures }} aborted)</span
                        >
                      </div>
                      <div class="text-xs text-gray-400 mt-1">Total Images</div>
                    </summary>
                    <div class="mt-2 text-left space-y-0.5 border-t border-gray-700 pt-2">
                      <div
                        v-for="fb in sessionFilterBreakdown"
                        :key="fb.filter"
                        class="flex justify-between text-xs text-gray-400"
                      >
                        <span class="truncate mr-2">{{ fb.filter }}</span>
                        <span class="shrink-0 tabular-nums">{{ fb.count }}</span>
                      </div>
                    </div>
                  </details>
                  <template v-else>
                    <div class="text-2xl font-bold text-cyan-400">
                      {{ store.sessionDetail.Stats.TotalImages }}
                      <span
                        v-if="store.sessionDetail.Stats.SkippedExposures > 0"
                        class="text-sm text-red-400 font-normal"
                        >(+{{ store.sessionDetail.Stats.SkippedExposures }} aborted)</span
                      >
                    </div>
                    <div class="text-xs text-gray-400 mt-1">Total Images</div>
                  </template>
                </div>
                <!-- Total Exposure -->
                <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center">
                  <details v-if="sessionFilterBreakdown.length" class="group">
                    <summary class="list-none cursor-pointer">
                      <div class="text-2xl font-bold text-white">
                        {{ formatDurationH(store.sessionDetail.Stats.TotalExposureSeconds) }}
                        <span class="text-base text-gray-500 group-open:hidden">▼</span>
                        <span class="text-base text-gray-500 hidden group-open:inline">▲</span>
                      </div>
                      <div class="text-xs text-gray-400 mt-1">Total Exposure</div>
                    </summary>
                    <div class="mt-2 text-left space-y-0.5 border-t border-gray-700 pt-2">
                      <div
                        v-for="fb in sessionFilterBreakdown"
                        :key="fb.filter"
                        class="flex justify-between text-xs text-gray-400"
                      >
                        <span class="truncate mr-2">{{ fb.filter }}</span>
                        <span class="shrink-0 tabular-nums">{{ formatDuration(fb.expSec) }}</span>
                      </div>
                    </div>
                  </details>
                  <template v-else>
                    <div class="text-2xl font-bold text-white">
                      {{ formatDurationH(store.sessionDetail.Stats.TotalExposureSeconds) }}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">Total Exposure</div>
                  </template>
                </div>
                <!-- Targets -->
                <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center">
                  <div class="text-2xl font-bold text-white">
                    {{ store.sessionDetail.Stats.Targets.length }}
                  </div>
                  <div class="text-xs text-gray-400 mt-1">Targets</div>
                </div>
                <!-- Avg HFR -->
                <div
                  v-if="store.sessionDetail.Stats.AvgHfr > 0"
                  class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
                >
                  <div class="text-2xl font-bold text-white">
                    {{ store.sessionDetail.Stats.AvgHfr.toFixed(2) }}px
                  </div>
                  <div class="text-xs text-gray-400 mt-1">Avg HFR</div>
                </div>
                <!-- Avg Guiding -->
                <div
                  v-if="store.sessionDetail.Stats.AvgGuidingRms > 0"
                  class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
                >
                  <div class="text-2xl font-bold text-white">
                    {{ store.sessionDetail.Stats.AvgGuidingRms.toFixed(2) }}&quot;
                  </div>
                  <div class="text-xs text-gray-400 mt-1">Avg Guiding RMS</div>
                </div>
                <!-- Avg FWHM -->
                <div
                  v-if="store.sessionDetail.Stats.AvgFwhm > 0"
                  class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
                >
                  <div class="text-2xl font-bold text-white">
                    {{ store.sessionDetail.Stats.AvgFwhm.toFixed(2) }}&quot;
                  </div>
                  <div class="text-xs text-gray-400 mt-1">Avg FWHM</div>
                </div>
                <!-- Yield -->
                <div
                  v-if="sessionYield !== null && store.settings?.ReportDetailLevel >= 2"
                  class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
                  title="Total exposure ÷ session window (first to last image)."
                >
                  <div class="text-2xl font-bold text-white">{{ sessionYield }}%</div>
                  <div class="text-xs text-gray-400 mt-1">Yield</div>
                </div>
                <!-- Moon -->
                <div
                  v-if="sessionMoon && store.settings?.ReportDetailLevel >= 2"
                  class="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
                >
                  <div class="text-2xl font-bold text-white">
                    {{ sessionMoon.pct }}% {{ sessionMoon.waxing ? '↑' : '↓' }}
                  </div>
                  <div class="text-xs text-gray-400 mt-1">Moon</div>
                </div>
              </div>
            </div>

            <OverheadAnalysis />
            <SessionTargets />

            <!-- Session Image Quality (detailLevel >= 1) -->
            <div
              v-if="sessionIQ.length && store.settings?.ReportDetailLevel >= 1"
              class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-gray-700">
                <h3 class="text-white font-medium">Session Image Quality</h3>
              </div>
              <div class="p-4">
                <IqTable :rows="sessionIQ" />
              </div>
            </div>

            <MetricChart />
          </div>
        </div>
        <!-- /sessions tab -->
      </template>
      <div v-else class="text-gray-400 py-8 text-center">{{ $t('common.loading') }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useNightSummaryStore } from '../store/nightsummaryStore';
import StatusBadge from '../components/StatusBadge.vue';
import IqTable from '../components/IqTable.vue';
import SettingsTab from '../components/SettingsTab.vue';
import SessionHeader from '../components/SessionHeader.vue';
import OverheadAnalysis from '../components/OverheadAnalysis.vue';
import SessionTargets from '../components/SessionTargets.vue';
import MetricChart from '../components/MetricChart.vue';
import {
  formatTime,
  formatDuration,
  formatDurationH,
  formatSessionLabel,
  buildIqRows,
  cmpFilters,
} from '../utils/sessionFormatters';

const store = useNightSummaryStore();
const activeTab = ref('sessions');
const selectedSessionId = ref('');
const confirmDelete = ref(false);

const tabs = [
  { id: 'sessions', i18n: 'tabSessions' },
  { id: 'settings', i18n: 'tabSettings' },
];

onMounted(async () => {
  await store.initialize();
  if (store.selectedSessionId) {
    selectedSessionId.value = store.selectedSessionId;
    if (activeTab.value === 'sessions') {
      store.fetchSessionDetail(selectedSessionId.value);
    }
  }
});

watch(activeTab, (tab) => {
  if (tab === 'sessions' && selectedSessionId.value) {
    store.fetchSessionDetail(selectedSessionId.value);
  }
});

function onSelectSession() {
  if (selectedSessionId.value) store.selectSession(selectedSessionId.value);
}

async function doDelete() {
  confirmDelete.value = false;
  await store.deleteSession(selectedSessionId.value);
  selectedSessionId.value = '';
}

function eventTypeColor(type) {
  switch (type) {
    case 'AutoFocus':
      return 'text-cyan-400';
    case 'MeridianFlip':
      return 'text-purple-400';
    case 'RoofOpen':
      return 'text-green-400';
    case 'RoofClosed':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
}

const sessionFilterBreakdown = computed(() => {
  if (!store.sessionDetail?.Images?.length) return [];
  const light = store.sessionDetail.Images.filter((i) => !i.ImageType || i.ImageType === 'LIGHT');
  const map = {};
  for (const img of light) {
    const f = img.Filter || '(no filter)';
    if (!map[f]) map[f] = { filter: f, count: 0, expSec: 0 };
    map[f].count++;
    map[f].expSec += img.ExposureDuration || 0;
  }
  return Object.values(map).sort((a, b) => cmpFilters(a.filter, b.filter, store.filterNames));
});

const sessionIQ = computed(() => {
  if (!store.sessionDetail?.Images?.length) return [];
  return buildIqRows(
    store.sessionDetail.Images.filter((i) => !i.ImageType || i.ImageType === 'LIGHT'),
    store.filterNames
  );
});

function moonIlluminationPct(dateStr) {
  const synodicPeriod = 29.53058868;
  const referenceNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  let daysSinceNew = (new Date(dateStr).getTime() - referenceNewMoon) / 86400000;
  daysSinceNew = ((daysSinceNew % synodicPeriod) + synodicPeriod) % synodicPeriod;
  const waxing = daysSinceNew < synodicPeriod / 2;
  const phaseAngle = (daysSinceNew / synodicPeriod) * 2 * Math.PI;
  return { pct: Math.round(((1 - Math.cos(phaseAngle)) / 2) * 100), waxing };
}

const sessionMoon = computed(() => {
  const s = store.sessionDetail?.Session;
  if (!s?.SessionStart) return null;
  return moonIlluminationPct(s.SessionStart);
});

const sessionYield = computed(() => {
  const s = store.sessionDetail?.Session;
  const images = store.sessionDetail?.Images?.filter(
    (i) => !i.ImageType || i.ImageType === 'LIGHT'
  );
  const events = store.sessionDetail?.Events ?? [];
  if (!images?.length) return null;
  const timestamps = images.map((i) => new Date(i.Timestamp).getTime()).filter((t) => !isNaN(t));
  if (!timestamps.length) return null;
  const firstMs = Math.min(...timestamps);
  const sessionEndStr = s?.SessionEnd;
  const isRunning = !sessionEndStr || new Date(sessionEndStr).getFullYear() < 2000;
  const lastMs = isRunning ? Date.now() : Math.max(...timestamps);
  const windowSec = (lastMs - firstMs) / 1000;
  if (windowSec <= 0) return null;
  const roofEvents = events
    .filter((e) => e.EventType === 'RoofClosed' || e.EventType === 'RoofOpen')
    .sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
  let roofClosedSec = 0,
    closedAt = null;
  for (const ev of roofEvents) {
    if (ev.EventType === 'RoofClosed') {
      closedAt = new Date(ev.Timestamp).getTime();
    } else if (ev.EventType === 'RoofOpen' && closedAt !== null) {
      const s2 = Math.max(closedAt, firstMs);
      const e = Math.min(new Date(ev.Timestamp).getTime(), lastMs);
      if (e > s2) roofClosedSec += (e - s2) / 1000;
      closedAt = null;
    }
  }
  if (closedAt !== null) {
    const s2 = Math.max(closedAt, firstMs);
    if (lastMs > s2) roofClosedSec += (lastMs - s2) / 1000;
  }
  const effectiveWindowSec = windowSec - roofClosedSec;
  if (effectiveWindowSec <= 0) return null;
  const totalExpSec = images.reduce((sum, i) => sum + (i.ExposureDuration || 0), 0);
  return Math.round(Math.min((totalExpSec / effectiveWindowSec) * 100, 100));
});
</script>
