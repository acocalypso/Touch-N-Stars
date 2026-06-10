<template>
  <div class="space-y-4">
    <!-- Lens Info Header -->
    <div class="flex flex-wrap gap-x-6 gap-y-1">
      <div class="flex items-center gap-2">
        <span class="text-gray-400 text-sm">{{ t('plugins.pinsDevices.lensControl.lens') }}</span>
        <span class="text-white font-semibold">{{ store.lensControlStatus.LensName || '—' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-400 text-sm">{{
          t('plugins.pinsDevices.lensControl.focalLength')
        }}</span>
        <span class="text-white font-mono">
          {{
            store.lensControlStatus.FocalLength > 0
              ? store.lensControlStatus.FocalLength + ' mm'
              : '—'
          }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-400 text-sm">{{
          t('plugins.pinsDevices.lensControl.position')
        }}</span>
        <span class="text-white font-mono">
          {{ store.lensControlStatus.Position }}
          <span class="text-gray-500">/ {{ store.lensControlStatus.MaxStep }}</span>
        </span>
      </div>
    </div>

    <!-- Aperture Control -->
    <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-gray-300">
          {{ t('plugins.pinsDevices.lensControl.aperture') }}
        </label>
        <span class="text-xs text-gray-500">
          {{ t('plugins.pinsDevices.lensControl.current') }}:
          <span class="text-gray-300 font-mono">{{ currentApertureLabel }}</span>
          &nbsp;·&nbsp;
          {{ t('plugins.pinsDevices.lensControl.range') }}:
          <span class="text-gray-300 font-mono">{{ wideLabel }}–{{ narrowLabel }}</span>
        </span>
      </div>
      <div class="flex items-center gap-3">
        <select
          v-model.number="targetAperture"
          class="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-400"
        >
          <option v-for="opt in apertureOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <button
          :disabled="isSettingAperture || apertureOptions.length === 0"
          class="px-4 py-1.5 rounded text-sm font-medium transition-colors"
          :class="
            isSettingAperture || apertureOptions.length === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          "
          @click="setAperture"
        >
          {{ t('plugins.pinsDevices.lensControl.set') }}
        </button>
      </div>
    </div>

    <!-- Calibrate -->
    <button
      :disabled="isCalibrating"
      class="w-full py-2 rounded-lg text-sm font-semibold transition-colors border"
      :class="
        isCalibrating
          ? 'border-gray-600 text-gray-500 cursor-not-allowed'
          : 'border-cyan-600 text-cyan-400 hover:bg-cyan-600/10'
      "
      @click="calibrate"
    >
      {{
        isCalibrating
          ? t('plugins.pinsDevices.lensControl.calibrating')
          : t('plugins.pinsDevices.lensControl.calibrate')
      }}
    </button>

    <!-- Device Info -->
    <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-gray-300 mb-3">
        {{ t('plugins.pinsDevices.lensControl.deviceInfo') }}
      </h3>
      <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span class="text-gray-400">{{ t('plugins.pinsDevices.lensControl.firmware') }}</span>
        <span class="text-white font-mono">{{ store.lensControlInfo.Firmware || '—' }}</span>
        <span class="text-gray-400">{{ t('plugins.pinsDevices.lensControl.driver') }}</span>
        <span class="text-white font-mono">{{ store.lensControlInfo.DriverVersion || '—' }}</span>
        <span class="text-gray-400">UUID</span>
        <span class="text-white font-mono text-xs break-all">{{
          store.lensControlInfo.UniqueId || '—'
        }}</span>
      </div>
    </div>

    <!-- Restart -->
    <div class="flex justify-end">
      <button
        :disabled="isRestarting"
        class="px-4 py-1.5 rounded text-sm font-medium border border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        @click="restart"
      >
        {{
          isRestarting
            ? t('plugins.pinsDevices.lensControl.restarting')
            : t('plugins.pinsDevices.lensControl.restart')
        }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePinsDeviceStore } from '../store/pinsDevicesStore.js';

const { t } = useI18n();
const store = usePinsDeviceStore();

const targetAperture = ref(store.lensControlStatus.Aperture);
const isSettingAperture = ref(false);
const isCalibrating = ref(false);
const isRestarting = ref(false);

// maxAperture = widest opening (numerically smallest), minAperture = narrowest (numerically largest)
const APERTURE_MAP = {
  8: 'f/1',
  11: 'f/1.1',
  13: 'f/1.3',
  16: 'f/1.4',
  22: 'f/1.8',
  24: 'f/2',
  27: 'f/2.2',
  29: 'f/2.5',
  32: 'f/2.8',
  35: 'f/3.2',
  37: 'f/3.6',
  40: 'f/4',
  43: 'f/4.5',
  45: 'f/5',
  48: 'f/5.6',
  51: 'f/6.3',
  53: 'f/7.1',
  56: 'f/8',
  59: 'f/9',
  61: 'f/10',
  64: 'f/11',
  67: 'f/12',
  69: 'f/14',
  72: 'f/16',
  75: 'f/18',
  77: 'f/20',
  80: 'f/22',
  88: 'f/32',
  96: 'f/45',
  104: 'f/64',
};

const apertureOptions = computed(() => {
  const wide = store.lensControlStatus.MaxAperture; // widest = smallest int
  const narrow = store.lensControlStatus.MinAperture; // narrowest = largest int
  if (wide === 0 && narrow === 0) return [];
  return Object.entries(APERTURE_MAP)
    .map(([val, label]) => ({ value: Number(val), label }))
    .filter(({ value }) => value >= wide && value <= narrow);
});

const currentApertureLabel = computed(
  () => APERTURE_MAP[store.lensControlStatus.Aperture] ?? store.lensControlStatus.Aperture
);
const wideLabel = computed(
  () => APERTURE_MAP[store.lensControlStatus.MaxAperture] ?? store.lensControlStatus.MaxAperture
);
const narrowLabel = computed(
  () => APERTURE_MAP[store.lensControlStatus.MinAperture] ?? store.lensControlStatus.MinAperture
);

async function setAperture() {
  isSettingAperture.value = true;
  try {
    await store.setLensControlAperture(targetAperture.value);
  } finally {
    isSettingAperture.value = false;
  }
}

async function calibrate() {
  isCalibrating.value = true;
  try {
    await store.calibrateLensControl();
  } finally {
    isCalibrating.value = false;
  }
}

async function restart() {
  isRestarting.value = true;
  try {
    await store.restartLensControl();
  } finally {
    isRestarting.value = false;
  }
}
</script>
