<template>
  <section
    class="p-2 sm:p-4 flex flex-col gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
  >
    <div class="flex items-center justify-between gap-2">
      <h3 class="font-bold text-base text-cyan-400">{{ t('title') }}</h3>
      <button
        class="tns-btn-secondary px-3 py-1 text-sm"
        :disabled="ai.busy || ai.refreshing"
        @click="ai.refresh()"
      >
        {{ t('refresh') }}
      </button>
    </div>
    <p class="text-sm text-gray-300">{{ t('description') }}</p>
    <p v-if="ai.available === false" class="text-sm text-yellow-200">{{ t('unsupported') }}</p>
    <p v-if="ai.pollError && ai.available !== false" role="alert" class="text-sm text-red-300">
      {{ ai.pollError }}
    </p>
    <p v-if="ai.error" role="alert" class="text-sm text-red-300">{{ ai.error }}</p>
    <p v-if="!ai.status && ai.available !== false && !ai.pollError" class="text-sm text-gray-400">
      {{ t('loading') }}
    </p>

    <template v-if="ai.status">
      <div class="grid grid-cols-2 gap-2 text-sm">
        <span>{{ t('profile') }}: {{ ai.status.profile_id }}</span>
        <span>{{ t('confidence') }}: {{ (ai.status.ra_confidence * 100).toFixed(0) }}%</span>
        <span>{{ t('mode') }}: {{ t(ai.status.mode) }}</span>
        <span>{{ t('compatible') }}: {{ t(ai.status.fingerprint_ok ? 'yes' : 'no') }}</span>
      </div>
      <p
        v-for="warning in ai.status.fingerprint_warnings"
        :key="warning"
        class="text-sm text-yellow-200"
      >
        {{ warning }}
      </p>
      <p v-if="ai.status.last_error" role="alert" class="text-sm text-red-300">
        {{ ai.status.last_error }}
      </p>

      <label for="ai-model" class="text-sm text-gray-300">{{ t('model') }}</label>
      <div class="flex flex-wrap gap-2">
        <select
          id="ai-model"
          v-model="selected"
          class="tns-select flex-1 min-w-0"
          :disabled="locked"
        >
          <option value="">{{ t('chooseModel') }}</option>
          <option v-for="model in ai.models" :key="model.path" :value="model.path">
            {{ model.name }} ({{ model.period_sec.toFixed(1) }} s)
          </option>
        </select>
        <button
          class="tns-btn-primary px-3 py-2"
          :disabled="locked || !selected"
          @click="ai.run('select', selected)"
        >
          {{ t('select') }}
        </button>
        <button
          class="tns-btn-secondary px-3 py-2"
          :disabled="locked || !ai.status.model_loaded"
          @click="ai.run('unload')"
        >
          {{ t('unload') }}
        </button>
      </div>
      <p class="text-xs text-gray-400 break-all">{{ ai.status.model_path || t('noModel') }}</p>

      <div class="flex flex-wrap items-end gap-2">
        <label class="flex flex-col gap-1 text-sm">
          {{ t('mode') }}
          <select v-model="mode" class="tns-select" :disabled="locked">
            <option value="disabled">{{ t('disabled') }}</option>
            <option value="shadow">{{ t('shadow') }}</option>
            <option value="active">{{ t('active') }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-1 text-sm">
          {{ t('gain') }}
          <input
            v-model.number="gain"
            type="number"
            min="0"
            max="1"
            step="0.05"
            class="tns-input w-24"
            :disabled="locked"
          />
        </label>
        <button
          class="tns-btn-primary px-3 py-2"
          :disabled="locked || !validGain || (mode !== 'disabled' && !ai.status.model_loaded)"
          @click="apply"
        >
          {{ t('apply') }}
        </button>
        <button
          class="tns-btn-danger px-3 py-2"
          :disabled="ai.busy"
          @click="ai.run('mode', 'disabled')"
        >
          {{ t('disable') }}
        </button>
      </div>
      <p class="text-xs text-gray-400">{{ t('modeHelp') }}</p>

      <h4 class="font-semibold text-gray-200">{{ t('training') }}</h4>
      <div class="flex flex-wrap items-end gap-2">
        <label class="flex flex-col gap-1 text-sm">
          {{ t('duration') }}
          <input
            v-model.number="duration"
            type="number"
            min="60"
            max="14400"
            step="60"
            class="tns-input w-28"
            :disabled="locked"
          />
        </label>
        <label class="flex flex-col gap-1 text-sm">
          {{ t('period') }}
          <input
            v-model.number="period"
            type="number"
            min="0"
            max="3600"
            class="tns-input w-28"
            :disabled="locked"
          />
        </label>
        <button
          class="tns-btn-primary px-3 py-2"
          :disabled="locked || !validTraining || !guiding"
          @click="ai.run('start', duration, period)"
        >
          {{ t('start') }}
        </button>
        <button
          class="tns-btn-danger px-3 py-2"
          :disabled="ai.busy || !ai.training.running"
          @click="ai.run('cancel')"
        >
          {{ t('cancel') }}
        </button>
      </div>
      <p class="text-xs text-gray-400">{{ t('trainingHelp') }}</p>
      <p v-if="!guiding" class="text-xs text-yellow-200">{{ t('guidingRequired') }}</p>
      <div aria-live="polite" class="text-sm text-gray-300">
        <p>
          {{ t('state') }}: {{ t(ai.training.state) }} · {{ ai.training.frames ?? 0 }}
          {{ t('frames') }}
        </p>
        <progress
          v-if="ai.training.state === 'recording'"
          class="w-full"
          :value="ai.training.elapsed_sec"
          :max="ai.training.duration_sec"
        />
        <p v-if="ai.training.state === 'recording'">
          {{ Math.floor(ai.training.elapsed_sec) }} / {{ ai.training.duration_sec }} s
        </p>
        <p v-if="ai.training.state === 'complete'">
          {{ t('period') }}: {{ ai.training.period_sec.toFixed(2) }} s · {{ t('fit') }}:
          {{ ai.training.residual_rms_px.toFixed(4) }} px · {{ t('holdout') }}:
          {{ ai.training.holdout_rms_px.toFixed(4) }} px
        </p>
        <p v-if="ai.training.error" role="alert" class="text-red-300">{{ ai.training.error }}</p>
      </div>

      <details class="text-sm">
        <summary class="cursor-pointer text-cyan-300">{{ t('files') }}</summary>
        <div class="flex flex-col gap-2 mt-2">
          <p class="text-xs text-gray-400">{{ t('filesHelp') }}</p>
          <label class="flex flex-col gap-1"
            >{{ t('path') }}
            <input v-model.trim="path" class="tns-input w-full" :disabled="locked" />
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              class="tns-btn-secondary px-3 py-2"
              :disabled="locked || !path"
              @click="ai.run('import', path)"
            >
              {{ t('import') }}
            </button>
            <button
              class="tns-btn-secondary px-3 py-2"
              :disabled="locked || !path || !ai.status.model_loaded"
              @click="ai.run('export', path)"
            >
              {{ t('export') }}
            </button>
            <button
              class="tns-btn-secondary px-3 py-2"
              :disabled="locked || !path || !validPeriod"
              @click="ai.run('fit', path, period)"
            >
              {{ t('trainFile') }}
            </button>
          </div>
          <dl class="text-xs text-gray-400 break-all">
            <dt>{{ t('directory') }}</dt>
            <dd>{{ ai.status.model_directory }}</dd>
            <dt>{{ t('recording') }}</dt>
            <dd>
              {{ ai.training.recording_path || ai.status.characterization?.output_path || '—' }}
            </dd>
          </dl>
          <button
            class="tns-btn-secondary px-3 py-2 self-start"
            :disabled="locked || !guiding || !validTraining || !path"
            @click="ai.run('record', duration, path)"
          >
            {{ t('startRecording') }}
          </button>
          <p class="text-xs text-yellow-200">{{ t('recordingHelp') }}</p>
          <button
            class="tns-btn-secondary px-3 py-2 self-start"
            :disabled="ai.busy"
            @click="ai.run('stopRecording')"
          >
            {{ t('stopRecording') }}
          </button>
        </div>
      </details>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePhd2AIStore, aiConnectionKey } from '@/store/phd2AIStore';
import { useGuiderStore } from '@/store/guiderStore';
import { createPoller } from '@/utils/poller';

const { t: translate } = useI18n();
const t = (key) => translate('components.guider.phd2.ai.' + key);
const ai = usePhd2AIStore();
const guider = useGuiderStore();
const selected = ref('');
const mode = ref('disabled');
const gain = ref(0.1);
const duration = ref(1800);
const period = ref(0);
const path = ref('');
const locked = computed(
  () => ai.busy || ai.training.running || ai.status?.characterization?.active
);
const guiding = computed(() => guider.phd2Status?.AppState === 'Guiding');
const validGain = computed(() => Number.isFinite(gain.value) && gain.value >= 0 && gain.value <= 1);
const validPeriod = computed(
  () =>
    Number.isFinite(period.value) &&
    (period.value === 0 || (period.value >= 30 && period.value <= 3600))
);
const validTraining = computed(
  () =>
    Number.isFinite(duration.value) &&
    duration.value >= 60 &&
    duration.value <= 14400 &&
    validPeriod.value &&
    (period.value === 0 || duration.value >= 2 * period.value)
);

watch([() => ai.status?.profile_id, () => ai.status?.model_path], () => {
  selected.value = ai.status?.model_path || '';
  path.value = '';
});
watch(
  () => ai.status?.mode,
  (value) => {
    mode.value = value || 'disabled';
  }
);
watch(
  () => ai.status?.prediction_gain,
  (value) => {
    if (value != null) gain.value = value;
  }
);
watch(aiConnectionKey, () => {
  ai.reset();
  ai.refresh();
});
const poller = createPoller(() => ai.refresh(), 2000, { immediate: true });
onMounted(() => {
  ai.reset();
  poller.start();
});
onUnmounted(() => poller.stop());

async function apply() {
  const requestedMode = mode.value;
  if (await ai.run('gain', gain.value)) await ai.run('mode', requestedMode);
}
</script>
