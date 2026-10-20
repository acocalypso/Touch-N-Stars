<template>
  <section class="flex flex-col gap-3">
    <div class="tns-card flex flex-col gap-3">
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <ConeErrorIcon class="h-6 w-6 shrink-0 text-accent" />
          <div class="flex min-w-0 flex-col">
            <h3 class="text-base font-semibold text-content">
              {{ $t('plugins.coneError.progress.title') }}
            </h3>
            <span class="truncate text-xs text-accent">
              {{ $t(`plugins.coneError.progress.phase.${status.phase}`) }}
            </span>
          </div>
        </div>
        <span class="shrink-0 text-2xl font-bold tabular-nums text-content">{{ percent }}%</span>
      </div>

      <div class="h-2 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          class="h-full rounded-full bg-accent transition-all duration-700"
          :style="{ width: `${percent}%` }"
        ></div>
      </div>
      <div class="flex flex-wrap justify-between gap-x-3 text-xs tabular-nums text-content-muted">
        <span>{{ status.message }}</span>
        <span v-if="flipIn">{{ $t('plugins.coneError.progress.flipIn', { time: flipIn }) }}</span>
      </div>

      <ol class="flex flex-col gap-1">
        <li
          v-for="pair in pairs"
          :key="pair.index"
          class="flex items-center gap-2 rounded-control px-2 py-1.5"
          :class="pair.state === 'Running' ? 'bg-accent/10' : ''"
        >
          <component
            :is="stateIcon(pair.state)"
            class="h-5 w-5 shrink-0"
            :class="[stateColor(pair.state), iconClass(pair.state)]"
          />
          <span
            class="min-w-0 flex-1 truncate text-sm"
            :class="pair.state === 'Running' ? 'font-semibold text-content' : 'text-content-muted'"
          >
            {{ $t('plugins.coneError.progress.pair', { pair: pair.index + 1 }) }}
          </span>
          <span class="shrink-0 text-xs tabular-nums" :class="stateColor(pair.state)">
            {{ pair.summary }}
          </span>
        </li>
      </ol>

      <div
        v-if="status.question"
        class="rounded-control border border-status-warn/50 bg-status-warn/10 p-3 space-y-3"
      >
        <h3 class="font-semibold text-status-warn">{{ $t('plugins.coneError.question.title') }}</h3>
        <PierSideSketch />
        <p class="text-sm text-content">{{ status.question.text }}</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="tns-btn-primary"
            :disabled="store.pending"
            @click="answer(true)"
          >
            {{ $t('plugins.coneError.question.yes') }}
          </button>
          <button
            type="button"
            class="tns-btn-secondary"
            :disabled="store.pending"
            @click="answer(false)"
          >
            {{ $t('plugins.coneError.question.no') }}
          </button>
        </div>
      </div>

      <ConeStopButton />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline';
import { useConeErrorStore } from '../store/coneErrorStore';
import ConeErrorIcon from './ConeErrorIcon.vue';
import ConeStopButton from './ConeStopButton.vue';
import PierSideSketch from './PierSideSketch.vue';

const { t } = useI18n();
const store = useConeErrorStore();
const status = computed(() => store.status ?? {});

// One row per planned pair: done (its cone), failed (its problem), running (the side) or pending.
const pairs = computed(() => {
  const records = status.value.pairs ?? [];
  return Array.from({ length: status.value.repetitions || 0 }, (_, index) => {
    const record = records.find((r) => r.index === index);
    if (record?.coneArcmin != null) {
      return { index, state: 'Done', summary: `${record.coneArcmin.toFixed(2)}′` };
    }
    if (record?.problem) {
      return { index, state: 'Failed', summary: t('plugins.coneError.progress.dropped') };
    }
    if (record && index === status.value.pairIndex) {
      return {
        index,
        state: 'Running',
        summary: status.value.currentSide
          ? t('plugins.coneError.progress.side', { side: status.value.currentSide })
          : '',
      };
    }
    return { index, state: 'Pending', summary: '' };
  });
});

const percent = computed(() => {
  const total = pairs.value.length || 1;
  const done = pairs.value.filter((p) => p.state === 'Done' || p.state === 'Failed').length;
  return Math.min(100, Math.round((done / total) * 100));
});

const flipIn = computed(() => {
  const seconds = status.value.secondsUntilFlip;
  if (typeof seconds !== 'number') return null;
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
});

function stateIcon(state) {
  switch (state) {
    case 'Running':
      return ArrowPathIcon;
    case 'Done':
      return CheckCircleIcon;
    case 'Failed':
      return XCircleIcon;
    default:
      return 'span';
  }
}

function stateColor(state) {
  switch (state) {
    case 'Running':
      return 'text-accent';
    case 'Done':
      return 'text-status-ok';
    case 'Failed':
      return 'text-status-danger';
    default:
      return 'text-content-faint';
  }
}

function iconClass(state) {
  // Pending: an empty ring in place of an icon
  if (state === 'Pending') return 'inline-block scale-75 rounded-full border-2 border-line-strong';
  return '';
}

async function answer(yes) {
  try {
    await store.answer(status.value.question.id, yes);
  } catch {
    // shown through store.error
  }
}
</script>
