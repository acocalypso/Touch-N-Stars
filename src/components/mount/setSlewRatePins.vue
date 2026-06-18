<template>
  <div class="flex flex-col w-full gap-1">
    <p class="text-xs sm:text-sm min-w-24 sm:min-w-32 font-medium text-gray-500">
      {{
        indiSteps.length > 0
          ? $t('components.mount.control.slewRateINDI')
          : $t('components.mount.control.slewRate')
      }}
    </p>

    <div class="relative pt-3 pb-5">
      <div
        class="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 rounded-full -translate-y-1/2"
      ></div>

      <div
        class="absolute top-1/2 left-0 h-1 bg-cyan-800 rounded-full -translate-y-1/2 pointer-events-none"
        :style="{ width: `${maxIndex > 0 ? (currentIndex / maxIndex) * 100 : 0}%` }"
      ></div>

      <div
        v-for="i in stepCount"
        :key="`tick-${i}`"
        class="absolute top-1/2 w-px h-2 bg-gray-500 -translate-y-1/2 pointer-events-none"
        :style="{ left: `${maxIndex > 0 ? ((i - 1) / maxIndex) * 100 : 0}%` }"
      ></div>

      <span
        class="absolute bottom-0 left-0 text-[10px] text-gray-500 pointer-events-none select-none leading-none"
      >
        {{ minLabel }}
      </span>
      <span
        class="absolute bottom-0 right-0 text-[10px] text-gray-500 pointer-events-none select-none leading-none"
      >
        {{ maxLabel }}
      </span>

      <div
        class="absolute top-1/2 w-2 h-6 rounded-md bg-cyan-500 -translate-y-1/2 -translate-x-1/2 pointer-events-none shadow-lg"
        :style="{ left: `${maxIndex > 0 ? (currentIndex / maxIndex) * 100 : 0}%` }"
      ></div>

      <input
        type="range"
        min="0"
        :max="maxIndex"
        step="1"
        :value="currentIndex"
        @input="onInput"
        class="absolute w-full top-1/2 -translate-y-1/2 h-8 appearance-none bg-transparent cursor-pointer slider-input"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import apiPinsService from '@/services/apiPinsService';

// Fallback steps used when no INDI slew rate property can be resolved.
const FALLBACK_VALUES = [0.01, 1, 2, 3, 4, 5, 6, 7, 8, 9];
// Fallback for the configured max slew rate (°/s) when the profile value is missing.
// Matches the backend default (TelescopeSettings.IndiMaxSlewRateDps).
const DEFAULT_MAX_SLEW_RATE_DPS = 3.0;

const settingsStore = useSettingsStore();
const store = apiStore();

// INDI slew rate switch elements [{ name, label }], in driver order. Empty => fallback.
const indiSteps = ref([]);

// Configured maximum slew rate in °/s. The backend reports AxisRates as (0, this) and maps
// the WS `rate` proportionally onto the ordered INDI switch list, so the per-stop rate must
// span 0..maxSlewRateDps for stop i to select switch index i.
const maxSlewRateDps = computed(
  () => store.profileInfo?.TelescopeSettings?.IndiMaxSlewRateDps ?? DEFAULT_MAX_SLEW_RATE_DPS
);

// Smallest non-zero rate for the slowest stop. The WS treats rate 0 as "stop", so the
// lowest INDI step must still move; this stays well below the backend's index-0 threshold.
const MIN_RATE = 0.01;

// Numeric rate value (°/s) for each slider stop. INDI switches carry no speed value, so we
// spread linearly from ~0 to maxSlewRateDps; the backend then rounds rate/maxDps*maxIndex to
// the matching switch index.
const stops = computed(() => {
  const n = indiSteps.value.length;
  if (n === 0) return FALLBACK_VALUES;
  if (n === 1) return [maxSlewRateDps.value];
  return indiSteps.value.map((_, i) => (i === 0 ? MIN_RATE : (maxSlewRateDps.value * i) / (n - 1)));
});

const stepCount = computed(() => stops.value.length);
const maxIndex = computed(() => stepCount.value - 1);

const minLabel = computed(() => (indiSteps.value.length > 0 ? indiSteps.value[0].label : 'min'));
const maxLabel = computed(() =>
  indiSteps.value.length > 0 ? indiSteps.value[indiSteps.value.length - 1].label : 'max'
);

const currentIndex = computed(() => {
  const v = settingsStore.mount.slewRate;
  const values = stops.value;
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < values.length; i++) {
    const d = Math.abs(values[i] - v);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
});

function onInput(event) {
  const idx = parseInt(event.target.value, 10);
  settingsStore.mount.slewRate = stops.value[idx];
  settingsStore.saveMountSettings();
}

// Resolve the slew rate SWITCH property from INDI to drive the slider's stops/labels.
// INDI exposes this differently per driver (varying element count/names), so we match
// heuristically. Failures are non-fatal: the slider falls back to FALLBACK_VALUES.
function findSlewRateProperty(properties) {
  if (!Array.isArray(properties)) return null;
  const isSlewRate = (prop) => {
    const name = (prop.Name || '').toLowerCase();
    const label = (prop.Label || '').toLowerCase();
    const matches = (s) => s.includes('slew_rate') || (s.includes('slew') && s.includes('rate'));
    return matches(name) || matches(label);
  };
  return (
    properties.find((p) => p.Type === 'switch' && isSlewRate(p)) ||
    properties.find((p) => isSlewRate(p)) ||
    null
  );
}

async function loadIndiSteps() {
  try {
    const device = store.profileInfo?.TelescopeSettings?.Id;
    if (!device) return;

    const res = await apiPinsService.getINDIProperties(device);
    const devices = res && res.Response ? res.Response : [];
    if (!Array.isArray(devices) || devices.length === 0) return;

    // Prefer the device whose name matches the profile; otherwise the first device that
    // actually exposes a slew rate property (INDI Device name may differ from the profile Id).
    let target = devices.find((d) => d.Device === device);
    let prop = target ? findSlewRateProperty(target.Properties) : null;
    if (!prop) {
      for (const d of devices) {
        const p = findSlewRateProperty(d.Properties);
        if (p) {
          target = d;
          prop = p;
          break;
        }
      }
    }

    if (!prop || !Array.isArray(prop.Elements) || prop.Elements.length === 0) return;

    indiSteps.value = prop.Elements.map((el) => ({
      name: el.Name,
      label: el.Label || el.Name,
    }));
  } catch (e) {
    // Best-effort: keep the fallback slider on any error.
    console.error('Failed to load INDI slew rate steps:', e);
  }
}

onMounted(loadIndiSteps);
</script>

<style scoped>
.slider-input {
  -webkit-appearance: none;
  appearance: none;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.slider-input::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  border: none;
}

.slider-input::-webkit-slider-runnable-track {
  background: transparent;
  height: 8px;
  border: none;
}

.slider-input::-moz-range-track {
  background: transparent;
  border: none;
}
</style>
