<template>
  <!-- RMS Error — always visible -->
  <div class="shrink-0 text-sm">
    <p class="font-bold">{{ $t('components.guider.rms_error') }}:</p>
    <div class="grid grid-cols-3 gap-x-3 tabular-nums w-fit">
      <span class="text-gray-400">RA</span>
      <span>{{ store.guiderInfo?.RMSError?.RA.Pixel.toFixed(2) }} px</span>
      <span class="text-gray-400">{{ store.guiderInfo?.RMSError?.RA.Arcseconds.toFixed(2) }}"</span>
      <span class="text-gray-400">DEC</span>
      <span>{{ store.guiderInfo?.RMSError?.Dec.Pixel.toFixed(2) }} px</span>
      <span class="text-gray-400"
        >{{ store.guiderInfo?.RMSError?.Dec.Arcseconds.toFixed(2) }}"</span
      >
      <span class="text-gray-400">Total</span>
      <span class="font-semibold">{{ store.guiderInfo?.RMSError?.Total.Pixel.toFixed(2) }} px</span>
      <span class="text-gray-400"
        >{{ store.guiderInfo?.RMSError?.Total.Arcseconds.toFixed(2) }}"</span
      >
    </div>
  </div>

  <!-- Algo params (PINS only) -->
  <template v-if="store.isPINS && guiderStore.phd2IsConnected">
    <div v-if="algoParams.ra" class="shrink-0 text-sm">
      <p class="font-bold">RA params:</p>
      <div class="grid grid-cols-2 gap-x-3 w-fit">
        <template v-for="(val, name) in algoParams.ra" :key="name">
          <template v-if="!EXCLUDED_PARAMS.includes(String(name))">
            <span class="text-gray-400">{{ name }}</span>
            <span
              v-if="typeof val === 'number'"
              class="cursor-pointer"
              style="color: rgba(100, 170, 230, 1)"
              @click="openParamPicker('ra', String(name), val)"
              >{{ displayVal(String(name), val) }}</span
            >
            <span v-else>{{ val }}</span>
          </template>
        </template>
      </div>
    </div>

    <div v-if="algoParams.dec" class="shrink-0 text-sm">
      <p class="font-bold">DEC params:</p>
      <div class="grid grid-cols-2 gap-x-3 w-fit">
        <template v-for="(val, name) in algoParams.dec" :key="name">
          <template v-if="!EXCLUDED_PARAMS.includes(String(name))">
            <span class="text-gray-400">{{ name }}</span>
            <span
              v-if="typeof val === 'number'"
              class="cursor-pointer"
              style="color: rgba(255, 80, 100, 1)"
              @click="openParamPicker('dec', String(name), val)"
              >{{ displayVal(String(name), val) }}</span
            >
            <span v-else>{{ val }}</span>
          </template>
        </template>
      </div>
    </div>

    <!-- Guide Algorithms — far right -->
    <div class="shrink-0 text-sm">
      <p class="font-bold">Guide Algorithms:</p>
      <div class="grid grid-cols-4 gap-x-3 w-fit">
        <span class="text-gray-400">RA algo</span>
        <span>{{ guiderStore.phd2GuideAlgorithmRA }}</span>
        <span class="text-gray-400">DEC algo</span>
        <span>{{ guiderStore.phd2GuideAlgorithmDEC }}</span>
        <span class="text-gray-400">Max RA</span>
        <span
          class="cursor-pointer"
          style="color: rgba(100, 170, 230, 1)"
          @click="openMaxDurationPicker('ra')"
          >{{ maxRaDuration }}</span
        >
        <span class="text-gray-400">Max DEC</span>
        <span
          class="cursor-pointer"
          style="color: rgba(255, 80, 100, 1)"
          @click="openMaxDurationPicker('dec')"
          >{{ maxDecDuration }}</span
        >
        <span></span>
        <span></span>
        <span class="text-gray-400">Dec mode</span>
        <span
          class="cursor-pointer"
          style="color: rgba(255, 80, 100, 1)"
          @click="cycleDecGuideMode"
          >{{ decGuideMode }}</span
        >
      </div>
    </div>
  </template>
</template>

<script setup>
import { ref, watch } from 'vue';
import { apiStore } from '@/store/store';
import { useGuiderStore } from '@/store/guiderStore';
import apiPinsService from '@/services/apiPinsService';
import apiService from '@/services/apiService';
import { useNumberPicker } from '@/composables/useNumberPicker';

const store = apiStore();
const guiderStore = useGuiderStore();
const { openPicker } = useNumberPicker();

const EXCLUDED_PARAMS = ['algorithmName', 'fastSwitch', 'periodLength'];

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
  if (!store.isPINS || !guiderStore.phd2IsConnected) return;
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
  if (!store.isPINS || !guiderStore.phd2IsConnected) return;
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
  if (!store.isPINS || !guiderStore.phd2IsConnected) return;
  algoLoading.value = algoParams.value.ra === null && algoParams.value.dec === null;
  const [ra, dec] = await Promise.all([fetchParamsForAxis('ra'), fetchParamsForAxis('dec')]);
  algoParams.value = { ra, dec };
  algoLoading.value = false;
}

async function fetchGuideAlgorithms() {
  if (!store.isPINS || !guiderStore.phd2IsConnected) return;
  await Promise.all([
    guiderStore.fetchPHD2GuideAlgorithmRA(),
    guiderStore.fetchPHD2GuideAlgorithmDEC(),
  ]);
}

function fetchAll() {
  fetchGuideAlgorithms();
  fetchAlgoParams();
  fetchDecGuideMode();
  fetchMaxDurations();
}

watch(
  () => guiderStore.phd2IsConnected,
  (connected) => {
    if (connected) fetchAll();
  },
  { immediate: true }
);

watch(
  () => guiderStore.showGuiderGraph,
  (visible) => {
    if (visible && guiderStore.phd2IsConnected) fetchAll();
  }
);

watch(() => [guiderStore.phd2GuideAlgorithmRA, guiderStore.phd2GuideAlgorithmDEC], fetchAlgoParams);
</script>

<style scoped></style>
