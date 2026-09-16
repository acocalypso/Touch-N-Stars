<script setup>
import { computed } from 'vue';

const props = defineProps({
  segments: { type: Array, required: true },
});

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(startIso, endIso) {
  const ms = new Date(endIso) - new Date(startIso);
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function exposureSummary(plan) {
  const byFilter = new Map();
  for (const p of plan) {
    byFilter.set(p.FilterName, (byFilter.get(p.FilterName) || 0) + p.Count);
  }
  return [...byFilter.entries()].map(([filter, count]) => `${count}× ${filter}`).join(', ');
}

const rows = computed(() =>
  props.segments.map((s, i) => ({
    key: `${s.Id || 'wait'}-${i}`,
    isWait: s.WaitPeriod || !s.Id,
    name: s.Name,
    start: s.StartTime,
    end: s.EndTime,
    summary: exposureSummary(s.ExposurePlan || []),
  }))
);
</script>

<template>
  <div class="rounded-lg border border-amber-700/40 bg-amber-950/20 p-3">
    <p class="mb-2 text-[11px] text-amber-300">
      Scheduler's predicted plan for tonight, recomputed on every refresh — not a record of what
      NINA is actually imaging right now.
    </p>

    <div v-if="!rows.length" class="text-sm text-slate-500">No schedule data.</div>

    <ol v-else class="space-y-1.5">
      <li
        v-for="row in rows"
        :key="row.key"
        class="flex items-center gap-3 rounded border border-slate-700 bg-slate-800/40 px-2 py-1.5 text-xs"
        :class="{ 'opacity-60': row.isWait }"
      >
        <span class="w-24 shrink-0 tabular-nums text-slate-400">
          {{ formatTime(row.start) }}–{{ formatTime(row.end) }}
        </span>
        <span class="w-14 shrink-0 text-right tabular-nums text-slate-500">
          {{ formatDuration(row.start, row.end) }}
        </span>
        <span v-if="row.isWait" class="italic text-slate-500">Wait (target not yet visible)</span>
        <template v-else>
          <span class="shrink-0 font-medium">{{ row.name }}</span>
          <span class="truncate text-slate-400">{{ row.summary }}</span>
        </template>
      </li>
    </ol>
  </div>
</template>
