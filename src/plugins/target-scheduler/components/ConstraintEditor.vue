<template>
  <div class="rounded-lg border border-slate-700 bg-slate-800/70 p-3 space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-semibold text-slate-200">
        {{ t('plugins.targetScheduler.constraints.title') }}
      </h4>
      <button
        type="button"
        class="text-xs text-cyan-400 hover:text-cyan-300"
        @click="advancedOpen = !advancedOpen"
      >
        {{
          advancedOpen
            ? t('plugins.targetScheduler.constraints.hideAdvanced')
            : t('plugins.targetScheduler.constraints.showAdvanced')
        }}
      </button>
    </div>

    <label class="flex items-center gap-2 text-xs text-slate-300">
      <input v-model="localValue.enabled" type="checkbox" class="accent-cyan-500" />
      {{ t('plugins.targetScheduler.constraints.targetEnabled') }}
    </label>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>{{ t('plugins.targetScheduler.constraints.minAltitude') }}</span>
          <span>{{ localValue.minAltitude }} {{ t('plugins.targetScheduler.common.deg') }}</span>
        </div>
        <input
          v-model.number="localValue.minAltitude"
          type="range"
          min="0"
          max="89"
          step="1"
          class="w-full accent-cyan-500"
        />
      </div>

      <div>
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>{{ t('plugins.targetScheduler.constraints.maxAltitude') }}</span>
          <span>{{ localValue.maxAltitude }} {{ t('plugins.targetScheduler.common.deg') }}</span>
        </div>
        <input
          v-model.number="localValue.maxAltitude"
          type="range"
          min="1"
          max="90"
          step="1"
          class="w-full accent-cyan-500"
        />
      </div>
    </div>

    <div v-if="advancedOpen" class="space-y-3 border-t border-slate-700 pt-3">
      <div>
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>{{ t('plugins.targetScheduler.constraints.minMoonSeparation') }}</span>
          <span>
            {{ localValue.minMoonSeparation }} {{ t('plugins.targetScheduler.common.deg') }}
          </span>
        </div>
        <input
          v-model.number="localValue.minMoonSeparation"
          type="range"
          min="0"
          max="180"
          step="1"
          class="w-full accent-amber-500"
        />
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="text-xs text-slate-400">
          {{ t('plugins.targetScheduler.constraints.timeWindowStart') }}
          <input
            v-model="localValue.timeWindowStart"
            type="time"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-700/70 px-2 py-1 text-slate-200"
          />
        </label>

        <label class="text-xs text-slate-400">
          {{ t('plugins.targetScheduler.constraints.timeWindowEnd') }}
          <input
            v-model="localValue.timeWindowEnd"
            type="time"
            class="mt-1 w-full rounded border border-slate-600 bg-slate-700/70 px-2 py-1 text-slate-200"
          />
        </label>
      </div>

      <p class="text-[11px] text-slate-500">
        {{ t('plugins.targetScheduler.constraints.timeWindowHint') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { DEFAULT_CONSTRAINTS } from '../services/TargetSchedulerService';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ ...DEFAULT_CONSTRAINTS }),
  },
});

const emit = defineEmits(['update:modelValue']);
const { t } = useI18n();

const advancedOpen = ref(false);

const localValue = reactive({
  ...DEFAULT_CONSTRAINTS,
  ...(props.modelValue || {}),
});

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(localValue, { ...DEFAULT_CONSTRAINTS, ...(value || {}) });
  },
  { deep: true }
);

watch(
  localValue,
  (value) => {
    if (value.minAltitude >= value.maxAltitude) {
      value.maxAltitude = Math.min(90, value.minAltitude + 1);
    }
    emit('update:modelValue', {
      ...value,
      minAltitude: Number(value.minAltitude),
      maxAltitude: Number(value.maxAltitude),
      minMoonSeparation: Number(value.minMoonSeparation),
      enabled: value.enabled !== false,
    });
  },
  { deep: true }
);
</script>
