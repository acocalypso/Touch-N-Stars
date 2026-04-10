<template>
  <div class="rounded-xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-slate-100">
        {{
          localTarget.id
            ? t('plugins.targetScheduler.editor.editTarget')
            : t('plugins.targetScheduler.editor.newTarget')
        }}
      </h3>
      <button class="text-slate-400 hover:text-slate-200" @click="$emit('cancel')">
        {{ t('plugins.targetScheduler.common.close') }}
      </button>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label class="text-xs text-slate-400">
        {{ t('plugins.targetScheduler.editor.name') }}
        <input
          v-model.trim="localTarget.name"
          class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-slate-100"
          :placeholder="t('plugins.targetScheduler.editor.namePlaceholder')"
        />
      </label>

      <div>
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>{{ t('plugins.targetScheduler.editor.priority') }}</span>
          <span>{{ localTarget.priority }}</span>
        </div>
        <input
          v-model.number="localTarget.priority"
          type="range"
          min="1"
          max="100"
          step="1"
          class="w-full accent-cyan-500"
        />
      </div>

      <label class="text-xs text-slate-400">
        {{ t('plugins.targetScheduler.editor.raLabel') }}
        <input
          v-model.trim="raInput"
          class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-slate-100"
          :placeholder="t('plugins.targetScheduler.editor.raPlaceholder')"
        />
      </label>

      <label class="text-xs text-slate-400">
        {{ t('plugins.targetScheduler.editor.decLabel') }}
        <input
          v-model.trim="decInput"
          class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-slate-100"
          :placeholder="t('plugins.targetScheduler.editor.decPlaceholder')"
        />
      </label>

      <label class="text-xs text-slate-400">
        {{ t('plugins.targetScheduler.editor.rotation') }}
        <input
          v-model.number="localTarget.rotation"
          type="number"
          step="0.1"
          class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-slate-100"
        />
      </label>

      <label class="text-xs text-slate-400 flex items-center gap-2 mt-5">
        <input v-model="localTarget.isFavoriteLinked" type="checkbox" class="accent-pink-500" />
        {{ t('plugins.targetScheduler.editor.linkedToFavorite') }}
      </label>
    </div>

    <ConstraintEditor v-model="localTarget.constraints" />

    <div class="rounded-lg border border-slate-700 bg-slate-800/70 p-3 space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold text-slate-200">
          {{ t('plugins.targetScheduler.editor.exposurePlan') }}
        </h4>
        <button
          class="rounded border border-cyan-600/70 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-900/30"
          @click="addExposure"
        >
          {{ t('plugins.targetScheduler.editor.addExposure') }}
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
          @click="applyPreset('single')"
        >
          {{ t('plugins.targetScheduler.editor.presets.singleL') }}
        </button>
        <button
          class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
          @click="applyPreset('lrgb')"
        >
          {{ t('plugins.targetScheduler.editor.presets.lrgb') }}
        </button>
        <button
          class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
          @click="applyPreset('sho')"
        >
          {{ t('plugins.targetScheduler.editor.presets.sho') }}
        </button>
      </div>

      <div v-if="!localTarget.exposures.length" class="text-xs text-slate-500">
        {{ t('plugins.targetScheduler.editor.addAtLeastOneExposure') }}
      </div>

      <div
        v-for="(exp, idx) in localTarget.exposures"
        :key="exp.id"
        class="rounded border border-slate-700 bg-slate-900/60 p-3 space-y-2"
      >
        <div class="flex items-center justify-between">
          <h5 class="text-xs font-medium text-slate-300">
            {{ t('plugins.targetScheduler.editor.exposureRow', { index: idx + 1 }) }}
          </h5>
          <button
            class="rounded border border-red-700/70 px-1.5 py-0.5 text-[11px] text-red-300 hover:bg-red-900/30"
            @click="removeExposure(idx)"
          >
            {{ t('plugins.targetScheduler.common.remove') }}
          </button>
        </div>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label class="text-xs text-slate-400">
            {{ t('plugins.targetScheduler.editor.filter') }}
            <select
              v-if="showFilterDropdown"
              v-model="exp.filterName"
              class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-100"
            >
              <option
                v-if="exp.filterName && !filterNames.includes(exp.filterName)"
                :value="exp.filterName"
              >
                {{ exp.filterName }}
              </option>
              <option v-for="name in filterNames" :key="name" :value="name">
                {{ name }}
              </option>
            </select>
            <input
              v-else
              v-model.trim="exp.filterName"
              class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-100"
              list="filter-list"
              placeholder="L"
            />
          </label>

          <label class="text-xs text-slate-400">
            {{ t('plugins.targetScheduler.editor.imageType') }}
            <select
              v-model="exp.imageType"
              class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-100"
            >
              <option value="LIGHT">
                {{ t('plugins.targetScheduler.editor.imageTypes.light') }}
              </option>
              <option value="DARK">
                {{ t('plugins.targetScheduler.editor.imageTypes.dark') }}
              </option>
              <option value="FLAT">
                {{ t('plugins.targetScheduler.editor.imageTypes.flat') }}
              </option>
              <option value="BIAS">
                {{ t('plugins.targetScheduler.editor.imageTypes.bias') }}
              </option>
            </select>
          </label>
        </div>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{{ t('plugins.targetScheduler.editor.duration') }}</span>
              <span
                >{{ exp.durationSeconds }} {{ t('plugins.targetScheduler.common.seconds') }}</span
              >
            </div>
            <input
              v-model.number="exp.durationSeconds"
              type="range"
              min="30"
              max="1800"
              step="10"
              class="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{{ t('plugins.targetScheduler.editor.gain') }}</span>
              <span>{{ exp.gain }}</span>
            </div>
            <input
              v-model.number="exp.gain"
              type="range"
              min="0"
              max="400"
              step="1"
              class="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{{ t('plugins.targetScheduler.editor.count') }}</span>
              <span>{{ exp.count }}</span>
            </div>
            <input
              v-model.number="exp.count"
              type="range"
              min="1"
              max="300"
              step="1"
              class="w-full accent-cyan-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label class="text-xs text-slate-400">
            {{ t('plugins.targetScheduler.editor.offset') }}
            <input
              v-model.number="exp.offset"
              type="number"
              class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-100"
            />
          </label>

          <label class="text-xs text-slate-400">
            {{ t('plugins.targetScheduler.editor.binning') }}
            <select
              v-model.number="exp.binning"
              class="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-100"
            >
              <option :value="1">1x1</option>
              <option :value="2">2x2</option>
              <option :value="3">3x3</option>
              <option :value="4">4x4</option>
            </select>
          </label>
        </div>
      </div>
    </div>

    <datalist id="filter-list">
      <option v-for="name in filterNames" :key="name" :value="name" />
    </datalist>

    <p
      v-if="errorMessage"
      class="rounded border border-red-700/60 bg-red-900/20 px-2 py-1 text-xs text-red-300"
    >
      {{ errorMessage }}
    </p>

    <div class="flex items-center justify-end gap-2">
      <button
        class="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700"
        @click="$emit('cancel')"
      >
        {{ t('plugins.targetScheduler.common.cancel') }}
      </button>
      <button
        class="rounded border border-cyan-600 px-3 py-1.5 text-sm text-cyan-200 hover:bg-cyan-900/30"
        @click="save"
      >
        {{ t('plugins.targetScheduler.editor.saveTarget') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';
import ConstraintEditor from './ConstraintEditor.vue';
import {
  createDefaultTarget,
  createExposure,
  parseDecToDeg,
  parseRaToDeg,
} from '../services/TargetSchedulerService';

const props = defineProps({
  target: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['save', 'cancel']);
const { t } = useI18n();

const mainStore = apiStore();
const errorMessage = ref('');

const localTarget = reactive(createDefaultTarget());
const raInput = ref('');
const decInput = ref('');

const filterNames = computed(() =>
  (mainStore.filterInfo?.AvailableFilters || []).map((f) => f.Name)
);

const showFilterDropdown = computed(
  () => mainStore.filterInfo?.Connected && filterNames.value.length > 0
);

function loadTarget(target) {
  const merged = createDefaultTarget(target || {});
  Object.assign(localTarget, merged);
  localTarget.exposures = (
    Array.isArray(merged.exposures) ? merged.exposures : [createExposure()]
  ).map((exp) => createExposure(exp));

  raInput.value = formatRaForInput(localTarget.ra);
  decInput.value = formatDecForInput(localTarget.dec);
  errorMessage.value = '';
}

watch(
  () => props.target,
  (target) => {
    loadTarget(target);
  },
  { immediate: true, deep: true }
);

function addExposure() {
  localTarget.exposures.push(createExposure());
}

function removeExposure(index) {
  localTarget.exposures.splice(index, 1);
  if (!localTarget.exposures.length) {
    localTarget.exposures.push(createExposure());
  }
}

function applyPreset(preset) {
  if (preset === 'single') {
    localTarget.exposures = [createExposure({ filterName: 'L', durationSeconds: 180, count: 40 })];
    return;
  }

  if (preset === 'lrgb') {
    localTarget.exposures = [
      createExposure({ filterName: 'L', durationSeconds: 180, count: 60 }),
      createExposure({ filterName: 'R', durationSeconds: 180, count: 20 }),
      createExposure({ filterName: 'G', durationSeconds: 180, count: 20 }),
      createExposure({ filterName: 'B', durationSeconds: 180, count: 20 }),
    ];
    return;
  }

  if (preset === 'sho') {
    localTarget.exposures = [
      createExposure({ filterName: 'SII', durationSeconds: 300, count: 30 }),
      createExposure({ filterName: 'Ha', durationSeconds: 300, count: 30 }),
      createExposure({ filterName: 'OIII', durationSeconds: 300, count: 30 }),
    ];
  }
}

function save() {
  const parsedRa = parseRaToDeg(raInput.value);
  const parsedDec = parseDecToDeg(decInput.value);

  if (parsedRa == null) {
    errorMessage.value = t('plugins.targetScheduler.errors.invalidRaFormat');
    return;
  }

  if (parsedDec == null) {
    errorMessage.value = t('plugins.targetScheduler.errors.invalidDecFormat');
    return;
  }

  if (!localTarget.name?.trim()) {
    errorMessage.value = t('plugins.targetScheduler.errors.targetNameRequired');
    return;
  }

  errorMessage.value = '';

  emit('save', {
    ...localTarget,
    name: localTarget.name.trim(),
    ra: parsedRa,
    dec: parsedDec,
    priority: Number(localTarget.priority),
    rotation: Number(localTarget.rotation) || 0,
    exposures: localTarget.exposures.map((exp) => ({
      ...exp,
      durationSeconds: Number(exp.durationSeconds),
      gain: Number(exp.gain),
      offset: Number(exp.offset),
      count: Number(exp.count),
      binning: Number(exp.binning),
    })),
  });
}

function formatRaForInput(raDeg) {
  const raw = (Number(raDeg) / 15 + 24) % 24;
  const hh = Math.floor(raw);
  const mm = Math.floor((raw - hh) * 60);
  const ss = Math.floor(((raw - hh) * 60 - mm) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function formatDecForInput(decDeg) {
  const n = Number(decDeg) || 0;
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  const dd = Math.floor(abs);
  const mm = Math.floor((abs - dd) * 60);
  const ss = Math.floor(((abs - dd) * 60 - mm) * 60);
  return `${sign}${String(dd).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
</script>
