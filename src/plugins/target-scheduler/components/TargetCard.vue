<template>
  <div
    class="rounded-lg border p-3 transition-all"
    :class="[
      selected
        ? 'border-cyan-400 bg-cyan-900/20 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]'
        : 'border-slate-700 bg-slate-800/60 hover:border-slate-500',
    ]"
  >
    <button class="w-full text-left" @click="$emit('select', target.id)">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h4 class="text-sm font-semibold text-slate-100 truncate">{{ target.name }}</h4>
          <p class="text-[11px] text-slate-400 font-mono truncate">
            {{ t('plugins.targetScheduler.common.ra') }} {{ formatRa(target.ra) }} |
            {{ t('plugins.targetScheduler.common.dec') }} {{ formatDec(target.dec) }}
          </p>
        </div>
        <span class="rounded bg-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
          {{ t('plugins.targetScheduler.targetCard.priorityShort', { value: target.priority }) }}
        </span>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-1">
        <span class="rounded bg-slate-700/80 px-2 py-0.5 text-[11px] text-slate-300">
          {{
            t('plugins.targetScheduler.targetCard.exposures', { count: target.exposures.length })
          }}
        </span>
        <span
          v-if="target.isFavoriteLinked"
          class="rounded bg-pink-900/40 px-2 py-0.5 text-[11px] text-pink-300"
        >
          {{ t('plugins.targetScheduler.targetCard.favoriteLinked') }}
        </span>
      </div>

      <div class="mt-2" v-if="summary">
        <div class="h-1.5 rounded bg-slate-700 overflow-hidden">
          <div class="h-full bg-cyan-400" :style="{ width: `${completionPercent}%` }"></div>
        </div>
        <p class="mt-1 text-[11px] text-slate-400">
          {{
            t('plugins.targetScheduler.targetCard.scheduledVsRequested', {
              scheduled: summary.scheduledMinutes.toFixed(0),
              requested: summary.requestedMinutes.toFixed(0),
            })
          }}
        </p>
      </div>
    </button>

    <div class="mt-3 flex items-center justify-end gap-2">
      <button
        class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
        @click="$emit('edit', target.id)"
      >
        {{ t('plugins.targetScheduler.common.edit') }}
      </button>
      <button
        class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
        @click="$emit('duplicate', target.id)"
      >
        {{ t('plugins.targetScheduler.common.copy') }}
      </button>
      <button
        class="rounded border border-red-600/70 px-2 py-1 text-xs text-red-300 hover:bg-red-900/30"
        @click="$emit('remove', target.id)"
      >
        {{ t('plugins.targetScheduler.common.remove') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  target: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  summary: {
    type: Object,
    default: null,
  },
});

defineEmits(['select', 'edit', 'duplicate', 'remove']);
const { t } = useI18n();

const completionPercent = computed(() => {
  if (!props.summary || props.summary.requestedMinutes <= 0) return 0;
  return Math.max(
    0,
    Math.min(100, (props.summary.scheduledMinutes / props.summary.requestedMinutes) * 100)
  );
});

function formatRa(raDeg) {
  const h = (Number(raDeg) / 15 + 24) % 24 || 0;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function formatDec(decDeg) {
  const n = Number(decDeg) || 0;
  const sign = n >= 0 ? '+' : '-';
  const a = Math.abs(n);
  const dd = Math.floor(a);
  const mm = Math.floor((a - dd) * 60);
  return `${sign}${String(dd).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
</script>
