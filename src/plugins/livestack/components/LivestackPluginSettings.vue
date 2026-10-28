<template>
  <div v-if="!store.settingsUnsupported" class="flex flex-col gap-2 w-full">
    <p v-if="!settings && store.settingsLoadError" class="text-xs text-red-400 pl-2">
      {{ t('plugins.livestack.settings.load_failed') }}
    </p>
    <p v-else-if="!settings" class="text-xs text-gray-400 pl-2">
      {{ t('plugins.livestack.settings.loading') }}
    </p>

    <template v-else>
      <p v-if="settings.LivestackLoaded === false" class="text-xs text-amber-400 pl-2">
        {{ t('plugins.livestack.settings.errors.livestack_unavailable') }}
      </p>
      <!-- A failed reload keeps the values on screen -->
      <p v-if="store.settingsLoadError" class="text-xs text-red-400 pl-2">
        {{ t('plugins.livestack.settings.load_failed') }}
      </p>
      <p v-if="errorText('_')" class="text-xs text-red-400 pl-2 break-words">
        {{ errorText('_') }}
      </p>

      <!-- Storage -->
      <section
        class="flex flex-col gap-2 w-full border border-gray-500 p-2 rounded-lg bg-gray-800/70"
      >
        <h3 class="text-xs md:text-sm font-semibold text-gray-200 pl-2">
          {{ t('plugins.livestack.settings.storage.title') }}
        </h3>
        <span class="text-xs text-gray-300 pl-2">
          {{ t('plugins.livestack.settings.storage.working_directory') }}
          <span v-if="settings.WorkingDirectoryIsDefault" class="text-gray-500">
            ({{ t('plugins.livestack.settings.storage.default') }})
          </span>
        </span>
        <div class="flex items-center gap-2 min-w-0">
          <div
            class="flex-1 overflow-x-auto scrollbar-thin px-3 py-2 rounded-lg border border-gray-600/50 bg-gray-800/40 min-w-0"
            :class="{ 'glow-green': savedKey === 'WorkingDirectory' }"
          >
            <span class="text-sm font-mono whitespace-nowrap text-gray-200">
              {{ settings.WorkingDirectory }}
            </span>
          </div>
          <button
            class="tns-btn-secondary w-auto! min-h-touch px-4! shrink-0"
            :disabled="isLocked('WorkingDirectory') || store.settingsBusy"
            :title="t('plugins.livestack.settings.storage.select')"
            :aria-label="t('plugins.livestack.settings.storage.select')"
            @click="showBrowser = true"
          >
            ...
          </button>
        </div>
        <p class="text-xs text-gray-400 pl-2">
          {{ t('plugins.livestack.settings.storage.help') }}
        </p>
        <p v-if="directoryStatus.FreeBytes != null" class="text-xs text-gray-400 pl-2">
          {{
            t('plugins.livestack.settings.storage.free', {
              size: formatSize(directoryStatus.FreeBytes),
            })
          }}
        </p>
        <p v-if="directoryStatus.IsRamDisk" class="text-xs text-amber-400 pl-2">
          {{ t('plugins.livestack.settings.storage.ram_disk') }}
        </p>
        <p v-else-if="isLowOnSpace" class="text-xs text-amber-400 pl-2">
          {{
            t('plugins.livestack.settings.storage.low_space', {
              size: formatSize(limits.LowFreeBytes),
            })
          }}
        </p>
        <p v-if="directoryStatus.Problem" class="text-xs text-red-400 pl-2 break-words">
          {{ codeText(directoryStatus.Problem, 'WorkingDirectory') }}
        </p>
        <p v-if="errorText('WorkingDirectory')" class="text-xs text-red-400 pl-2 break-words">
          {{ errorText('WorkingDirectory') }}
        </p>
        <p v-if="isLocked('WorkingDirectory')" class="text-xs text-gray-400 pl-2">
          {{ t('plugins.livestack.settings.locked_hint') }}
        </p>
      </section>

      <!-- Toggle groups: calibration (followed by the master library), saved files -->
      <template v-for="group in toggleGroups" :key="group.title">
        <section
          class="flex flex-col gap-2 w-full border border-gray-500 p-2 rounded-lg bg-gray-800/70"
        >
          <h3 class="text-xs md:text-sm font-semibold text-gray-200 pl-2">
            {{ t(group.title) }}
          </h3>
          <div v-for="item in group.items" :key="item.key" class="flex flex-col gap-1">
            <div class="flex flex-row items-center gap-4 min-h-touch">
              <!-- The label toggles too: the switch alone is a small target, e.g. with gloves -->
              <label
                class="flex-1 text-xs md:text-sm text-gray-200 pl-2 cursor-pointer select-none"
                :class="{ 'glow-green': savedKey === item.key }"
                @click="toggle(item.key)"
              >
                {{ t(item.label) }}
              </label>
              <toggleButton
                :id="`livestack_${item.key}`"
                :status-value="settings[item.key]"
                :disabled="isLocked(item.key) || store.settingsBusy"
                class="ml-auto px-3 justify-center"
                @update:status-value="(value) => save({ [item.key]: value })"
              />
            </div>
            <p v-if="item.note" class="text-xs text-gray-400 pl-2">{{ t(item.note) }}</p>
            <p v-if="item.timing" class="text-xs text-gray-400 pl-2">{{ t(item.timing) }}</p>
            <p v-if="errorText(item.key)" class="text-xs text-red-400 pl-2 break-words">
              {{ errorText(item.key) }}
            </p>
            <p v-if="isLocked(item.key)" class="text-xs text-gray-400 pl-2">
              {{ t('plugins.livestack.settings.locked_hint') }}
            </p>
          </div>
        </section>
        <LivestackCalibrationLibrary v-if="group.withMasters" />
      </template>

      <!-- Defaults for new stack tabs -->
      <section
        class="flex flex-col gap-2 w-full border border-gray-500 p-2 rounded-lg bg-gray-800/70"
      >
        <h3 class="text-xs md:text-sm font-semibold text-gray-200 pl-2">
          {{ t('plugins.livestack.settings.defaults.title') }}
        </h3>
        <p class="text-xs text-gray-400 pl-2">
          {{ t('plugins.livestack.settings.defaults.note') }}
        </p>
        <div v-for="row in defaultRows" :key="row.key" class="flex flex-col gap-1">
          <div v-if="row.kind === 'toggle'" class="flex flex-row items-center gap-4 min-h-touch">
            <label
              class="flex-1 text-xs md:text-sm text-gray-200 pl-2 cursor-pointer select-none"
              :class="{ 'glow-green': savedKey === row.key }"
              @click="toggle(row.key)"
            >
              {{ t(row.label) }}
            </label>
            <toggleButton
              :id="`livestack_${row.key}`"
              :status-value="settings[row.key]"
              :disabled="store.settingsBusy"
              class="ml-auto px-3 justify-center"
              @update:status-value="(value) => save({ [row.key]: value })"
            />
          </div>
          <NumberInputPicker
            v-else
            v-model="numbers[row.key]"
            :input-id="`livestack_${row.key}`"
            :label="t(row.label)"
            :label-key="row.label"
            :min="limits[row.key].Min"
            :max="limits[row.key].Max"
            :step="limits[row.key].Step"
            :decimal-places="row.decimals"
            :use-default-sentinel="false"
            wrapper-class="pl-2"
            @change="(value) => scheduleNumberSave(row.key, value)"
            @blur="flushNumberSave(row.key)"
          />
          <p v-if="row.note" class="text-xs text-gray-400 pl-2">{{ t(row.note) }}</p>
          <p v-if="errorText(row.key)" class="text-xs text-red-400 pl-2 break-words">
            {{ errorText(row.key) }}
          </p>
        </div>
      </section>
    </template>

    <FileBrowser
      v-model="showBrowser"
      mode="directory"
      :title="t('plugins.livestack.settings.storage.browser_title')"
      :initial-path="settings?.WorkingDirectory"
      @select="onDirectorySelected"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import toggleButton from '@/components/helpers/toggleButton.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import FileBrowser from '@/components/helpers/fileBrowser.vue';
import { useLivestackStore } from '../store/livestackStore.js';
import LivestackCalibrationLibrary from './LivestackCalibrationLibrary.vue';

// Field names are the Livestack plugin's own setting names, as served by the TNS plugin's
// /api/livestack/settings; ranges and locks come from that response, not from this file.
const NUMBER_SAVE_DELAY_MS = 600;

const store = useLivestackStore();
const { t, te, locale } = useI18n();

const showBrowser = ref(false);
const savedKey = ref(null);
const localErrors = reactive({});
const numbers = reactive({});
const pendingNumbers = new Map();
let savedKeyTimer = null;

const settings = computed(() => store.settings);
const limits = computed(() => store.settings?.Limits ?? {});
const directoryStatus = computed(() => store.settings?.WorkingDirectoryStatus ?? {});

const isLowOnSpace = computed(
  () =>
    !directoryStatus.value.Problem &&
    directoryStatus.value.FreeBytes != null &&
    limits.value.LowFreeBytes != null &&
    directoryStatus.value.FreeBytes < limits.value.LowFreeBytes
);

const toggleGroups = [
  {
    title: 'plugins.livestack.settings.calibration.title',
    withMasters: true,
    items: [
      { key: 'UseBiasForLights', label: 'plugins.livestack.settings.calibration.use_bias' },
      { key: 'HotpixelRemoval', label: 'plugins.livestack.settings.calibration.hotpixel' },
    ],
  },
  {
    title: 'plugins.livestack.settings.output.title',
    items: [
      {
        key: 'SaveCalibratedFlats',
        label: 'plugins.livestack.settings.output.save_calibrated_flats',
        note: 'plugins.livestack.settings.output.save_calibrated_flats_note',
      },
      {
        key: 'SaveCalibratedLights',
        label: 'plugins.livestack.settings.output.save_calibrated_lights',
        note: 'plugins.livestack.settings.output.save_calibrated_lights_note',
        // Can change while stacking runs and takes effect with the next frame
        timing: 'plugins.livestack.settings.next_frame_hint',
      },
      {
        key: 'SaveStackedLights',
        label: 'plugins.livestack.settings.output.save_stacked_lights',
        note: 'plugins.livestack.settings.output.save_stacked_lights_note',
        timing: 'plugins.livestack.settings.next_frame_hint',
      },
    ],
  },
];

// The amounts only matter while their effect is on, so they are shown only then
const defaultRows = computed(() => {
  const rows = [
    {
      kind: 'number',
      key: 'DefaultStretchAmount',
      label: 'plugins.livestack.settings.defaults.stretch',
      decimals: 2,
    },
    {
      kind: 'number',
      key: 'DefaultBlackClipping',
      label: 'plugins.livestack.settings.defaults.black_clipping',
      decimals: 2,
    },
    {
      kind: 'toggle',
      key: 'DefaultEnableBackgroundExtraction',
      label: 'plugins.livestack.settings.defaults.background_extraction',
      note: 'plugins.livestack.settings.defaults.background_extraction_note',
    },
  ];

  if (settings.value?.DefaultEnableBackgroundExtraction) {
    rows.push({
      kind: 'number',
      key: 'DefaultBackgroundExtractionAmount',
      label: 'plugins.livestack.settings.defaults.background_extraction_amount',
      decimals: 2,
    });
  }

  rows.push({
    kind: 'toggle',
    key: 'DefaultEnableGreenDeNoise',
    label: 'plugins.livestack.settings.defaults.green_denoise',
  });

  if (settings.value?.DefaultEnableGreenDeNoise) {
    rows.push({
      kind: 'number',
      key: 'DefaultGreenDeNoiseAmount',
      label: 'plugins.livestack.settings.defaults.green_denoise_amount',
      decimals: 2,
    });
  }

  rows.push({
    kind: 'number',
    key: 'DefaultDownsample',
    label: 'plugins.livestack.settings.defaults.downsample',
    note: 'plugins.livestack.settings.defaults.downsample_note',
    decimals: 0,
  });

  return rows;
});

const isStacking = computed(
  () => store.status === 'running' || store.settings?.IsStacking === true
);

function isLocked(key) {
  return isStacking.value && (store.settings?.LockedWhileStacking ?? []).includes(key);
}

// Keys without a value of their own in the profile are stored even when unchanged: the user's
// explicit choice then stays one (the working directory isn't seeded over it, a stretch default
// stops following the image settings)
function isStored(key) {
  return (store.settings?.StoredKeys ?? []).includes(key);
}

function toggle(key) {
  if (isLocked(key) || store.settingsBusy) {
    return;
  }
  save({ [key]: !store.settings[key] });
}

// vue-i18n's codes of the app are not all BCP 47 tags
const INTL_LOCALES = { cz: 'cs', cn: 'zh-CN' };

function formatSize(bytes) {
  const gib = 1024 ** 3;
  const inGib = bytes >= gib;
  const number = new Intl.NumberFormat(INTL_LOCALES[locale.value] ?? locale.value, {
    maximumFractionDigits: inGib ? 1 : 0,
  }).format(inGib ? bytes / gib : bytes / 1024 ** 2);
  // 1024-based like the app's other size displays
  return `${number} ${inGib ? 'GB' : 'MB'}`;
}

// Text for an API error code; the backend's English message when the code is unknown here
function codeText(code, field, fallback) {
  const key = `plugins.livestack.settings.errors.${String(code).replaceAll('-', '_')}`;
  if (!te(key)) {
    return fallback || code;
  }

  const limit = limits.value[field] ?? {};
  return t(key, {
    min: limit.Min,
    max: limit.Max,
    size: formatSize(limits.value.MinFreeBytes ?? 0),
  });
}

function errorText(field) {
  if (localErrors[field]) {
    return localErrors[field];
  }

  const error = store.settingsErrors[field];
  return error ? codeText(error.code, field, error.message) : '';
}

function syncNumbers() {
  if (!store.settings) {
    return;
  }

  for (const key of Object.keys(limits.value)) {
    if (typeof store.settings[key] === 'number' && !pendingNumbers.has(key)) {
      numbers[key] = store.settings[key];
    }
  }
}

async function save(patch) {
  for (const key of Object.keys(patch)) {
    delete localErrors[key];
  }

  const stored = await store.saveSettings(patch);
  if (stored) {
    savedKey.value = Object.keys(patch)[0];
    clearTimeout(savedKeyTimer);
    savedKeyTimer = setTimeout(() => (savedKey.value = null), 2000);
  } else {
    syncNumbers();
  }
  return stored;
}

// Immediate feedback with the backend's ranges; the backend checks again
function validateNumber(key, value) {
  const limit = limits.value[key];
  if (!limit || !Number.isFinite(value) || value < limit.Min || value > limit.Max) {
    return codeText('out-of-range', key);
  }
  if (key === 'DefaultDownsample' && !Number.isInteger(value)) {
    return codeText('not-an-integer', key);
  }
  return '';
}

function scheduleNumberSave(key, value) {
  clearTimeout(pendingNumbers.get(key)?.timer);
  const timer = setTimeout(() => flushNumberSave(key), NUMBER_SAVE_DELAY_MS);
  pendingNumbers.set(key, { timer, value: Number(value) });
}

function flushNumberSave(key) {
  const pending = pendingNumbers.get(key);
  if (!pending) {
    return;
  }

  clearTimeout(pending.timer);
  pendingNumbers.delete(key);

  const error = validateNumber(key, pending.value);
  if (error) {
    localErrors[key] = error;
    syncNumbers();
    return;
  }

  if (pending.value !== store.settings?.[key] || !isStored(key)) {
    save({ [key]: pending.value });
  }
}

async function onDirectorySelected(path) {
  if (path && (path !== store.settings?.WorkingDirectory || !isStored('WorkingDirectory'))) {
    await save({ WorkingDirectory: path });
  }
}

watch(() => store.settings, syncNumbers, { immediate: true });

// The locks follow the running state; reload so IsStacking and the folder status are current
watch(
  () => store.status,
  () => store.loadSettings()
);

onMounted(async () => {
  store.settingsErrors = {};
  await store.loadSettings({ initial: true });
  syncNumbers();
});

onBeforeUnmount(() => {
  // Closing the dialog right after a change still stores it
  for (const key of [...pendingNumbers.keys()]) {
    flushNumberSave(key);
  }
  clearTimeout(savedKeyTimer);
});
</script>
