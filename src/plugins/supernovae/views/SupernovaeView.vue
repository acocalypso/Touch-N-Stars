<template>
  <div class="px-4 py-6 lg:px-8">
    <div class="mx-auto max-w-6xl space-y-4 text-gray-200">
      <!-- Header -->
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 class="text-lg font-semibold text-white">{{ t('plugins.supernovae.title') }}</h1>
          <p class="text-xs text-gray-500 mt-0.5">
            {{ sourceDesc }}
            <span v-if="store.lastUpdated">
              · {{ t('plugins.supernovae.updated', { d: lastUpdatedStr }) }}</span
            >
          </p>
        </div>
        <button
          @click="store.download()"
          :disabled="store.downloading"
          class="flex items-center gap-2 px-3 py-1.5 text-sm bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition"
        >
          <svg
            v-if="store.downloading"
            class="w-4 h-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3"
            />
          </svg>
          {{
            store.downloading
              ? t('plugins.supernovae.downloading')
              : t('plugins.supernovae.download')
          }}
        </button>
      </div>

      <!-- Error -->
      <div
        v-if="store.downloadError"
        class="rounded-lg bg-red-900/30 border border-red-700/50 px-3 py-2 text-xs text-red-300"
      >
        {{ store.downloadError }}
      </div>

      <!-- No data -->
      <div
        v-if="!store.entries.length && !store.downloading"
        class="rounded-lg bg-gray-800/40 border border-gray-700 px-4 py-6 text-center text-sm text-gray-500"
      >
        {{ t('plugins.supernovae.noData') }}
      </div>

      <!-- Filters -->
      <div
        v-if="store.entries.length"
        class="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4 space-y-4"
      >
        <!-- Dropdowns grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <!-- Mag filter -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">{{ t('plugins.supernovae.filterMag') }}</label>
            <NumberInputPicker
              v-model="magLimit"
              :label="``"
              labelKey="magLimit"
              :min="10"
              :max="22"
              :step="0.5"
              :decimalPlaces="1"
              wrapperClass="w-full"
              inputId="sn-mag-limit"
            />
          </div>

          <!-- Type filter -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">{{ t('plugins.supernovae.filterType') }}</label>
            <select v-model="typeFilter" class="default-select w-full h-10">
              <option value="">{{ t('plugins.supernovae.filterAll') }}</option>
              <option v-for="tp in availableTypes" :key="tp" :value="tp">{{ tp }}</option>
            </select>
          </div>

          <!-- Year filter -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">{{ t('plugins.supernovae.filterYear') }}</label>
            <select v-model="yearFilter" class="default-select w-full h-10">
              <option value="">{{ t('plugins.supernovae.filterAll') }}</option>
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>

          <!-- Constellation filter -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">{{
              t('plugins.supernovae.filterConstellation')
            }}</label>
            <select v-model="conFilter" class="default-select w-full h-10">
              <option value="">{{ t('plugins.supernovae.filterAll') }}</option>
              <option v-for="c in availableConstellations" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>

        <!-- Sort + toggles -->
        <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
          <!-- Sort -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">{{ t('plugins.supernovae.sortBy') }}</label>
            <select v-model="sortKey" class="default-select">
              <option value="latestMag">{{ t('plugins.supernovae.sortLatestMag') }}</option>
              <option value="firstObserved">{{ t('plugins.supernovae.sortFirstObserved') }}</option>
              <option value="lastObserved">{{ t('plugins.supernovae.sortLastObserved') }}</option>
            </select>
          </div>

          <!-- Toggles — always on one line -->
          <div class="flex items-center gap-6 flex-nowrap">
            <!-- NEW only -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-300">{{ t('plugins.supernovae.filterNewOnly') }}</span>
              <ToggleButton :statusValue="newOnly" @update:statusValue="newOnly = $event" />
            </div>

            <!-- Visible tonight -->
            <div
              class="flex items-center gap-2"
              :class="!hasLocation && 'opacity-40'"
              :title="
                hasLocation
                  ? t('plugins.supernovae.visibleHint')
                  : t('plugins.supernovae.visibleNoLocation')
              "
            >
              <span class="text-xs text-gray-300">{{
                t('plugins.supernovae.filterVisibleOnly')
              }}</span>
              <ToggleButton
                :statusValue="visibleOnly"
                :disabled="!hasLocation"
                @update:statusValue="visibleOnly = $event"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Count -->
      <p v-if="store.entries.length" class="text-xs text-gray-500">
        {{ t('plugins.supernovae.showing', { n: paginated.length, total: filtered.length }) }}
        <span v-if="newCount" class="ml-2 text-cyan-400 font-medium"
          >· {{ t('plugins.supernovae.newCount', { n: newCount }) }}</span
        >
      </p>

      <!-- Table -->
      <div v-if="filtered.length" class="overflow-x-auto rounded-lg border border-gray-700">
        <table class="w-full text-xs text-left">
          <thead class="bg-gray-800 text-gray-400 uppercase tracking-wide">
            <tr>
              <th class="px-2 py-2 w-8"></th>
              <th class="px-3 py-2">{{ t('plugins.supernovae.colName') }}</th>
              <th class="px-3 py-2">{{ t('plugins.supernovae.colType') }}</th>
              <th class="px-3 py-2 text-right">{{ sortColLabel }}</th>
              <th class="px-3 py-2 w-6"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="entry in paginated" :key="entry.name">
              <!-- Main row -->
              <tr
                @click="toggleExpand(entry.name)"
                class="border-t border-gray-700/60 hover:bg-gray-700/30 transition-colors cursor-pointer select-none"
              >
                <!-- Status: NEW badge + visibility dot -->
                <td class="px-2 py-2">
                  <div class="flex flex-col items-center gap-0.5">
                    <span
                      v-if="entry.isNew"
                      class="inline-block rounded bg-cyan-700/70 text-cyan-200 text-[9px] font-bold px-1 py-0.5 leading-none"
                      >NEW</span
                    >
                    <span v-if="hasLocation" :title="visLabel(visMap[entry.name])">
                      <span
                        v-if="visMap[entry.name] === 'circumpolar'"
                        class="text-cyan-400 text-xs"
                        >◎</span
                      >
                      <span
                        v-else-if="visMap[entry.name] === 'visible'"
                        class="text-green-400 text-xs"
                        >●</span
                      >
                      <span v-else class="text-gray-600 text-xs">○</span>
                    </span>
                  </div>
                </td>

                <!-- Name -->
                <td class="px-3 py-2 font-mono text-white font-medium whitespace-nowrap">
                  {{ entry.name }}
                </td>

                <!-- Type -->
                <td class="px-3 py-2 whitespace-nowrap">
                  <span
                    :class="typeClass(entry.type)"
                    class="rounded px-1.5 py-0.5 text-[11px] font-medium"
                  >
                    {{ entry.type || '—' }}
                  </span>
                </td>

                <!-- Sort column -->
                <td class="px-3 py-2 font-mono text-right">{{ sortColValue(entry) }}</td>

                <!-- Chevron -->
                <td class="px-3 py-2 text-gray-500">
                  <svg
                    class="w-3 h-3 transition-transform duration-200"
                    :class="expandedRow === entry.name ? 'rotate-180' : ''"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </td>
              </tr>

              <!-- Expanded card -->
              <tr
                v-if="expandedRow === entry.name"
                class="border-t border-gray-700/40 bg-gray-800/50"
              >
                <td colspan="5" class="px-4 py-3">
                  <div class="flex flex-wrap gap-x-6 gap-y-2 text-xs mb-3">
                    <div>
                      <span class="text-gray-500 uppercase tracking-wide text-[10px]">{{
                        t('plugins.supernovae.colConstellation')
                      }}</span>
                      <p class="text-gray-200 mt-0.5">{{ entry.constellation || '—' }}</p>
                    </div>
                    <div>
                      <span class="text-gray-500 uppercase tracking-wide text-[10px]">{{
                        t('plugins.supernovae.colHost')
                      }}</span>
                      <p class="text-gray-200 mt-0.5">{{ entry.hostGalaxy || '—' }}</p>
                    </div>
                    <div>
                      <span class="text-gray-500 uppercase tracking-wide text-[10px]">{{
                        t('plugins.supernovae.colRA')
                      }}</span>
                      <p class="font-mono text-gray-200 mt-0.5">{{ fmtRA(entry.raDeg) }}</p>
                    </div>
                    <div>
                      <span class="text-gray-500 uppercase tracking-wide text-[10px]">{{
                        t('plugins.supernovae.colDec')
                      }}</span>
                      <p class="font-mono text-gray-200 mt-0.5">{{ fmtDec(entry.decDeg) }}</p>
                    </div>
                    <div>
                      <span class="text-gray-500 uppercase tracking-wide text-[10px]">{{
                        t('plugins.supernovae.colMaxMag')
                      }}</span>
                      <p class="font-mono text-gray-200 mt-0.5">
                        {{ entry.maxMag !== null ? entry.maxMag.toFixed(1) : '—' }}
                      </p>
                    </div>
                    <div>
                      <span class="text-gray-500 uppercase tracking-wide text-[10px]">{{
                        t('plugins.supernovae.colDiscovered')
                      }}</span>
                      <p class="text-gray-200 mt-0.5">{{ fmtDate(entry.firstObserved) }}</p>
                    </div>
                    <div>
                      <span class="text-gray-500 uppercase tracking-wide text-[10px]">{{
                        t('plugins.supernovae.colLastObs')
                      }}</span>
                      <p class="text-gray-200 mt-0.5">{{ fmtDate(entry.lastObserved) }}</p>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      @click.stop="sendToFraming(entry)"
                      class="flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-700/60 hover:bg-indigo-600/80 text-indigo-200 rounded transition"
                    >
                      <svg
                        class="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                        />
                      </svg>
                      {{ t('plugins.supernovae.frame') }}
                    </button>
                    <button
                      @click.stop="addToFavorites(entry)"
                      class="flex items-center gap-1 px-3 py-1.5 text-xs bg-pink-900/50 hover:bg-pink-800/70 text-pink-300 rounded transition"
                    >
                      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        />
                      </svg>
                      {{ t('plugins.supernovae.fav') }}
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Toast -->
      <div
        v-if="toast"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur"
        :class="
          toast.ok
            ? 'border-green-700/50 bg-green-900/80 text-green-200'
            : 'border-red-700/50 bg-red-900/80 text-red-200'
        "
      >
        {{ toast.msg }}
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
        <button
          @click="page = Math.max(1, page - 1)"
          :disabled="page === 1"
          class="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded transition"
        >
          ←
        </button>
        <span class="text-xs text-gray-400">{{
          t('plugins.supernovae.page', { n: page, total: totalPages })
        }}</span>
        <button
          @click="page = Math.min(totalPages, page + 1)"
          :disabled="page === totalPages"
          class="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded transition"
        >
          →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useSupernovaeStore } from '../store/supernovaeStore';
import { useFramingStore } from '@/store/framingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useFavTargetStore } from '@/store/favTargetsStore';
import { nightVisibility } from '../utils/visibility.js';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import ToggleButton from '@/components/helpers/toggleButton.vue';

const { t } = useI18n();
const store = useSupernovaeStore();
const framingStore = useFramingStore();
const settingsStore = useSettingsStore();
const favStore = useFavTargetStore();
const router = useRouter();

const toast = ref(null);
let toastTimer = null;
function showToast(msg, ok = true) {
  clearTimeout(toastTimer);
  toast.value = { msg, ok };
  toastTimer = setTimeout(() => {
    toast.value = null;
  }, 3000);
}

const hasLocation = computed(() => {
  const c = settingsStore.coordinates;
  return c?.latitude !== null && c?.latitude !== undefined;
});

const visMap = computed(() => {
  const c = settingsStore.coordinates;
  if (!c?.latitude) return {};
  const map = {};
  for (const e of store.entries) {
    map[e.name] = nightVisibility(e.raDeg, e.decDeg, c.latitude, c.longitude);
  }
  return map;
});

const expandedRow = ref(null);
function toggleExpand(name) {
  expandedRow.value = expandedRow.value === name ? null : name;
}

const magLimit = ref(20);
const typeFilter = ref('');
const yearFilter = ref('');
const conFilter = ref('');
const newOnly = ref(false);
const visibleOnly = ref(false);
const sortKey = ref('latestMag');
const page = ref(1);
const PAGE_SIZE = 50;

const sourceDesc = computed(() => t('plugins.supernovae.source'));

const lastUpdatedStr = computed(() =>
  store.lastUpdated ? new Date(store.lastUpdated).toLocaleString() : ''
);

const newCount = computed(() => store.entries.filter((e) => e.isNew).length);

const availableYears = computed(() => {
  const years = [...new Set(store.entries.map((e) => e.discoveryYear).filter(Boolean))];
  return years.sort((a, b) => b.localeCompare(a));
});

const availableConstellations = computed(() => {
  const cons = [...new Set(store.entries.map((e) => e.constellation).filter(Boolean))];
  return cons.sort();
});

const availableTypes = computed(() => {
  const types = [...new Set(store.entries.map((e) => e.type).filter(Boolean))];
  return types.sort();
});

const sortColLabel = computed(() => {
  if (sortKey.value === 'firstObserved') return t('plugins.supernovae.colDiscovered');
  if (sortKey.value === 'lastObserved') return t('plugins.supernovae.colLastObs');
  return t('plugins.supernovae.colLatestMag');
});

function sortColValue(entry) {
  if (sortKey.value === 'firstObserved') return fmtDate(entry.firstObserved);
  if (sortKey.value === 'lastObserved') return fmtDate(entry.lastObserved);
  return entry.latestMag !== null ? entry.latestMag.toFixed(1) : '—';
}

const filtered = computed(() => {
  let list = store.entries.filter((e) => {
    if (e.latestMag !== null && e.latestMag > magLimit.value) return false;
    if (typeFilter.value && e.type !== typeFilter.value) return false;
    if (yearFilter.value && e.discoveryYear !== yearFilter.value) return false;
    if (conFilter.value && e.constellation !== conFilter.value) return false;
    if (newOnly.value && !e.isNew) return false;
    if (visibleOnly.value && visMap.value[e.name] === 'hidden') return false;
    return true;
  });

  list = [...list].sort((a, b) => {
    if (sortKey.value === 'latestMag') return (a.latestMag ?? 99) - (b.latestMag ?? 99);
    if (sortKey.value === 'firstObserved') return b.firstObserved.localeCompare(a.firstObserved);
    if (sortKey.value === 'lastObserved')
      return (b.lastObserved ?? '').localeCompare(a.lastObserved ?? '');
    return 0;
  });

  return list;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));

const paginated = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return filtered.value.slice(start, start + PAGE_SIZE);
});

watch([magLimit, typeFilter, yearFilter, conFilter, newOnly, visibleOnly, sortKey], () => {
  page.value = 1;
  expandedRow.value = null;
});

onMounted(() =>
  store.load().then(() => {
    if (!store.entries.length) store.download();
  })
);

function sendToFraming(entry) {
  framingStore.RAangle = entry.raDeg;
  framingStore.DECangle = entry.decDeg;
  framingStore.selectedItem = { Name: entry.name, RA: entry.raDeg, Dec: entry.decDeg };
  router.push('/framing');
}

async function addToFavorites(entry) {
  try {
    await favStore.addFavorite({
      Name: entry.name,
      Ra: entry.raDeg,
      Dec: entry.decDeg,
      RaString: fmtRA(entry.raDeg),
      DecString: fmtDec(entry.decDeg),
      Rotation: 0,
    });
    showToast(t('plugins.supernovae.favAdded', { name: entry.name }));
  } catch {
    showToast(t('plugins.supernovae.favError'), false);
  }
}

function fmtRA(deg) {
  const h = (((deg % 360) + 360) % 360) / 15;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = Math.min(59, Math.round(((h - hh) * 60 - mm) * 60));
  return `${String(hh).padStart(2, '0')}h${String(mm).padStart(2, '0')}m${String(ss).padStart(2, '0')}s`;
}

function fmtDec(deg) {
  const sign = deg < 0 ? '-' : '+';
  const abs = Math.abs(deg);
  const dd = Math.floor(abs);
  const dm = Math.floor((abs - dd) * 60);
  const ds = Math.min(59, Math.round(((abs - dd) * 60 - dm) * 60));
  return `${sign}${String(dd).padStart(2, '0')}°${String(dm).padStart(2, '0')}'${String(ds).padStart(2, '0')}"`;
}

function fmtDate(str) {
  if (!str) return '—';
  return str.replace(/\//g, '-');
}

function visLabel(v) {
  if (v === 'circumpolar') return t('plugins.supernovae.visCircumpolar');
  if (v === 'visible') return t('plugins.supernovae.visVisible');
  return t('plugins.supernovae.visHidden');
}

function typeClass(type) {
  if (!type || type === 'AT') return 'bg-gray-700/50 text-gray-400';
  if (type.includes('Ia')) return 'bg-blue-900/50 text-blue-300';
  if (type.includes('II')) return 'bg-amber-900/50 text-amber-300';
  if (type.includes('Ib') || type.includes('Ic')) return 'bg-violet-900/50 text-violet-300';
  return 'bg-gray-700/50 text-gray-400';
}
</script>
