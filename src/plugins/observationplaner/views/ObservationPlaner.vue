<template>
  <div class="p-4 md:p-6 space-y-4">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-gray-100">{{ tp('title') }}</h2>
        <p class="text-sm text-gray-400">
          {{ tp('subtitle') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-100 text-sm"
          @click="refreshAll"
          :disabled="busy"
          :title="tp('tooltips.refreshAll')"
        >
          Refresh
        </button>

        <button
          class="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-100 text-sm"
          @click="ensureLocation"
          :disabled="busyLocation"
          :title="tp('tooltips.updateGps')"
        >
          Standort holen
        </button>
      </div>
    </div>

    <!-- Location + global settings -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div class="rounded-xl border border-gray-700 bg-black/30 p-3">
        <div class="text-xs text-gray-400 mb-1">{{ tp('location.title') }}</div>

        <div v-if="hasSite" class="text-sm text-gray-100">
          {{ fmtCoord(siteLat) }}, {{ fmtCoord(siteLon) }}
          <span v-if="siteAlt != null" class="text-gray-400">· {{ fmtAlt(siteAlt) }} m</span>
        </div>

        <div v-else class="text-sm text-gray-400">{{ tp('location.notAvailable') }}</div>

        <div v-if="gpsError" class="mt-2 text-xs text-red-400 break-words">
          {{ gpsError }}
        </div>
      </div>

      <div class="rounded-xl border border-gray-700 bg-black/30 p-3">
        <div class="text-xs text-gray-400 mb-2">{{ tp('filters.timeWindow') }}</div>

        <div class="grid grid-cols-2 gap-2">
          <label class="text-xs text-gray-300">
            Start (lokal)
            <input
              class="mt-1 w-full px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-100"
              type="datetime-local"
              v-model="windowStartLocal"
            />
          </label>
          <label class="text-xs text-gray-300">
            Ende (lokal)
            <input
              class="mt-1 w-full px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-100"
              type="datetime-local"
              v-model="windowEndLocal"
            />
          </label>
        </div>

        <div class="mt-2 flex items-center justify-between gap-2">
          <label class="text-xs text-gray-300 flex items-center gap-2">
            Sample (min)
            <input
              class="w-20 px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-100"
              type="number"
              min="2"
              max="60"
              step="1"
              v-model.number="sampleMinutes"
            />
          </label>

          <div class="text-xs text-gray-500">{{ sampleCount }} Punkte</div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-700 bg-black/30 p-3">
        <div class="text-xs text-gray-400 mb-2">{{ tp('performance.title') }}</div>

        <div class="flex items-center justify-between gap-2">
          <label class="text-xs text-gray-300">
            Limit
            <input
              class="mt-1 w-24 px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-100"
              type="number"
              min="5"
              max="200"
              step="1"
              v-model.number="limit"
            />
          </label>

          <label class="text-xs text-gray-300 flex items-center gap-2">
            <span>{{ tp('cache.useNinaCache') }}</span>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="useNinaCache ? 'bg-emerald-600' : 'bg-gray-700'"
              @click="useNinaCache = !useNinaCache"
              title="Gibt useCache an targetpic weiter"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                :class="useNinaCache ? 'translate-x-5' : 'translate-x-1'"
              />
            </button>
          </label>
        </div>

        <div class="mt-3 flex items-center justify-between gap-2">
          <label class="text-xs text-gray-300 flex items-center gap-2">
            <span>{{ tp('preview.lazyLoad') }}</span
            >>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="lazyPreviews ? 'bg-emerald-600' : 'bg-gray-700'"
              @click="lazyPreviews = !lazyPreviews"
              :title="tp('tooltips.lazyVisibleOnly')"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                :class="lazyPreviews ? 'translate-x-5' : 'translate-x-1'"
              />
            </button>
          </label>

          <label class="text-xs text-gray-300 flex items-center gap-2">
            <span>{{ tp('filters.onlyAboveHorizon') }}</span>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="onlyAboveHorizon ? 'bg-emerald-600' : 'bg-gray-700'"
              @click="onlyAboveHorizon = !onlyAboveHorizon"
              title="Filtert Ziele mit maxAlt <= 0° raus"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                :class="onlyAboveHorizon ? 'translate-x-5' : 'translate-x-1'"
              />
            </button>
          </label>
        </div>

        <div class="mt-3 pt-3 border-t border-gray-800">
          <div class="text-xs text-gray-400 mb-1">{{ tp('filters.moon') }}</div>
          <div class="text-sm text-gray-100">
            <span v-if="moonIllumPct != null">{{ moonIllumPct }}% beleuchtet</span>
            <span v-else class="text-gray-500">—</span>
            <span class="text-gray-400"> · </span>
            <span v-if="currentMoonData?.separationDeg != null"
              >Separation {{ fmtNum(currentMoonData.separationDeg, 0) }}°</span
            >
            <span v-else class="text-gray-500">{{ tp('chart.separation') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="rounded-xl border border-gray-700 bg-black/30 p-4 space-y-3">
      <div class="flex items-center justify-between">
        <div class="text-sm font-medium text-gray-100">{{ tp('filters.title') }}</div>
        <div class="text-xs text-gray-400">
          {{ filteredTargets.length }} / {{ targets.length }} Ziele · Anzeige:
          {{ displayedTargets.length }}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <label class="text-xs text-gray-300">
          Suche
          <input
            class="mt-1 w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100"
            v-model="q"
            placeholder="M42, Andromeda, NGC..."
          />
        </label>

        <label class="text-xs text-gray-300">
          Objekt-Typ
          <select
            class="mt-1 w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100"
            v-model="typeFilter"
          >
            <option value="">{{ tp('common.all') }}</option>
            <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
          </select>
        </label>

        <label class="text-xs text-gray-300">
          Himmelrichtung (Azimut-Sektor)
          <select
            class="mt-1 w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100"
            v-model="sectorFilter"
            title="Filtert nach bestAzDeg (Azimut beim höchsten Altitude im Fenster)"
          >
            <option value="">{{ tp('common.all') }}</option>
            <option v-for="s in sectorOptions" :key="s.value" :value="s.value">
              {{ s.label }}
            </option>
          </select>
        </label>

        <label class="text-xs text-gray-300">
          Sortierung
          <select
            class="mt-1 w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100"
            v-model="sortMode"
          >
            <option value="maxAltDesc">{{ tp('sort.maxAltDesc') }}</option>
            <option value="bestTimeAsc">{{ tp('sort.bestTimeAsc') }}</option>
            <option value="nameAsc">{{ tp('sort.nameAZ') }}</option>
          </select>
        </label>
      </div>

      <div v-if="!hasSite" class="text-xs text-amber-300">
        Hinweis: Ohne Standort können Altitude/Direction Filter & Charts nicht berechnet werden.
      </div>
    </div>

    <!-- {{ tp('sections.tonightPicks') }} (top 10 by Tonight-Score) -->
    <div v-if="tonightPicks.length" class="rounded-xl border border-gray-700 bg-black/30 p-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-xs text-gray-400">{{ tp('sections.tonightPicks') }}</div>
          <div class="text-sm text-gray-100">{{ tp('sections.topForWindow') }}</div>
        </div>
        <div class="text-xs text-gray-500">Top {{ tonightPicks.length }}</div>
      </div>

      <div class="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        <button
          v-for="p in tonightPicks"
          :key="p._id"
          class="text-left px-3 py-2 rounded-lg bg-gray-900/50 hover:bg-gray-900 border border-gray-700 text-gray-100"
          @click="openInFramingAssistant(p)"
          :title="`Framing öffnen · ${fmtRa(p.raDeg)} / ${fmtDec(p.decDeg)} · MaxAlt ${fmtNum(p.maxAltDeg, 1)}°`"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="truncate font-semibold">{{ p.name }}</div>
            <div class="text-[11px] text-gray-300">{{ tonightLabel(p.tonightScore) }}</div>
          </div>
          <div class="mt-1 text-[11px] text-gray-400">
            MaxAlt {{ fmtNum(p.maxAltDeg, 1) }}° · {{ fmtNum(p.visibleHours, 1) }}h sichtbar
          </div>
        </button>
      </div>
    </div>

    <!-- Cards list -->
    <div class="space-y-3">
      <div
        v-for="(t, i) in displayedTargets"
        :key="t._id"
        :class="[
          'rounded-xl border bg-black/30 p-4',
          isSelected(t) ? 'border-blue-500' : 'border-gray-700',
        ]"
      >
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Left: title + meta -->
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="text-base font-semibold text-gray-100 flex items-center gap-2">
                  <span
                    v-if="(t.tonightScore ?? 0) > 0"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border border-gray-700 bg-gray-900 text-gray-100"
                    :title="`Tonight score: ${fmtNum(t.tonightScore, 2)} · MaxAlt ${fmtNum(t.maxAltDeg, 1)}° · ${fmtNum(t.visibleHours, 1)}h`"
                  >
                    {{ tonightLabel(t.tonightScore) }}
                  </span>
                  <span
                    v-if="t.source === 'favorite'"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border border-gray-700 bg-gray-900 text-gray-100"
                    title="Favorite"
                    >❤️</span
                  >
                  <span class="truncate">
                    {{ t.name || 'Unnamed target' }}
                  </span>
                </div>
                <div class="text-xs text-gray-400">
                  <span v-if="t.type">{{ t.type }}</span>
                  <span v-if="t.type && (t.raDeg != null || t.decDeg != null)"> · </span>
                  <span v-if="t.raDeg != null && t.decDeg != null"
                    >RA {{ fmtRa(t.raDeg) }} · DEC {{ fmtDec(t.decDeg) }}</span
                  >
                </div>
              </div>

              <button
                class="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs"
                @click="reloadPreview(t)"
                :disabled="busyPreview[t._id]"
                title="Preview neu laden"
              >
                Reload
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div class="rounded-lg bg-gray-900/60 border border-gray-700 p-2">
                <div class="text-[11px] text-gray-400">{{ tp('sort.maxAltWindow') }}</div>
                <div class="text-sm text-gray-100">
                  <span v-if="t.maxAltDeg != null">{{ fmtNum(t.maxAltDeg, 1) }}°</span>
                  <span v-else class="text-gray-500">—</span>
                </div>
              </div>

              <div class="rounded-lg bg-gray-900/60 border border-gray-700 p-2">
                <div class="text-[11px] text-gray-400">{{ tp('sort.bestTime') }}</div>
                <div class="text-sm text-gray-100">
                  <span v-if="t.bestTime">{{ fmtTime(t.bestTime) }}</span>
                  <span v-else class="text-gray-500">—</span>
                </div>
              </div>

              <div class="rounded-lg bg-gray-900/60 border border-gray-700 p-2">
                <div class="text-[11px] text-gray-400">{{ tp('chart.directionAz') }}</div>
                <div class="text-sm text-gray-100">
                  <span v-if="t.bestAzDeg != null"
                    >{{ fmtNum(t.bestAzDeg, 0) }}° ({{ azToCardinal(t.bestAzDeg) }})</span
                  >
                  <span v-else class="text-gray-500">—</span>
                </div>
              </div>

              <div class="rounded-lg bg-gray-900/60 border border-gray-700 p-2">
                <div class="text-[11px] text-gray-400">{{ tp('sort.visible') }}</div>
                <div class="text-sm text-gray-100">
                  <span v-if="t.maxAltDeg != null">
                    <span v-if="t.maxAltDeg > 0" class="text-emerald-300">{{
                      tp('common.yes')
                    }}</span>
                    <span v-else class="text-red-300">{{ tp('common.no') }}</span>
                  </span>
                  <span v-else class="text-gray-500">—</span>
                </div>
              </div>
            </div>

            <div v-if="t._error" class="text-xs text-red-400 break-words">
              {{ t._error }}
            </div>
          </div>

          <!-- Middle: Preview image -->
          <div class="space-y-2">
            <div class="text-xs text-gray-400">Preview</div>

            <div
              class="relative aspect-square max-w-[240px] rounded-xl overflow-hidden border border-gray-700 bg-gray-900"
            >
              <img
                v-if="t.previewUrl"
                :src="t.previewUrl"
                class="w-full h-full object-cover"
                @error="onPreviewError(t)"
              />

              <div
                v-if="!t.previewUrl || t.previewError"
                class="absolute inset-0 flex items-center justify-center text-xs text-gray-300"
              >
                <div class="text-center px-4">
                  <div class="font-medium">{{ tp('preview.unavailable') }}</div>
                  <div class="text-gray-500 mt-1">
                    <span v-if="t.previewError">{{ t.previewError }}</span>
                    <span v-else>{{ tp('preview.noImage') }}</span>
                  </div>
                </div>
              </div>

              <button
                class="absolute right-3 bottom-3 w-9 h-9 rounded-full bg-gray-800/80 hover:bg-gray-700 border border-gray-600 text-gray-100 flex items-center justify-center"
                title="Preview info"
                @click="t._showHint = !t._showHint"
              >
                ?
              </button>

              <div
                v-if="t._showHint"
                class="absolute left-3 right-3 bottom-3 translate-y-12 lg:translate-y-0 lg:bottom-14 rounded-lg bg-black/80 border border-gray-700 p-2 text-[11px] text-gray-200"
              >
                Lädt DSS/TargetPic über TNS WebAPI. Cache Toggle steuert useCache.
              </div>
            </div>

            <div class="text-[11px] text-gray-500">
              useCache: <span class="text-gray-300">{{ useNinaCache ? 'true' : 'false' }}</span>
            </div>
          </div>

          <!-- Right: Altitude chart + actions -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="text-xs text-gray-400">{{ tp('chart.altitudeVsTime') }}</div>

              <div class="flex gap-2">
                <button
                  class="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs"
                  @click="drawOneChart(t)"
                  :disabled="!t.track || !hasSite"
                  title="Chart neu zeichnen"
                >
                  Redraw
                </button>
              </div>
            </div>

            <div class="rounded-xl border border-gray-700 bg-gray-900/40 p-2">
              <canvas :ref="(el) => setCanvasRef(t._id, el)" class="w-full" style="height: 140px" />
            </div>

            <div class="grid grid-cols-4 gap-2 pt-1">
              <!-- Slew -->
              <button
                class="action-icon-btn bg-cyan-700 hover:bg-cyan-600 border-cyan-500 text-white"
                @click="slewOnly(t)"
                :disabled="!canSlew(t) || isSelected(t)"
                title="Slew (ohne Center)"
                aria-label="Slew (ohne Center)"
              >
                <ArrowUpRightIcon class="w-5 h-5" />
                <span class="hidden md:inline text-xs font-semibold">{{ tp('buttons.slew') }}</span>
              </button>

              <!-- Slew + Center -->
              <button
                class="action-icon-btn bg-emerald-700 hover:bg-emerald-600 border-emerald-500 text-white"
                @click="slewAndCenter(t)"
                :disabled="!canSlew(t) || isSelected(t)"
                title="Slew + Center (Platesolve)"
                aria-label="Slew + Center"
              >
                <ViewfinderCircleIcon class="w-5 h-5" />
                <span class="hidden md:inline text-xs font-semibold">{{
                  tp('buttons.center')
                }}</span>
              </button>

              <!-- Framing -->
              <button
                class="action-icon-btn bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-100"
                @click="openInFramingAssistant(t)"
                :disabled="!canOpenFraming(t)"
                title="Framing Assistant öffnen"
                aria-label="Framing Assistant öffnen"
              >
                <RectangleGroupIcon class="w-5 h-5" />
                <span class="hidden md:inline text-xs font-semibold">{{
                  tp('sections.framing')
                }}</span>
              </button>

              <!-- Sequencer -->
              <button
                class="action-icon-btn bg-indigo-700 hover:bg-indigo-600 border-indigo-500 text-white"
                @click="sendToSequencer(t)"
                :disabled="!canSlew(t)"
                title="An Sequencer übergeben"
                aria-label="An Sequencer übergeben"
              >
                <QueueListIcon class="w-5 h-5" />
                <span class="hidden md:inline text-xs font-semibold">{{
                  tp('buttons.seqShort')
                }}</span>
              </button>
            </div>

            <div v-if="mountMsg[t._id]" class="text-xs text-gray-300 break-words">
              {{ mountMsg[t._id] }}
            </div>
            <div v-if="mountErr[t._id]" class="text-xs text-red-400 break-words">
              {{ mountErr[t._id] }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="!targets.length && !busy" class="text-sm text-gray-400">
        Keine Favoriten gefunden.
      </div>

      <div v-if="busy" class="text-sm text-gray-400">{{ tp('common.loading') }}</div>
    </div>
  </div>
  <!-- Framing Modal (hosted in this view) -->
  <div
    v-if="framingStore.showFramingModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click.self="framingStore.showFramingModal = false"
  >
    <div
      class="bg-gray-900 rounded-lg p-4 overflow-y-auto max-h-[75vh] border border-gray-700 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50"
      :style="{ minWidth: `${framingStore.containerSize || 900}px` }"
      @click.stop
    >
      <FramingAssistangModal />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import apiService from '../../../services/apiService';
import seedTargets from '../components/astro_targets_seed.json';
import FramingAssistangModal from '../../../components/framing/FramingAssistangModal.vue';
import { useFramingStore } from '@/store/framingStore';
import { useSequenceStore } from '@/store/sequenceStore';
import {
  ArrowUpRightIcon,
  ViewfinderCircleIcon,
  RectangleGroupIcon,
  QueueListIcon,
} from '@heroicons/vue/24/outline';
import {
  latitude,
  longitude,
  altitude,
  gpsError,
  getCurrentLocation,
  useLocationStore,
} from '../../../utils/location';

// --------------------------
// Basic helpers
// --------------------------

const { t: tr } = useI18n();
const tp = (key, params) => tr(`observationPlaner.${key}`, params);

function parseRaToDeg(v) {
  // Accepts: number (deg or hours), "HH:MM:SS", "HH MM SS", "HHhMMmSSs"
  // Returns HOURS when given sexagesimal; caller converts to degrees if needed.
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;

  const s = String(v).trim();
  if (!s) return null;

  const n = Number(s.replace(',', '.'));
  if (Number.isFinite(n)) return n;

  const cleaned = s
    .toLowerCase()
    .replace(/[h]/g, ':')
    .replace(/[m]/g, ':')
    .replace(/[s]/g, '')
    .replace(/\s+/g, ':')
    .replace(/::+/g, ':')
    .replace(/[^0-9:+-]/g, ':');

  const parts = cleaned.split(':').filter(Boolean).slice(0, 3);
  if (!parts.length) return null;

  const hh = Number(parts[0]);
  const mm = parts.length > 1 ? Number(parts[1]) : 0;
  const ss = parts.length > 2 ? Number(parts[2]) : 0;
  if (![hh, mm, ss].every(Number.isFinite)) return null;

  return hh + mm / 60 + ss / 3600;
}

function parseDecToDeg(v) {
  // Accepts: number (deg), "+DD:MM:SS", "DD MM SS", "DDdMMmSSs"
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;

  const s = String(v).trim();
  if (!s) return null;

  const n = Number(s.replace(',', '.'));
  if (Number.isFinite(n)) return n;

  const sign = s.startsWith('-') ? -1 : 1;

  const cleaned = s
    .toLowerCase()
    .replace(/[d°]/g, ':')
    .replace(/[m]/g, ':')
    .replace(/[s]/g, '')
    .replace(/\s+/g, ':')
    .replace(/::+/g, ':')
    .replace(/[^0-9:+-]/g, ':');

  const parts = cleaned.split(':').filter(Boolean).slice(0, 3);
  if (!parts.length) return null;

  const dd = Math.abs(Number(parts[0]));
  const mm = parts.length > 1 ? Number(parts[1]) : 0;
  const ss = parts.length > 2 ? Number(parts[2]) : 0;
  if (![dd, mm, ss].every(Number.isFinite)) return null;

  return sign * (dd + mm / 60 + ss / 3600);
}

// --------------------------
// State
// --------------------------

const framingStore = useFramingStore();
const locationStore = useLocationStore?.() ?? null;
const sequenceStore = useSequenceStore();

const busy = ref(false);
const busyLocation = ref(false);

const targets = ref([]); // merged list (favorites + seed)
const apiFavorites = ref([]); // raw favorites from API
const q = ref('');
const typeFilter = ref('');
const sectorFilter = ref('');
const sortMode = ref('maxAltDesc');

const limit = ref(20);
const sampleMinutes = ref(5);
const onlyAboveHorizon = ref(true);

const useNinaCache = ref(true);
const lazyPreviews = ref(true);

// Window defaults: today evening -> tomorrow morning
const windowStart = ref(defaultStart());
const windowEnd = ref(defaultEnd());
const currentMoonData = {
  illumination: 0.35,
  separationDeg: 95,
};

// Derived moon values (used in template to avoid unused-var warnings)
const moonIllumPct = computed(() => {
  const v = Number(currentMoonData?.illumination);
  return Number.isFinite(v) ? Math.round(v * 100) : null;
});

// datetime-local binding helpers
const windowStartLocal = computed({
  get: () => toLocalInputValue(windowStart.value),
  set: (v) => (windowStart.value = fromLocalInputValue(v) ?? windowStart.value),
});
const windowEndLocal = computed({
  get: () => toLocalInputValue(windowEnd.value),
  set: (v) => (windowEnd.value = fromLocalInputValue(v) ?? windowEnd.value),
});

const busyPreview = reactive({});
const mountMsg = reactive({});
const mountErr = reactive({});

// last target we acted on (avoid double-slew clicks + highlight)
const lastSelectedTarget = ref(null);
function selectTarget(t) {
  if (!t) return;
  lastSelectedTarget.value = {
    _id: t._id,
    name: t.name,
    raDeg: t.raDeg,
    decDeg: t.decDeg,
  };
}
const isSelected = (t) => isSameTarget(t, lastSelectedTarget.value);

const canvasRefs = reactive({}); // id -> canvas
const drawTimers = reactive({}); // id -> timeout

// --------------------------
// Location (computed from your utils/store)
// --------------------------
const siteLat = computed(() => {
  const v = latitude?.value ?? locationStore?.latitude;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
});
const siteLon = computed(() => {
  const v = longitude?.value ?? locationStore?.longitude;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
});
const siteAlt = computed(() => {
  const v = altitude?.value ?? locationStore?.altitude;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
});
const hasSite = computed(() => Number.isFinite(siteLat.value) && Number.isFinite(siteLon.value));

function toNumMaybe(v) {
  const n = typeof v === 'number' ? v : (v?.value ?? null);
  return Number.isFinite(n) ? n : null;
}

function fmtCoord(v, digits = 5) {
  const n = toNumMaybe(v);
  return n == null ? '—' : n.toFixed(digits);
}

function fmtAlt(v) {
  const n = toNumMaybe(v);
  return n == null ? '—' : n.toFixed(0);
}

function fmtNum(v, digits = 1) {
  const n = toNumMaybe(v);
  return n == null ? '—' : n.toFixed(digits);
}
// --------------------------
// Options
// --------------------------
const typeOptions = computed(() => {
  const set = new Set();
  for (const t of targets.value) if (t.type) set.add(t.type);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
});

const sectorOptions = [
  { value: 'N-NE', label: 'Nord → Nordost (315°–45°)' },
  { value: 'NE-E', label: 'Nordost → Ost (45°–90°)' },
  { value: 'E-SE', label: 'Ost → Südost (90°–135°)' },
  { value: 'SE-S', label: 'Südost → Süd (135°–180°)' },
  { value: 'S-SW', label: 'Süd → Südwest (180°–225°)' },
  { value: 'SW-W', label: 'Südwest → West (225°–270°)' },
  { value: 'W-NW', label: 'West → Nordwest (270°–315°)' },
  { value: 'NW-N', label: 'Nordwest → Nord (315°–360°)' },
];

const sampleCount = computed(() => {
  const ms = Math.max(1, sampleMinutes.value) * 60 * 1000;
  const n = Math.floor((windowEnd.value.getTime() - windowStart.value.getTime()) / ms) + 1;
  return Math.max(0, n);
});

// --------------------------
// Filtering + sorting
// --------------------------
const filteredTargets = computed(() => {
  const query = (q.value || '').trim().toLowerCase();
  const tf = typeFilter.value;
  const sf = sectorFilter.value;

  let arr = targets.value;

  if (query) {
    arr = arr.filter((t) => (t.name || '').toLowerCase().includes(query));
  }
  if (tf) {
    arr = arr.filter((t) => t.type === tf);
  }
  if (sf) {
    arr = arr.filter((t) => {
      if (t.bestAzDeg == null) return false;
      return azInSector(t.bestAzDeg, sf);
    });
  }
  if (onlyAboveHorizon.value) {
    arr = arr.filter((t) => t.maxAltDeg == null || t.maxAltDeg > 0);
  }

  // sort
  arr = [...arr];
  if (sortMode.value === 'maxAltDesc') {
    arr.sort((a, b) => (b.maxAltDeg ?? -999) - (a.maxAltDeg ?? -999));
  } else if (sortMode.value === 'bestTimeAsc') {
    arr.sort((a, b) => {
      const ta = a.bestTime ? new Date(a.bestTime).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.bestTime ? new Date(b.bestTime).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
  } else if (sortMode.value === 'nameAsc') {
    arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }
  return arr;
});

const displayedTargets = computed(() => {
  const lim = Math.max(1, limit.value || 20);
  return (filteredTargets.value || []).filter(Boolean).slice(0, lim);
});

// --------------------------
// Lifecycle
// --------------------------
onMounted(async () => {
  // Load data first (API), then location, then compute tracks
  await loadFavorites();
  await ensureLocation();
  await recomputeAll();
});

onBeforeUnmount(() => {
  // revoke preview urls
  for (const t of targets.value) {
    if (t.previewUrl && t.previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(t.previewUrl);
      } catch {}
    }
  }
  // clear pending draws
  Object.values(drawTimers).forEach((h) => h && clearTimeout(h));
});

// Recompute when location/time changes
watch([siteLat, siteLon, windowStart, windowEnd, sampleMinutes], async () => {
  await recomputeAll();
});

// Redraw & (optionally) lazy-load previews whenever list changes
watch(
  () =>
    (displayedTargets.value || [])
      .filter(Boolean)
      .map((x) => x._id)
      .join('|'),
  async () => {
    await nextTick();
    // Lazy previews: only visible cards; Non-lazy: ensure previews for all targets
    if (lazyPreviews.value) {
      for (const t of displayedTargets.value) ensurePreview(t);
    } else {
      for (const t of targets.value) ensurePreview(t);
    }
    // draw visible charts
    drawAllVisibleCharts();
  }
);

// Toggle cache: reload visible previews (so you see immediate effect)
watch(
  () => useNinaCache.value,
  async () => {
    for (const t of displayedTargets.value) {
      await reloadPreview(t);
    }
  }
);

// --------------------------
// Actions
// --------------------------
async function ensureLocation() {
  busyLocation.value = true;
  try {
    await getCurrentLocation();
  } catch (e) {
    // gpsError wird i.d.R. aus utils/location gesetzt
    console.warn('getCurrentLocation failed:', e);
  } finally {
    busyLocation.value = false;
  }
}

async function refreshAll() {
  await loadFavorites();
  await recomputeAll();
}

async function loadFavorites() {
  busy.value = true;
  try {
    const res = await apiService.getAllFavorites();

    console.log('[Planner] getAllFavorites raw:', res);

    const list = Array.isArray(res)
      ? res
      : (res?.Response ?? res?.data?.Response ?? res?.data ?? []);

    console.log('[Planner] extracted list:', list);

    apiFavorites.value = list;

    // Keep targets as merged list for existing computed/template
    targets.value = mergedTargets.value;

    console.log('[Planner] normalized targets:', targets.value);
  } catch (e) {
    console.error('[Planner] getAllFavorites failed', e);
    targets.value = [];
  } finally {
    busy.value = false;
  }
}

async function recomputeAll() {
  // Always base calculations on merged list
  targets.value = mergedTargets.value;

  // Recompute via immutable updates to keep Vue's VDOM stable
  if (!targets.value?.length) {
    await nextTick();
    drawAllVisibleCharts();
    return;
  }

  const hasLocation =
    hasSite.value && Number.isFinite(siteLat.value) && Number.isFinite(siteLon.value);

  targets.value = (targets.value || [])
    .filter((x) => x && typeof x === 'object' && x._id)
    .map((t) => {
      const nt = { ...t };

      nt._error = '';
      nt.track = null;
      nt.maxAltDeg = null;
      nt.bestTime = null;
      nt.bestAzDeg = null;
      nt.visibleHours = null;
      nt.tonightScore = 0;

      if (!hasLocation) return nt;
      if (nt.raDeg == null || nt.decDeg == null) return nt;

      try {
        const tr = buildTrack(
          nt.raDeg,
          nt.decDeg,
          windowStart.value,
          windowEnd.value,
          sampleMinutes.value,
          siteLat.value,
          siteLon.value
        );

        const samples = Array.isArray(tr?.samples)
          ? tr.samples
          : Array.isArray(tr?.points)
            ? tr.points
            : [];

        const smRaw = tr?.sampleMinutes ?? sampleMinutes.value ?? 5;
        const sm = Number.isFinite(smRaw) ? smRaw : Number(smRaw) || 5;

        nt.track = { ...tr, samples, sampleMinutes: sm };

        nt.maxAltDeg = tr.best?.altDeg ?? null;
        nt.bestTime = tr.best?.time ? tr.best.time.toISOString() : null;
        nt.bestAzDeg = tr.best?.azDeg ?? null;

        const MIN_ALT = 20;
        const visibleSamples = samples.filter((s) => (s?.altDeg ?? -999) >= MIN_ALT).length;
        nt.visibleHours = (visibleSamples * sm) / 60;

        nt.tonightScore = calculateTonightScore(nt, null);
      } catch (e) {
        nt._error = 'Track-Berechnung fehlgeschlagen';
        console.warn('buildTrack failed:', e);
      }
      return nt;
    });

  await nextTick();
  drawAllVisibleCharts();
  await nextTick();
  drawAllVisibleCharts();
}

function canSlew(t) {
  return t?.raDeg != null && t?.decDeg != null;
}
function canOpenFraming(t) {
  return canSlew(t);
}

async function slewOnly(t) {
  selectTarget(t);
  mountErr[t._id] = '';
  mountMsg[t._id] = 'Slewing…';
  try {
    const resp = await apiService.slewAndCenter(t.raDeg, t.decDeg, false);
    mountMsg[t._id] = resp?.Response ?? 'Slew command sent';
  } catch (e) {
    mountMsg[t._id] = '';
    mountErr[t._id] = extractErr(e, 'Slew failed');
  }
}

async function slewAndCenter(t) {
  selectTarget(t);
  mountErr[t._id] = '';
  mountMsg[t._id] = 'Slew+Center…';
  try {
    const resp = await apiService.slewAndCenter(t.raDeg, t.decDeg, true);
    mountMsg[t._id] = resp?.Response ?? 'Slew+Center completed';
  } catch (e) {
    mountMsg[t._id] = '';
    mountErr[t._id] = extractErr(e, 'Slew+Center failed');
  }
}

async function openInFramingAssistant(t) {
  selectTarget(t);
  mountErr[t._id] = '';
  mountMsg[t._id] = 'Öffne Framing Assistant…';

  // Guard: valid coordinates required
  if (!t || !Number.isFinite(t.raDeg) || !Number.isFinite(t.decDeg)) {
    mountMsg[t?._id] = '';
    mountErr[t?._id] = 'Ungültige Koordinaten (RA/DEC fehlen)';
    return;
  }

  try {
    // 1) Übergabe an Framing Assistant (lokal via Store)
    framingStore.RAangle = t.raDeg; // degrees
    framingStore.DECangle = t.decDeg; // degrees
    try {
      framingStore.targetName = t.name || '';
    } catch {}
    try {
      framingStore.rotation = t.rotation ?? 0;
    } catch {}

    // Optional: Backend synchronisieren
    try {
      await apiService.setFramingCoordinates(t.raDeg, t.decDeg);
    } catch {}

    // 2) open View
    framingStore.showFramingModal = true;

    mountMsg[t._id] = 'Framing Assistant geöffnet';
  } catch (e) {
    mountMsg[t._id] = '';
    mountErr[t._id] = extractErr(e, 'Open framing failed');
  }
}

// --------------------------
// Sequencer integration
// --------------------------
function hasLoadedSequence(info) {
  return Array.isArray(info) && info.length > 0;
}

async function sendToSequencer(t) {
  mountErr[t._id] = '';
  mountMsg[t._id] = tp('status.sendingToSequencer');

  try {
    await sequenceStore.getSequenceInfo();

    if (!hasLoadedSequence(sequenceStore.sequenceInfo)) {
      mountMsg[t._id] = '';
      mountErr[t._id] = tp('errors.noSequenceAvailable'); // "No sequence available"
      return;
    }

    const rotation = t.rotation ?? 0;

    const r = await apiService.sequnceTargetSet(t.name || 'Target', t.raDeg, t.decDeg, rotation, 0);

    if (r?.apiSuccess === false) throw new Error(r.message || 'Sequencer failed');

    mountErr[t._id] = '';
    mountMsg[t._id] = tp('status.sequencerTargetSet');
  } catch (e) {
    mountMsg[t._id] = '';
    mountErr[t._id] = extractErr(e, tp('errors.sequencerFailed'));
  }
}

// --------------------------
// Preview loading (targetpic)
// --------------------------
async function ensurePreview(t) {
  if (!t || t.previewUrl || t.previewError) return;
  // if no coordinates -> no preview
  if (t.raDeg == null || t.decDeg == null) {
    t.previewError = 'Keine Koordinaten';
    return;
  }
  await loadPreview(t);
}

async function reloadPreview(t) {
  if (!t) return;
  // revoke existing blob URLs
  if (t.previewUrl && t.previewUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(t.previewUrl);
    } catch {}
  }
  t.previewUrl = '';
  t.previewError = '';
  await loadPreview(t);
}

async function loadPreview(t) {
  busyPreview[t._id] = true;
  t.previewError = '';
  try {
    // Dimensionen: so wie bei deinem Screenshot “square card”
    const width = 512;
    const height = 512;

    // FOV: ohne konkrete Optik nehmen wir einen sinnvollen Default (Grad)
    // (Wenn du später FOV aus Profile/Settings ziehen willst, einfach ersetzen.)
    const fov = 2.0;

    const url = await apiService.searchTargetPic(
      width,
      height,
      fov,
      t.raDeg,
      t.decDeg,
      useNinaCache.value
    );
    t.previewUrl = url;
  } catch (e) {
    t.previewUrl = '';
    t.previewError = extractErr(e, 'Preview load failed');
  } finally {
    busyPreview[t._id] = false;
  }
}

function onPreviewError(t) {
  t.previewError = 'Bild konnte nicht geladen werden';
  // optional: if blob url broken, release
  if (t.previewUrl && t.previewUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(t.previewUrl);
    } catch {}
  }
  t.previewUrl = '';
}

// --------------------------
// Canvas chart
// --------------------------
function setCanvasRef(id, el) {
  if (!id) return;
  canvasRefs[id] = el || null;
}

function drawAllVisibleCharts() {
  for (const t of displayedTargets.value) drawOneChart(t);
}

function drawOneChart(t) {
  if (!t?.track || !hasSite.value) return;
  const canvas = canvasRefs[t._id];
  if (!canvas) {
    // canvas might not be mounted yet; schedule once
    if (drawTimers[t._id]) clearTimeout(drawTimers[t._id]);
    drawTimers[t._id] = setTimeout(() => drawOneChart(t), 60);
    return;
  }
  drawAltitudeChart(canvas, t.track.points, windowStart.value, windowEnd.value, t.track.best);
}
// --------------------------
// Data normalization
// --------------------------
function normalizeFavorites(list) {
  const arr = Array.isArray(list) ? list : [];

  return arr.filter(Boolean).map((raw, idx) => {
    const name = raw?.name ?? raw?.Name ?? raw?.title ?? raw?.Title ?? raw?.TargetName ?? '';

    const type =
      raw?.type ?? raw?.Type ?? raw?.objectType ?? raw?.ObjectType ?? raw?.category ?? 'unknown';

    const raRaw =
      raw?.raDeg ??
      raw?.RADegrees ??
      raw?.RaDeg ??
      raw?.ra ??
      raw?.RA ??
      raw?.Ra ??
      raw?.RightAscensionDeg ??
      raw?.RightAscension ??
      raw?.RaString ??
      null;

    const decRaw =
      raw?.decDeg ??
      raw?.DecDeg ??
      raw?.dec ??
      raw?.DEC ??
      raw?.Dec ??
      raw?.DeclinationDeg ??
      raw?.Declination ??
      raw?.DecString ??
      null;

    // RA: numbers assumed degrees; strings assumed HMS (hours)
    let raDeg =
      typeof raRaw === 'number' ? (Number.isFinite(raRaw) ? raRaw : null) : parseRaToDeg(raRaw);

    // Dec: numbers assumed degrees; strings assumed DMS
    let decDeg =
      typeof decRaw === 'number'
        ? Number.isFinite(decRaw)
          ? decRaw
          : null
        : parseDecToDeg(decRaw);

    // heuristic: if RA looks like hours (0..24) and no explicit deg field provided
    if (
      raDeg != null &&
      raDeg >= 0 &&
      raDeg <= 24 &&
      raw?.RADegrees == null &&
      raw?.raDeg == null &&
      raw?.RaDeg == null
    ) {
      raDeg = raDeg * 15.0;
    }

    const stableId =
      raw?.id ??
      raw?.Id ??
      raw?._id ??
      `fav-${idx}-${String(name).slice(0, 24)}-${raDeg ?? 'na'}-${decDeg ?? 'na'}`;

    return {
      _id: String(stableId),
      _raw: raw,

      name,
      type,

      raDeg,
      decDeg,

      previewUrl: '',
      previewError: '',
      _showHint: false,

      track: null,
      maxAltDeg: null,
      bestTime: null,
      bestAzDeg: null,
      visibleHours: null,
      tonightScore: 0,

      _error: '',
    };
  });
}

function makeStableFavoriteId(name, raDeg, decDeg) {
  const base = JSON.stringify({
    n: name ?? '',
    ra: raDeg ?? null,
    dec: decDeg ?? null,
  });
  return 'fav-' + hashString(base);
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// --------------------------
// RA/Dec (deg), date, lat/lon (deg) -> alt/az (deg)
function radecToAltAz(raDeg, decDeg, date, latDeg, lonDeg) {
  const ra = toRad(raDeg);
  const dec = toRad(decDeg);
  const lat = toRad(latDeg);

  const lst = toRad(localSiderealTimeDeg(date, lonDeg));
  const ha = normalizeRad(lst - ra); // hour angle

  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const alt = Math.asin(clamp(sinAlt, -1, 1));

  // azimuth (0..2pi), measured from North towards East
  const cosAz = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat));
  let az = Math.acos(clamp(cosAz, -1, 1));
  // resolve quadrant
  if (Math.sin(ha) > 0) az = 2 * Math.PI - az;

  return { altDeg: toDeg(alt), azDeg: toDeg(az) };
}

// Track over window
function buildTrack(raDeg, decDeg, start, end, stepMin, latDeg, lonDeg) {
  const msStep = Math.max(2, stepMin) * 60 * 1000;
  const points = [];
  let best = { altDeg: -999, azDeg: 0, time: new Date(start) };

  for (let t = start.getTime(); t <= end.getTime(); t += msStep) {
    const dt = new Date(t);
    const { altDeg, azDeg } = radecToAltAz(raDeg, decDeg, dt, latDeg, lonDeg);
    points.push({ time: dt, altDeg, azDeg });
    if (altDeg > best.altDeg) best = { altDeg, azDeg, time: dt };
  }
  return { points, best };
}

// --------------------------
// Time helpers
// --------------------------
function defaultStart() {
  const now = new Date();
  const d = new Date(now);
  d.setHours(18, 0, 0, 0);
  // if already past 18:00, keep today; else today 18:00
  return d;
}
function defaultEnd() {
  const now = new Date();
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(6, 0, 0, 0);
  return d;
}

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function fromLocalInputValue(v) {
  if (!v) return null;
  const dt = new Date(v);
  return isNaN(dt.getTime()) ? null : dt;
}

function fmtTime(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtRa(raDeg) {
  // deg -> hh:mm
  const hours = (raDeg / 15 + 24) % 24;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function fmtDec(decDeg) {
  const sign = decDeg >= 0 ? '+' : '-';
  const a = Math.abs(decDeg);
  const d = Math.floor(a);
  const m = Math.floor((a - d) * 60);
  return `${sign}${String(d).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// --------------------------
// Sidereal time (approx)
// --------------------------
// returns GMST deg
function gmstDeg(date) {
  // Meeus-ish simplified
  const jd = toJulianDate(date);
  const T = (jd - 2451545.0) / 36525.0;
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;
  gmst = ((gmst % 360) + 360) % 360;
  return gmst;
}
// LST deg = GMST + lon (east positive)
function localSiderealTimeDeg(date, lonDeg) {
  let lst = gmstDeg(date) + lonDeg;
  lst = ((lst % 360) + 360) % 360;
  return lst;
}
function toJulianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// --------------------------
// Chart drawing
// --------------------------
function drawAltitudeChart(canvas, points, start, end, best) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // HiDPI
  const cssW = canvas.clientWidth || 300;
  const cssH = 140;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // clear
  ctx.clearRect(0, 0, cssW, cssH);

  // background grid
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;

  // axes padding
  const padL = 34;
  const padR = 10;
  const padT = 10;
  const padB = 22;
  const W = cssW - padL - padR;
  const H = cssH - padT - padB;

  // find alt range (clamp to 0..90 for readability)
  const minAlt = 0;
  const maxAlt = 90;

  // grid lines (alt)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '10px system-ui';
  for (const alt of [0, 30, 60, 90]) {
    const y = padT + H * (1 - (alt - minAlt) / (maxAlt - minAlt));
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + W, y);
    ctx.stroke();
    ctx.fillText(String(alt), 6, y + 3);
  }

  // horizon line
  const y0 = padT + H * (1 - (0 - minAlt) / (maxAlt - minAlt));
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.moveTo(padL, y0);
  ctx.lineTo(padL + W, y0);
  ctx.stroke();

  // line
  const t0 = start.getTime();
  const t1 = end.getTime();
  const xOf = (dt) => padL + W * ((dt.getTime() - t0) / (t1 - t0));
  const yOf = (alt) => padT + H * (1 - (alt - minAlt) / (maxAlt - minAlt));

  ctx.strokeStyle = 'rgba(56,189,248,0.95)'; // cyan-ish
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const x = xOf(p.time);
    const y = yOf(p.altDeg);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // best marker
  if (best?.time) {
    const xb = xOf(best.time);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xb, padT);
    ctx.lineTo(xb, padT + H);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '10px system-ui';
    ctx.fillText(fmtTime(best.time), Math.max(padL, xb - 18), cssH - 6);
  }

  // x labels (few)
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '10px system-ui';
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const dt = new Date(t0 + ((t1 - t0) * i) / ticks);
    const x = xOf(dt);
    ctx.fillText(fmtTime(dt), x - 14, cssH - 6);
  }
}

// --------------------------
// Seed + Favorites merge
// --------------------------
const seedData =
  seedTargets && seedTargets.targets ? seedTargets : (seedTargets?.default ?? seedTargets);

const seedTargetsNormalized = computed(() => {
  const arr = Array.isArray(seedData?.targets) ? seedData.targets : [];
  return arr.filter(Boolean).map((t, idx) => {
    const name = t?.name ?? t?.Name ?? t?.title ?? `Seed ${idx + 1}`;
    const type = t?.type ?? t?.Type ?? 'unknown';

    const raH = parseRaToDeg(t?.ra ?? t?.Ra ?? t?.RA ?? t?.RaString ?? null);
    const raDeg = raH == null ? null : raH * 15.0;
    const decDeg = parseDecToDeg(t?.dec ?? t?.Dec ?? t?.DEC ?? t?.DecString ?? null);

    const stableId = t?.id ?? t?.Id ?? t?._id ?? makeStableFavoriteId(name, raDeg, decDeg);

    return {
      _id: String(stableId),
      _raw: t,
      name,
      type,
      raDeg,
      decDeg,
      source: 'seed',
      previewUrl: '',
      previewError: '',
      _showHint: false,
      track: null,
      maxAltDeg: null,
      bestTime: null,
      bestAzDeg: null,
      visibleHours: null,
      tonightScore: 0,
      _error: '',
    };
  });
});

const favoriteTargetsComputed = computed(() => normalizeFavorites(apiFavorites.value));

// --------------------------
// Merge (Favorites win)
// --------------------------
function mergeSeedAndFavorites(seedArr, favArr) {
  const out = Array.isArray(favArr) ? [...favArr] : [];
  const seeds = Array.isArray(seedArr) ? seedArr : [];

  for (const s of seeds) {
    if (!s || s.raDeg == null || s.decDeg == null) continue;

    const exists = out.some(
      (f) =>
        f &&
        f.raDeg != null &&
        f.decDeg != null &&
        Math.abs(f.raDeg - s.raDeg) < 0.05 &&
        Math.abs(f.decDeg - s.decDeg) < 0.05
    );

    if (!exists) out.push(s);
  }
  return out;
}

const mergedTargets = computed(() =>
  mergeSeedAndFavorites(seedTargetsNormalized.value, favoriteTargetsComputed.value)
);

// --------------------------
// Azimuth helpers
// --------------------------
function azInSector(azDeg, sector) {
  const az = ((azDeg % 360) + 360) % 360;

  const inRange = (a, from, to) => {
    // handles wrap-around
    if (from <= to) return a >= from && a < to;
    return a >= from || a < to;
  };

  switch (sector) {
    case 'N-NE':
      return inRange(az, 315, 360) || inRange(az, 0, 45);
    case 'NE-E':
      return inRange(az, 45, 90);
    case 'E-SE':
      return inRange(az, 90, 135);
    case 'SE-S':
      return inRange(az, 135, 180);
    case 'S-SW':
      return inRange(az, 180, 225);
    case 'SW-W':
      return inRange(az, 225, 270);
    case 'W-NW':
      return inRange(az, 270, 315);
    case 'NW-N':
      return inRange(az, 315, 360) || inRange(az, 0, 0.0001); // tiny wrap
    default:
      return true;
  }
}

function azToCardinal(azDeg) {
  const az = ((azDeg % 360) + 360) % 360;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(az / 45) % 8;
  return dirs[idx];
}

// --------------------------
// Math utils
// --------------------------
function toRad(deg) {
  return (deg * Math.PI) / 180;
}
function toDeg(rad) {
  return (rad * 180) / Math.PI;
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
const tonightPicks = computed(() =>
  targets.value
    .filter((t) => t.tonightScore > 0)
    .sort((a, b) => b.tonightScore - a.tonightScore)
    .slice(0, 10)
);
function normalizeRad(r) {
  const twoPi = 2 * Math.PI;
  r = r % twoPi;
  if (r < -Math.PI) r += twoPi;
  if (r > Math.PI) r -= twoPi;
  return r;
}

// --------------------------
// Error helper
// --------------------------
function extractErr(e, fallback) {
  const msg =
    e?.response?.data?.Error ||
    e?.response?.data?.message ||
    e?.response?.data?.Response ||
    e?.message ||
    '';
  return msg ? String(msg) : fallback;
}

function calculateTonightScore(target, moon) {
  const samples = Array.isArray(target?.track?.samples)
    ? target.track.samples
    : Array.isArray(target?.track?.points)
      ? target.track.points
      : [];

  if (!samples.length) return 0;

  const MIN_ALT = 20;

  // A) Altitude factor
  const maxAlt = target.track.best?.altDeg ?? 0;
  const altitudeFactor = clamp(maxAlt / 90, 0, 1);

  // B) Visibility duration
  const visibleSamples = samples.filter((s) => (s?.altDeg ?? -999) >= MIN_ALT).length;

  const smRaw = target.track.sampleMinutes ?? 5;
  const sampleMinutes = Number.isFinite(smRaw) ? smRaw : Number(smRaw) || 5;

  const visibilityHours = (visibleSamples * sampleMinutes) / 60;

  // C) Moon penalty
  let moonPenalty = 0;
  if (moon) {
    const illumination = clamp(moon.illumination ?? 0, 0, 1);
    const separationDeg = moon.separationDeg ?? 180;
    const separationFactor = clamp((separationDeg - 30) / 90, 0, 1);

    const typeFactor =
      {
        galaxy: 1.0,
        nebula: 0.8,
        planetary_nebula: 0.3,
        cluster: 0.2,
        widefield: 1.2,
        unknown: 0.7,
      }[target?.type] ?? 0.7;

    moonPenalty = illumination * (1 - separationFactor) * typeFactor * 2.0;
  }

  // Favorite bonus
  const favoriteBonus = target?.source === 'favorite' ? 1.15 : 1.0;

  // Final score
  const score = altitudeFactor * visibilityHours * favoriteBonus - moonPenalty;
  return Math.max(0, score);
}

function tonightLabel(score) {
  if (score >= 3.0) return '🔥 Excellent';
  if (score >= 2.0) return '⭐ Very good';
  if (score >= 1.0) return '👍 Good';
  if (score >= 0.5) return '⚠️ Difficult';
  return '❌ Skip';
}
function isSameTarget(a, b, tolDeg = 0.05) {
  if (a?.raDeg == null || a?.decDeg == null) return false;
  if (b?.raDeg == null || b?.decDeg == null) return false;

  return Math.abs(a.raDeg - b.raDeg) <= tolDeg && Math.abs(a.decDeg - b.decDeg) <= tolDeg;
}
</script>

<style scoped>
canvas {
  display: block;
}
</style>
<style scoped>
.action-icon-btn {
  @apply inline-flex items-center justify-center gap-2 w-full h-10 rounded-lg border text-sm transition disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
