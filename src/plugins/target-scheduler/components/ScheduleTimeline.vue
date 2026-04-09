<template>
  <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-3 space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-200">
        {{ t('plugins.targetScheduler.timeline.title') }}
      </h3>
      <span class="text-xs text-slate-500" v-if="session">
        {{
          t('plugins.targetScheduler.timeline.range', {
            start: formatTime(session.start),
            end: formatTime(session.end),
          })
        }}
      </span>
    </div>

    <div v-if="!session" class="text-xs text-slate-500">
      {{ t('plugins.targetScheduler.timeline.invalidSessionRange') }}
    </div>

    <div v-else-if="!segments.length" class="text-xs text-slate-500">
      {{ t('plugins.targetScheduler.timeline.noSegments') }}
    </div>

    <div v-else class="space-y-2">
      <div class="grid grid-cols-[112px_1fr] gap-2 items-center text-[11px] text-slate-500">
        <span></span>
        <div class="flex justify-between">
          <span>{{ formatTime(session.start) }}</span>
          <span>{{ formatTime(midpointIso) }}</span>
          <span>{{ formatTime(session.end) }}</span>
        </div>
      </div>

      <div
        v-for="row in rows"
        :key="row.targetId"
        class="grid grid-cols-[112px_1fr] gap-2 items-center"
      >
        <div class="min-w-0">
          <p class="truncate text-xs text-slate-200">{{ row.name }}</p>
          <p class="text-[11px] text-slate-500">
            {{
              t('plugins.targetScheduler.timeline.minutesShort', { value: row.minutes.toFixed(0) })
            }}
          </p>
        </div>

        <div class="relative h-6 rounded bg-slate-900/80 border border-slate-700 overflow-hidden">
          <div
            v-for="segment in row.segments"
            :key="segment.id"
            class="absolute top-0 h-full rounded-sm bg-cyan-500/70 border border-cyan-300/40"
            :style="segmentStyle(segment)"
            :title="
              t('plugins.targetScheduler.timeline.segmentTitle', {
                name: row.name,
                start: formatTime(segment.start),
                end: formatTime(segment.end),
              })
            "
          ></div>
        </div>
      </div>

      <div v-if="idleSegments.length" class="grid grid-cols-[112px_1fr] gap-2 items-center">
        <div>
          <p class="text-xs text-slate-300">{{ t('plugins.targetScheduler.timeline.idle') }}</p>
        </div>
        <div class="relative h-6 rounded bg-slate-900/80 border border-slate-700 overflow-hidden">
          <div
            v-for="segment in idleSegments"
            :key="segment.id"
            class="absolute top-0 h-full rounded-sm bg-amber-600/45 border border-amber-400/40"
            :style="segmentStyle(segment)"
            :title="
              t('plugins.targetScheduler.timeline.idleSegmentTitle', {
                start: formatTime(segment.start),
                end: formatTime(segment.end),
              })
            "
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  session: {
    type: Object,
    default: null,
  },
  segments: {
    type: Array,
    default: () => [],
  },
  idleSegments: {
    type: Array,
    default: () => [],
  },
  targets: {
    type: Array,
    default: () => [],
  },
});

const { t } = useI18n();

const targetMap = computed(() => {
  const map = new Map();
  for (const target of props.targets) {
    map.set(target.id, target.name || target.id);
  }
  return map;
});

const rows = computed(() => {
  const grouped = new Map();

  for (const segment of props.segments) {
    const targetId = segment.targetId;
    if (!grouped.has(targetId)) {
      grouped.set(targetId, {
        targetId,
        name: targetMap.value.get(targetId) || targetId,
        minutes: 0,
        segments: [],
      });
    }

    const row = grouped.get(targetId);
    row.minutes += Number(segment.durationMinutes) || 0;
    row.segments.push(segment);
  }

  return Array.from(grouped.values());
});

const midpointIso = computed(() => {
  if (!props.session) return null;
  const start = new Date(props.session.start).getTime();
  const end = new Date(props.session.end).getTime();
  return new Date(start + (end - start) / 2).toISOString();
});

function segmentStyle(segment) {
  if (!props.session) return {};

  const start = new Date(props.session.start).getTime();
  const end = new Date(props.session.end).getTime();
  const total = Math.max(1, end - start);

  const segmentStart = new Date(segment.start).getTime();
  const segmentEnd = new Date(segment.end).getTime();

  const left = ((segmentStart - start) / total) * 100;
  const width = Math.max(0.6, ((segmentEnd - segmentStart) / total) * 100);

  return {
    left: `${left}%`,
    width: `${width}%`,
  };
}

function formatTime(value) {
  if (!value) return '--:--';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
</script>
