<template>
  <p class="font-bold">{{ $t('components.guider.rms_error') }}:</p>
  <p>
    RA: {{ store.guiderInfo?.RMSError?.RA.Pixel.toFixed(2) }} ({{
      store.guiderInfo?.RMSError?.RA.Arcseconds.toFixed(2)
    }}")
  </p>
  <p>
    DEC: {{ store.guiderInfo.RMSError?.Dec.Pixel.toFixed(2) }} ({{
      store.guiderInfo?.RMSError?.Dec.Arcseconds.toFixed(2)
    }}")
  </p>
  <p>
    Total: {{ store.guiderInfo.RMSError?.Total.Pixel.toFixed(2) }} ({{
      store.guiderInfo.RMSError?.Total.Arcseconds.toFixed(2)
    }}")
  </p>

  <template v-if="store.isPINS">
    <p class="font-bold">Guide Algorithms:</p>
    <p>RA algo: {{ guiderStore.phd2GuideAlgorithmRA }}</p>
    <template v-if="algoParams.ra">
      <p
        v-for="(val, name) in algoParams.ra"
        :key="name"
        v-show="!EXCLUDED_PARAMS.includes(String(name))"
      >
        {{ name }}:
        <span
          v-if="typeof val === 'number'"
          class="cursor-pointer"
          style="color: rgba(100, 170, 230, 1)"
          @click="openParamPicker('ra', String(name), val)"
          >{{ displayVal(String(name), val) }}</span
        >
        <span v-else>{{ val }}</span>
      </p>
    </template>
    <p v-else-if="algoLoading">…</p>
    <p>
      Max RA duration:
      <span
        class="cursor-pointer"
        style="color: rgba(100, 170, 230, 1)"
        @click="openMaxDurationPicker('ra')"
        >{{ maxRaDuration ?? '…' }}</span
      >
    </p>
    <p>DEC algo: {{ guiderStore.phd2GuideAlgorithmDEC }}</p>
    <template v-if="algoParams.dec">
      <p
        v-for="(val, name) in algoParams.dec"
        :key="name"
        v-show="!EXCLUDED_PARAMS.includes(String(name))"
      >
        {{ name }}:
        <span
          v-if="typeof val === 'number'"
          class="cursor-pointer"
          style="color: rgba(255, 80, 100, 1)"
          @click="openParamPicker('dec', String(name), val)"
          >{{ displayVal(String(name), val) }}</span
        >
        <span v-else>{{ val }}</span>
      </p>
    </template>
    <p v-else-if="algoLoading">…</p>
    <p>
      Max DEC duration:
      <span
        class="cursor-pointer"
        style="color: rgba(255, 80, 100, 1)"
        @click="openMaxDurationPicker('dec')"
        >{{ maxDecDuration ?? '…' }}</span
      >
    </p>
    <p>
      Dec guide mode:
      <span
        class="cursor-pointer"
        style="color: rgba(255, 80, 100, 1)"
        @click="cycleDecGuideMode"
        >{{ decGuideMode ?? '…' }}</span
      >
    </p>
  </template>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { apiStore } from '@/store/store';
import { useGuiderStore } from '@/store/guiderStore';
import apiPinsService from '@/services/apiPinsService';
import apiService from '@/services/apiService';
import { useNumberPicker } from '@/composables/useNumberPicker';

const store = apiStore();
const guiderStore = useGuiderStore();
const { openPicker } = useNumberPicker();

const EXCLUDED_PARAMS = ['algorithmName', 'fastSwitch', 'periodLength'];

// Mirrors SetRaAlgoPara / SetDecAlgoPara: scale = multiply raw API value for display,
// divide display value back when setting.
const PARAM_CONFIG = {
  minMove: { min: 0, max: 20, step: 0.01, scale: 1 },
  aggression: { min: 0, max: 100, step: 1, scale: 100 },
  hysteresis: { min: 0, max: 99, step: 1, scale: 100 },
  predictiveWeight: { min: 0, max: 100, step: 1, scale: 100 },
  reactiveWeight: { min: 0, max: 100, step: 1, scale: 100 },
  slopeWeight: { min: 0, max: 20, step: 0.01, scale: 1 },
  expFactor: { min: 0, max: 20, step: 0.1, scale: 1 },
};

function getConfig(name) {
  return PARAM_CONFIG[name] ?? { min: 0, max: 100, step: 0.01, scale: 1 };
}

function displayVal(name, val) {
  if (typeof val !== 'number') return val;
  const cfg = getConfig(name);
  const scaled = val * cfg.scale;
  const dp = String(cfg.step).includes('.') ? String(cfg.step).split('.')[1].length : 0;
  return scaled.toFixed(dp);
}

function openParamPicker(axis, name, currentVal) {
  const cfg = getConfig(name);
  openPicker(name, cfg.min, cfg.max, cfg.step, currentVal * cfg.scale, async (newVal) => {
    await apiService.setPHD2AlgoParam(axis, name, newVal / cfg.scale);
    await fetchAlgoParams();
  });
}

const algoParams = ref({ ra: null, dec: null });
const algoLoading = ref(false);
const decGuideMode = ref(null);
const DEC_GUIDE_MODES = ['Off', 'Auto', 'North', 'South'];
const maxRaDuration = ref(null);
const maxDecDuration = ref(null);
let pollTimer = null;

async function fetchParamsForAxis(axis) {
  try {
    const namesResp = await apiPinsService.getAlgoParamNames(axis);
    if (!namesResp?.Success || !Array.isArray(namesResp.Response?.ParameterNames)) return null;
    const names = namesResp.Response.ParameterNames.filter((n) => !EXCLUDED_PARAMS.includes(n));
    const entries = await Promise.all(
      names.map(async (name) => {
        const r = await apiPinsService.getAlgoParam(axis, name);
        return [name, r?.Success ? r.Response?.Value : null];
      })
    );
    return Object.fromEntries(entries);
  } catch {
    return null;
  }
}

async function fetchMaxDurations() {
  if (!store.isPINS) return;
  try {
    const ra = await apiPinsService.getMaxRaDuration();
    if (ra?.Success) maxRaDuration.value = ra.Response?.MaxRaDuration ?? null;
  } catch {}
  try {
    const dec = await apiPinsService.getMaxDecDuration();
    if (dec?.Success) maxDecDuration.value = dec.Response?.MaxDecDuration ?? null;
  } catch {}
}

function openMaxDurationPicker(axis) {
  const current = axis === 'ra' ? maxRaDuration.value : maxDecDuration.value;
  openPicker(
    axis === 'ra' ? 'Max RA Duration (ms)' : 'Max DEC Duration (ms)',
    0,
    8000,
    10,
    current ?? 0,
    async (newVal) => {
      if (axis === 'ra') {
        await apiPinsService.setMaxRaDuration(Math.round(newVal));
        maxRaDuration.value = Math.round(newVal);
      } else {
        await apiPinsService.setMaxDecDuration(Math.round(newVal));
        maxDecDuration.value = Math.round(newVal);
      }
    },
    0
  );
}

async function fetchDecGuideMode() {
  if (!store.isPINS) return;
  try {
    const r = await apiPinsService.getDecGuideMode();
    if (r?.Success) decGuideMode.value = r.Response?.DecGuideMode ?? null;
  } catch {
    // ignore
  }
}

async function cycleDecGuideMode() {
  const idx = DEC_GUIDE_MODES.indexOf(decGuideMode.value);
  const next = DEC_GUIDE_MODES[(idx + 1) % DEC_GUIDE_MODES.length];
  try {
    await apiPinsService.setDecGuideMode(next);
    decGuideMode.value = next;
  } catch {
    // ignore
  }
}

async function fetchAlgoParams() {
  if (!store.isPINS) return;
  algoLoading.value = algoParams.value.ra === null && algoParams.value.dec === null;
  const [ra, dec] = await Promise.all([fetchParamsForAxis('ra'), fetchParamsForAxis('dec')]);
  algoParams.value = { ra, dec };
  algoLoading.value = false;
}

onMounted(async () => {
  if (store.isPINS) {
    await Promise.all([
      guiderStore.fetchPHD2GuideAlgorithmRA(),
      guiderStore.fetchPHD2GuideAlgorithmDEC(),
    ]);
  }
  fetchAlgoParams();
  fetchDecGuideMode();
  fetchMaxDurations();
  pollTimer = setInterval(() => {
    fetchAlgoParams();
    fetchDecGuideMode();
    fetchMaxDurations();
  }, 10000);
});

onUnmounted(() => {
  clearInterval(pollTimer);
});

watch(() => [guiderStore.phd2GuideAlgorithmRA, guiderStore.phd2GuideAlgorithmDEC], fetchAlgoParams);
</script>

<style scoped></style>
