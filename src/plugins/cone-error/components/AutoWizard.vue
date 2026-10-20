<template>
  <ConeRun v-if="store.active" />

  <template v-else-if="showResult">
    <ConeResult :result="status.result" :previous="status.previous" />
    <button class="tns-btn-secondary" @click="newMeasurement">
      {{ $t('plugins.coneError.auto.newMeasurement') }}
    </button>
  </template>

  <template v-else>
    <section
      v-if="outcome"
      class="rounded-control border p-3 text-sm space-y-1"
      :class="
        outcome.phase === 'Aborted'
          ? 'border-status-warn/50 bg-status-warn/10 text-status-warn'
          : 'border-status-danger/50 bg-status-danger/10 text-status-danger'
      "
    >
      <p class="font-semibold">{{ $t(`plugins.coneError.progress.phase.${outcome.phase}`) }}</p>
      <p>{{ outcome.message }}</p>
      <PairTable v-if="outcome.pairs?.length" :pairs="outcome.pairs" />
    </section>

    <ConeChecks />

    <!-- Inputs -->
    <section v-if="!plan" class="tns-card space-y-3">
      <h2 class="font-semibold text-content">{{ $t('plugins.coneError.auto.setupTitle') }}</h2>
      <p class="text-sm text-content-muted">{{ $t('plugins.coneError.auto.intro') }}</p>
      <NumberInputPicker
        v-model="dovetailMm"
        inputId="cone-dovetail"
        :label="$t('plugins.coneError.auto.dovetail')"
        labelKey="plugins.coneError.auto.dovetail"
        :helpMessage="$t('plugins.coneError.auto.dovetailHelp')"
        :min="20"
        :max="1500"
        :step="1"
        :decimalPlaces="0"
        :useDefaultSentinel="false"
        labelPosition="top"
        wrapperClass="w-full"
      />
      <NumberInputPicker
        v-model="repetitions"
        inputId="cone-repetitions"
        :label="$t('plugins.coneError.auto.repetitions')"
        labelKey="plugins.coneError.auto.repetitions"
        :min="2"
        :max="10"
        :step="1"
        :decimalPlaces="0"
        :useDefaultSentinel="false"
        labelPosition="top"
        wrapperClass="w-full"
      />
      <NumberInputPicker
        v-model="exposure"
        inputId="cone-exposure"
        :label="$t('plugins.coneError.auto.exposure')"
        labelKey="plugins.coneError.auto.exposure"
        :min="0.5"
        :max="60"
        :step="0.5"
        :decimalPlaces="1"
        :useDefaultSentinel="false"
        labelPosition="top"
        wrapperClass="w-full"
      />
      <label class="flex items-center gap-3 min-h-touch text-sm text-content">
        <input v-model="moreOptions" type="checkbox" class="w-5 h-5" />
        {{ $t('plugins.coneError.auto.moreOptions') }}
      </label>
      <template v-if="moreOptions">
        <label class="flex items-center gap-3 min-h-touch text-sm text-content">
          <input v-model="customDeclination" type="checkbox" class="w-5 h-5" />
          {{ $t('plugins.coneError.auto.customDeclination') }}
        </label>
        <NumberInputPicker
          v-if="customDeclination"
          v-model="declination"
          inputId="cone-declination"
          :label="$t('plugins.coneError.auto.declination')"
          labelKey="plugins.coneError.auto.declination"
          :helpMessage="$t('plugins.coneError.auto.declinationHelp')"
          :min="-30"
          :max="30"
          :step="1"
          :decimalPlaces="0"
          :useDefaultSentinel="false"
          labelPosition="top"
          wrapperClass="w-full"
        />
        <NumberInputPicker
          v-model="minAltitude"
          inputId="cone-min-altitude"
          :label="$t('plugins.coneError.auto.minAltitude')"
          labelKey="plugins.coneError.auto.minAltitude"
          :min="0"
          :max="80"
          :step="1"
          :decimalPlaces="0"
          :useDefaultSentinel="false"
          labelPosition="top"
          wrapperClass="w-full"
        />
      </template>
      <button class="tns-btn-primary" :disabled="!canPlan || store.pending" @click="makePlan">
        {{
          store.pending ? $t('plugins.coneError.auto.planning') : $t('plugins.coneError.auto.plan')
        }}
      </button>
    </section>

    <!-- The plan, confirmed before the mount moves -->
    <section v-else class="tns-card space-y-3">
      <h2 class="font-semibold text-content">{{ $t('plugins.coneError.auto.planTitle') }}</h2>
      <p
        v-if="!plan.plan.ok"
        class="rounded-control border border-status-danger/50 bg-status-danger/10 p-3 text-sm text-status-danger"
      >
        {{ plan.plan.problems.join(' ') }}
      </p>
      <template v-else>
        <p class="text-sm text-content">
          {{
            $t('plugins.coneError.auto.planSummary', {
              dec: plan.plan.declinationDegrees.toFixed(0),
              altitude: plan.plan.pairs[0].altitude.toFixed(0),
              pairs: plan.repetitions,
              minutes: Math.ceil(plan.plan.estimatedSeconds / 60),
            })
          }}
        </p>
        <p class="text-sm text-content-muted">
          {{
            $t('plugins.coneError.auto.flipNote', {
              minutes: plan.plan.flipAfterMinutes.toFixed(0),
            })
          }}
        </p>
        <p v-if="plan.askPierLabels" class="text-sm text-content-muted">
          {{ $t('plugins.coneError.auto.pierLabelHint') }}
        </p>
        <label
          class="flex items-start gap-3 rounded-control border border-line p-3 text-sm text-content"
        >
          <input v-model="noPointingModel" type="checkbox" class="w-5 h-5 mt-0.5" />
          <span>{{ $t('plugins.coneError.auto.noPointingModel') }}</span>
        </label>
        <p class="text-xs text-content-faint">
          {{ $t('plugins.coneError.auto.expires', { seconds: secondsLeft }) }}
        </p>
      </template>
      <div class="grid grid-cols-2 gap-2">
        <button class="tns-btn-secondary" @click="store.autoPlan = null">
          {{ $t('common.cancel') }}
        </button>
        <button
          class="tns-btn-primary"
          :disabled="!plan.plan.ok || secondsLeft <= 0 || !noPointingModel || store.pending"
          @click="start"
        >
          {{ $t('plugins.coneError.auto.start') }}
        </button>
      </div>
    </section>
  </template>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import { useToastStore } from '@/store/toastStore';
import { useConeErrorStore } from '../store/coneErrorStore';
import ConeChecks from './ConeChecks.vue';
import ConeResult from './ConeResult.vue';
import ConeRun from './ConeRun.vue';
import PairTable from './PairTable.vue';

const { t } = useI18n();
const store = useConeErrorStore();
const toast = useToastStore();

const status = computed(() => store.status ?? {});
const plan = computed(() => store.autoPlan);

const dovetailMm = ref(200);
const repetitions = ref(3);
const exposure = ref(5);
const minAltitude = ref(20);
const moreOptions = ref(false);
const customDeclination = ref(false);
const declination = ref(0);
const noPointingModel = ref(false);
const dismissedResult = ref(null);

// Settings and the profile arrive after the component is set up; take them over until the user
// edits the exposure.
const exposureEdited = ref(false);
function defaultExposure() {
  return (
    store.settings?.exposureSeconds ?? store.preconditions?.profile?.plateSolveExposureSeconds ?? 5
  );
}
watch(exposure, (value, old) => {
  if (old !== undefined && value !== defaultExposure()) exposureEdited.value = true;
});
watch(
  () => [store.settings, store.preconditions?.profile?.plateSolveExposureSeconds],
  () => {
    const settings = store.settings;
    if (settings?.dovetailMm) dovetailMm.value = settings.dovetailMm;
    if (settings?.repetitions) repetitions.value = settings.repetitions;
    if (typeof settings?.minAltitudeDegrees === 'number') {
      minAltitude.value = settings.minAltitudeDegrees;
    }
    if (!exposureEdited.value) exposure.value = defaultExposure();
  },
  { immediate: true }
);

const canPlan = computed(() => store.preconditions?.ready === true && dovetailMm.value > 0);

const showResult = computed(
  () =>
    status.value.phase === 'Complete' &&
    status.value.result &&
    dismissedResult.value !== status.value.result.id
);

const outcome = computed(() =>
  ['Failed', 'Aborted'].includes(status.value.phase)
    ? { phase: status.value.phase, message: status.value.message, pairs: status.value.pairs }
    : null
);

// The plan expires on the backend after 60 s: the sky moves on. Counted from when it arrived, so
// that a phone clock off the Pi's does not matter.
const now = ref(Date.now());
const timer = setInterval(() => (now.value = Date.now()), 1000);
onUnmounted(() => clearInterval(timer));
const secondsLeft = computed(() =>
  plan.value
    ? Math.max(
        0,
        Math.round(plan.value.expiresInSeconds - (now.value - plan.value.receivedAt) / 1000)
      )
    : 0
);

async function makePlan() {
  try {
    await store.saveSettings({
      dovetailMm: dovetailMm.value,
      repetitions: repetitions.value,
      exposureSeconds: exposure.value,
      minAltitudeDegrees: minAltitude.value,
    });
    noPointingModel.value = false;
    await store.planAuto({
      dovetailMm: dovetailMm.value,
      repetitions: repetitions.value,
      declination: moreOptions.value && customDeclination.value ? declination.value : null,
      exposureSeconds: exposure.value,
    });
  } catch {
    // shown through store.error
  }
}

async function start() {
  const yes = await toast.showConfirmation(
    t('plugins.coneError.auto.startConfirmTitle'),
    t('plugins.coneError.auto.startConfirmMessage'),
    t('plugins.coneError.auto.start'),
    t('common.cancel')
  );
  if (!yes) return;
  try {
    await store.startAuto(noPointingModel.value);
  } catch {
    // shown through store.error
  }
}

function newMeasurement() {
  dismissedResult.value = status.value.result?.id ?? null;
  store.loadPreconditions();
}
</script>
