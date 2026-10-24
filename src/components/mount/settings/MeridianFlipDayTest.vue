<template>
  <Modal
    :show="true"
    zIndex="z-50"
    maxWidth="max-w-lg"
    :disableClose="isActive"
    :closeOnBackdropClick="false"
    @close="emit('close')"
  >
    <template #header>
      <h2 class="text-xl font-bold">{{ $t(`${base}.title`) }}</h2>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 w-full self-start">
        <!-- Step 0: prerequisites, exposure length, sequence notice and confirmations -->
        <template v-if="step === 'checks'">
          <p class="text-sm text-content">{{ $t(`${base}.intro`) }}</p>

          <ul v-if="blockers.length" class="flex flex-col gap-2">
            <li
              v-for="blocker in blockers"
              :key="blocker"
              class="flex items-start gap-2 text-sm text-status-danger"
            >
              <span class="tns-dot bg-status-danger mt-1.5"></span>
              {{ $t(`${base}.blockers.${blocker}`) }}
            </li>
          </ul>
          <ButtonUnpark v-if="store.mountIsParked" />

          <NumberInputPicker
            v-model="exposureSeconds"
            inputId="flip-test-exposure"
            labelKey="components.mount.settings.meridian_flip.dayTest.exposure"
            :label="$t(`${base}.exposure`)"
            :helpMessage="$t(`${base}.exposureHelp`)"
            :min="10"
            :max="1800"
            :step="10"
            :useDefaultSentinel="false"
            labelPosition="top"
            wrapperClass="w-full"
          />
          <p class="text-sm text-content-muted">
            {{
              $t(`${base}.plan`, {
                minutes: plan.expectedMinutes,
                flip: formatMinutes(plan.latestFlipMinutes),
              })
            }}
          </p>

          <p class="text-sm text-status-warn">{{ $t(`${base}.sequenceNotice`) }}</p>

          <label class="flex items-start gap-3 min-h-touch cursor-pointer">
            <input v-model="capsConfirmed" type="checkbox" class="mt-1 w-5 h-5 shrink-0" />
            <span class="flex flex-col gap-1">
              <span class="font-semibold text-content">{{ $t(`${base}.caps.label`) }}</span>
              <span class="text-sm text-content-muted">{{ $t(`${base}.caps.reason`) }}</span>
            </span>
          </label>
          <div class="pl-8">
            <button
              type="button"
              class="text-sm text-accent underline min-h-touch"
              data-haptic="none"
              @click="showCapsDetails = !showCapsDetails"
            >
              {{ $t(`${base}.caps.whyTitle`) }}
            </button>
            <p v-if="showCapsDetails" class="text-sm text-content-muted italic">
              {{ $t(`${base}.caps.whyText`) }}
            </p>
          </div>

          <label class="flex items-start gap-3 min-h-touch cursor-pointer">
            <input v-model="presenceConfirmed" type="checkbox" class="mt-1 w-5 h-5 shrink-0" />
            <span class="flex flex-col gap-1">
              <span class="font-semibold text-content">{{ $t(`${base}.presence.label`) }}</span>
              <span class="text-sm text-content-muted">{{ $t(`${base}.presence.reason`) }}</span>
            </span>
          </label>

          <button class="tns-btn-primary" :disabled="!canStart" @click="startTest">
            {{ $t(`${base}.start`) }}
          </button>
        </template>

        <template v-else-if="step === 'noPoint'">
          <p class="text-sm text-status-warn">{{ $t(`${base}.noPoint`) }}</p>
          <button class="tns-btn-secondary" @click="emit('close')">
            {{ $t('common.close') }}
          </button>
        </template>

        <!-- Running: NINA drives, the app shows where the mount is and can stop it -->
        <template v-else-if="step === 'starting' || step === 'running'">
          <p class="text-sm text-content flex items-center gap-2">
            <span
              class="w-5 h-5 shrink-0 rounded-full border-2 border-accent border-t-transparent animate-spin"
            ></span>
            {{ statusText }}
          </p>
          <p v-if="countdownText" class="text-2xl font-bold text-content tabular-nums">
            {{ countdownText }}
          </p>
          <p class="text-xs text-content-muted">{{ $t(`${base}.runningHint`) }}</p>
          <button class="tns-btn-danger min-h-20! text-lg!" @click="stopTest">
            {{ $t(`${base}.stop`) }}
          </button>
        </template>

        <!-- The person at the mount judges the result -->
        <template v-else-if="step === 'ask'">
          <p class="text-base font-semibold text-content">{{ $t(`${base}.askQuestion`) }}</p>
          <div class="flex gap-2">
            <button class="tns-btn-primary flex-1" @click="answer(true)">
              {{ $t(`${base}.yes`) }}
            </button>
            <button class="tns-btn-secondary flex-1" @click="answer(false)">
              {{ $t(`${base}.no`) }}
            </button>
          </div>
        </template>

        <template v-else-if="step === 'result'">
          <p
            class="text-base font-semibold"
            :class="userSaysOk ? 'text-status-ok' : 'text-status-warn'"
          >
            {{ $t(userSaysOk ? `${base}.resultOk` : `${base}.resultProblem`) }}
          </p>
          <p v-if="!userSaysOk" class="text-sm text-content">{{ $t(`${base}.problemAdvice`) }}</p>
          <p v-if="flipAtMinutes !== null" class="text-sm text-content-muted">
            {{ $t(`${base}.flippedAt`, { minutes: formatMinutes(flipAtMinutes) }) }}
          </p>
          <p v-if="flipReport?.failed" class="text-sm text-status-warn">
            {{
              $t(`${base}.ninaError`, {
                step: $t(`${base}.steps.${flipReport.failedStep}`),
              })
            }}
            <template v-if="flipReport.failedStep === 'recenter'">
              {{ $t(`${base}.ninaErrorRecenterCaps`) }}
            </template>
          </p>
          <p v-else-if="flipReport?.found" class="text-sm text-status-ok">
            {{ $t(`${base}.ninaOk`) }}
          </p>
          <p v-if="pierOutcome === 'changed'" class="text-sm text-content-muted">
            {{
              $t(`${base}.pierChanged`, {
                before: sideLabel(pierBefore),
                after: sideLabel(pierAfter),
              })
            }}
          </p>
          <p class="text-xs text-content-muted">{{ $t(`${base}.notTested`) }}</p>
          <ButtonPark />
          <button class="tns-btn-secondary" @click="emit('close')">
            {{ $t('common.close') }}
          </button>
        </template>

        <template v-else-if="step === 'noFlip' || step === 'stopped' || step === 'failed'">
          <p class="text-sm" :class="step === 'stopped' ? 'text-content' : 'text-status-danger'">
            {{ endText }}
          </p>
          <p v-if="step === 'noFlip'" class="text-sm text-content">
            {{ $t(`${base}.noFlipAdvice`) }}
          </p>
          <ButtonPark v-if="step !== 'failed'" />
          <button class="tns-btn-secondary" @click="emit('close')">
            {{ $t('common.close') }}
          </button>
        </template>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from '@/components/helpers/Modal.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import ButtonPark from '@/components/mount/ButtonPark.vue';
import ButtonUnpark from '@/components/mount/ButtonUnpark.vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';
import { getSunEquatorial } from '@/utils/astronomy';
import { createPoller } from '@/utils/poller';
import {
  analyzeFlipLog,
  comparePierSides,
  findFlipTestDeclination,
  flipTriggerStatus,
  isSequenceRunning,
  planFlipTest,
} from '@/utils/meridianFlipDayTest';
import { isPierSideKnown } from '@/utils/meridianFlipPresets';
import { buildFlipTestSequence } from '@/utils/meridianFlipTestSequence';

const emit = defineEmits(['close']);

const base = 'components.mount.settings.meridian_flip.dayTest';
const { t } = useI18n();
const store = apiStore();
const toastStore = useToastStore();

// checks -> starting -> running -> ask -> result
// side exits: noPoint, noFlip, stopped, failed
const step = ref('checks');
const exposureSeconds = ref(300);
const capsConfirmed = ref(false);
const presenceConfirmed = ref(false);
const showCapsDetails = ref(false);
const sequenceBusy = ref(false);
const pierBefore = ref('');
const pierAfter = ref('');
const flipAtMinutes = ref(null);
const flipReport = ref(null);
const userSaysOk = ref(false);
const endText = ref('');
let startedAt = 0;
// RA of the start point; the mount counts as arrived once it tracks there. A fast slew
// can start and end between two mountInfo polls, so Slewing alone is not reliable.
let startRaHours = null;
const reachedStart = ref(false);
// Set once NINA's flip trigger is seen RUNNING (or the pier side has changed).
const flipStarted = ref(false);

const flipSettings = computed(() => store.profileInfo?.MeridianFlipSettings ?? {});
const plan = computed(() => planFlipTest(flipSettings.value, exposureSeconds.value));
const isActive = computed(() => step.value === 'starting' || step.value === 'running');

const blockers = computed(() => {
  const mount = store.mountInfo;
  if (!mount?.Connected) return ['notConnected'];
  const list = [];
  if (mount.AtPark) list.push('parked');
  if (!mount.CanSlew) list.push('cannotSlew');
  if (!mount.SiteLatitude && !mount.SiteLongitude) list.push('noLocation');
  if (sequenceBusy.value) list.push('sequenceRunning');
  return list;
});

const canStart = computed(
  () => blockers.value.length === 0 && capsConfirmed.value && presenceConfirmed.value
);

const pierOutcome = computed(() => comparePierSides(pierBefore.value, pierAfter.value));

// Minutes the mount is past the meridian, from its own sidereal time and RA.
const minutesPastMeridian = computed(() => {
  const m = store.mountInfo;
  if (!Number.isFinite(m?.SiderealTime) || !Number.isFinite(m?.RightAscension)) return null;
  const minutes = (m.SiderealTime - m.RightAscension) * 60;
  return ((((minutes + 720) % 1440) + 1440) % 1440) - 720;
});

// NINA reports the time to the latest flip; the earliest lies (max - min) before it.
const latestFlipInMinutes = computed(() => {
  const hours = store.mountInfo?.TimeToMeridianFlip;
  return Number.isFinite(hours) && hours < 23 ? hours * 60 : null;
});

const statusText = computed(() => {
  if (flipStarted.value) return t(`${base}.flipping`);
  if (!reachedStart.value) return t(`${base}.slewingToStart`);
  const past = minutesPastMeridian.value;
  if (past === null || past < 0) return t(`${base}.waitingForMeridian`);
  return t(`${base}.pastMeridian`, { minutes: formatMinutes(past) });
});

const countdownText = computed(() => {
  const latest = latestFlipInMinutes.value;
  // After the flip NINA already counts down to the next flip, twelve hours away.
  if (step.value !== 'running' || latest === null || flipStarted.value) return '';
  const window =
    Number(flipSettings.value.MaxMinutesAfterMeridian) -
    Number(flipSettings.value.MinutesAfterMeridian);
  const earliest = latest - (Number.isFinite(window) ? window : 0);
  if (earliest > 0) {
    return t(`${base}.countdownWindow`, {
      earliest: formatClock(earliest),
      latest: formatClock(latest),
    });
  }
  return t(`${base}.countdownLatest`, { latest: formatClock(Math.max(0, latest)) });
});

function formatMinutes(minutes) {
  return String(Math.round(minutes * 10) / 10);
}

function formatClock(minutes) {
  const total = Math.max(0, Math.round(minutes * 60));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function sideLabel(side) {
  return side === 'pierEast' ? t(`${base}.sideEast`) : t(`${base}.sideWest`);
}

async function refreshSequenceBusy() {
  try {
    const response = await apiService.sequenceAction('state');
    sequenceBusy.value = isSequenceRunning(response?.Response);
  } catch {
    // No sequence information: do not block on it, the start re-checks.
    sequenceBusy.value = false;
  }
}
refreshSequenceBusy();

async function startTest() {
  await refreshSequenceBusy();
  if (!canStart.value) return;

  const confirmed = await toastStore.showConfirmation(
    t(`${base}.confirmTitle`),
    t(`${base}.confirmMessage`),
    t(`${base}.start`),
    t('common.cancel')
  );
  if (!confirmed) return;

  const mount = store.mountInfo;
  const point = findFlipTestDeclination({
    lstHours: mount.SiderealTime,
    latDeg: mount.SiteLatitude,
    sun: getSunEquatorial(new Date()),
    haFromHours: plan.value.haFromHours,
    haToHours: plan.value.haToHours,
  });
  if (!point) {
    step.value = 'noPoint';
    return;
  }

  step.value = 'starting';
  try {
    // East of the meridian: RA ahead of the mount's sidereal time by the lead.
    startRaHours = mount.SiderealTime + plan.value.leadMinutes / 60;
    const sequence = buildFlipTestSequence({
      raHours: startRaHours,
      decDeg: point.decDeg,
      waitSeconds: exposureSeconds.value,
      waitCount: plan.value.waitCount,
    });
    const loaded = await apiService.sequenceLoadJson(sequence);
    if (!loaded?.Success) throw new Error(loaded?.Error || 'load');
    const started = await apiService.sequenceAction('start');
    if (!started?.Success) throw new Error(started?.Error || 'start');
    startedAt = Date.now();
    step.value = 'running';
    poller.start();
  } catch (error) {
    console.error('Meridian flip test could not start:', error);
    endText.value = t(`${base}.startFailed`, { error: error?.message || '' });
    step.value = 'failed';
  }
}

// Stops everything that can move: the sequence, a slew, and tracking.
async function haltMount() {
  for (const action of [
    () => apiService.sequenceAction('stop'),
    () => apiService.slewStop(),
    () => apiService.setTrackingMode(4),
  ]) {
    try {
      await action();
    } catch (error) {
      console.error('Meridian flip test halt step failed:', error);
    }
  }
}

async function stopTest() {
  poller.stop();
  step.value = 'stopped';
  endText.value = t(`${base}.stopped`);
  await haltMount();
}

function markFlipStarted() {
  if (flipStarted.value) return;
  flipStarted.value = true;
  flipAtMinutes.value = Math.max(0, minutesPastMeridian.value ?? 0);
}

// NINA keeps the flip trigger RUNNING through slew, settling and recentering; the flip is
// over once it leaves RUNNING. Stopping the sequence earlier would cut NINA's routine off.
const poller = createPoller(async () => {
  if (step.value !== 'running') return;
  try {
    const response = await apiService.sequenceAction('state');
    const status = flipTriggerStatus(response?.Response);
    if (status === 'RUNNING') markFlipStarted();
    else if (flipStarted.value && !store.mountInfo?.Slewing) {
      await finishRun();
      return;
    }
  } catch (error) {
    console.error('Error reading the flip test sequence state:', error);
  }
  const overdueMs = (plan.value.expectedMinutes + 10) * 60 * 1000;
  if (!flipStarted.value && Date.now() - startedAt > overdueMs) {
    poller.stop();
    step.value = 'noFlip';
    endText.value = t(`${base}.noFlip`);
    await haltMount();
  }
}, 5000);

watch(
  () => [
    store.mountInfo?.Slewing,
    store.mountInfo?.SideOfPier,
    store.mountInfo?.TrackingEnabled,
    store.mountInfo?.RightAscension,
  ],
  ([slewing, side, tracking, ra]) => {
    if (step.value !== 'running' || slewing || !tracking) return;
    if (!reachedStart.value) {
      // JNOW vs. J2000 differs by well under 0.05 h; the previous position is far off.
      const offHours = Math.abs(((((ra - startRaHours) % 24) + 36) % 24) - 12);
      if (!Number.isFinite(offHours) || offHours > 0.05) return;
      reachedStart.value = true;
      pierBefore.value = side || 'pierUnknown';
      return;
    }
    // Backup for a trigger RUNNING phase shorter than one sequence poll.
    if (isPierSideKnown(side) && side !== pierBefore.value) markFlipStarted();
  }
);

async function finishRun() {
  poller.stop();
  pierAfter.value = store.mountInfo?.SideOfPier || '';
  step.value = 'ask';
  // The wait loop would run on for nothing; tracking stays on like after a real flip.
  try {
    await apiService.sequenceAction('stop');
  } catch (error) {
    console.error('Error stopping the flip test sequence:', error);
  }
  // NINA still marks a failed flip as FINISHED; only its log tells.
  try {
    flipReport.value = analyzeFlipLog(await apiService.getLastLogs(1500, 'INFO'));
  } catch (error) {
    console.error('Error reading the NINA log after the flip test:', error);
  }
}

function answer(ok) {
  userSaysOk.value = ok;
  step.value = 'result';
}

// A mount that drops out mid-test ends it; there is nothing left to watch.
watch(
  () => store.mountInfo?.Connected,
  (connected) => {
    if (connected || !isActive.value) return;
    poller.stop();
    endText.value = t(`${base}.blockers.notConnected`);
    step.value = 'failed';
  }
);

onBeforeUnmount(() => poller.stop());
</script>
