<template>
  <div class="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 flex flex-col gap-3">
    <h4 class="font-semibold text-cyan-300">{{ t('assistantTitle') }}</h4>
    <ol class="flex flex-col gap-2" :aria-label="t('assistantTitle')">
      <li
        v-for="(step, index) in steps"
        :key="step"
        class="flex items-center gap-2 text-sm"
        :class="index === overview.index ? 'text-cyan-200 font-semibold' : 'text-gray-400'"
        :aria-current="index === overview.index ? 'step' : undefined"
      >
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current"
        >
          {{ index + 1 }}
        </span>
        {{ t('step' + step) }}
      </li>
    </ol>
    <div aria-live="polite" class="flex flex-col gap-2 text-sm text-gray-200">
      <p class="font-semibold">{{ t('nextStep') }}</p>
      <p>
        {{
          t(
            overview.fitting
              ? 'fittingHelp'
              : overview.recording
                ? 'recordingNext'
                : 'next' + overview.step
          )
        }}
      </p>
      <template v-if="overview.recording">
        <progress class="w-full" :value="overview.progress" max="100" :aria-label="t('training')" />
        <p>{{ t('timeRemaining', { time: minutes(overview.remaining) }) }}</p>
        <p>{{ t('frameCount', { count: status.training.frames ?? 0 }) }}</p>
      </template>
      <p v-else-if="overview.fitting">{{ t('fittingTime') }}</p>
      <p v-else-if="overview.step === 'prepare' || overview.step === 'train'">
        {{ t('estimatedDuration', { time: minutes(overview.duration) }) }}
      </p>
      <p v-if="overview.running" class="text-xs text-gray-400">{{ t('backgroundJob') }}</p>
      <p v-if="status.training?.state === 'failed'" role="alert" class="text-red-300">
        {{ t('trainingFailed') }} {{ status.training.error }}
      </p>
      <p v-if="status.training?.state === 'cancelled'" class="text-yellow-200">
        {{ t('trainingCancelled') }}
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <template v-if="overview.step === 'prepare'">
        <button class="tns-btn-secondary px-3 py-2" @click="$emit('general')">
          {{ t('openGeneral') }}
        </button>
        <button class="tns-btn-primary px-3 py-2" @click="$emit('guiding')">
          {{ t('openGuiding') }}
        </button>
      </template>
      <template v-else-if="overview.step === 'train'">
        <button
          v-if="!overview.running"
          class="tns-btn-primary px-3 py-2"
          :disabled="busy || !canStart"
          @click="$emit('start')"
        >
          {{ t('start') }}
        </button>
        <button v-else class="tns-btn-danger px-3 py-2" :disabled="busy" @click="$emit('cancel')">
          {{ t('cancel') }}
        </button>
      </template>
      <button
        v-else-if="overview.step === 'review'"
        class="tns-btn-primary px-3 py-2"
        :disabled="busy || !overview.canTest"
        @click="$emit('shadow')"
      >
        {{ t('startShadow') }}
      </button>
      <button
        v-else-if="overview.step === 'shadow'"
        class="tns-btn-primary px-3 py-2"
        :disabled="busy || !overview.canTest"
        @click="$emit('active')"
      >
        {{ t('startActive') }}
      </button>
      <button
        v-if="status.mode !== 'disabled'"
        class="tns-btn-danger px-3 py-2"
        :disabled="busy"
        @click="$emit('disable')"
      >
        {{ t('disable') }}
      </button>
    </div>
    <p
      v-if="status.model_loaded && !overview.canTest && !overview.running"
      class="text-xs text-yellow-200"
    >
      {{ t('testRequirements') }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { AI_SETUP_STEPS, aiSetupOverview } from '@/utils/phd2AISetup';

const props = defineProps({
  status: { type: Object, required: true },
  guiding: Boolean,
  busy: Boolean,
  duration: { type: Number, default: 1800 },
  canStart: Boolean,
});
defineEmits(['general', 'guiding', 'start', 'cancel', 'shadow', 'active', 'disable']);
const { t: translate } = useI18n();
const t = (key, parameters = {}) => translate('components.guider.phd2.ai.' + key, parameters);
const steps = AI_SETUP_STEPS;
const overview = computed(() => aiSetupOverview(props.status, props.guiding, props.duration));
const minutes = (seconds) => t('minutes', { count: Math.ceil(seconds / 60) });
</script>
