<script setup>
import { computed } from 'vue';
import { THEME } from '../theme';

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

const now = Date.now();

const rows = computed(() =>
  props.segments.map((s, i) => ({
    key: `${s.Id || 'wait'}-${i}`,
    isWait: s.WaitPeriod || !s.Id,
    name: s.Name,
    start: s.StartTime,
    end: s.EndTime,
    summary: exposureSummary(s.ExposurePlan || []),
    isNow: now >= new Date(s.StartTime).getTime() && now < new Date(s.EndTime).getTime(),
  }))
);
</script>

<template>
  <div class="rounded-lg p-3" :style="{ backgroundColor: THEME.surface2 }">
    <p class="mb-3 flex items-start gap-1.5 text-[11px]" :style="{ color: THEME.inkMuted }">
      <svg class="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
      Scheduler's predicted plan for tonight, recomputed on every refresh — not a record of what
      NINA is actually imaging right now.
    </p>

    <div v-if="!rows.length" class="text-sm" :style="{ color: THEME.inkMuted }">No schedule data.</div>

    <ol v-else class="relative space-y-1 border-l pl-4" :style="{ borderColor: THEME.border }">
      <li v-for="row in rows" :key="row.key" class="relative">
        <span
          class="absolute -left-[21px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
          :style="{
            backgroundColor: row.isWait ? THEME.track : row.isNow ? THEME.good : THEME.accent,
            boxShadow: `0 0 0 3px ${THEME.surface2}`,
          }"
        />
        <div
          class="flex items-center gap-3 rounded px-2 py-1.5 text-xs"
          :style="{ backgroundColor: row.isNow ? THEME.goodBg : 'transparent' }"
        >
          <span class="w-24 shrink-0 tabular-nums" :style="{ color: THEME.inkMuted }">
            {{ formatTime(row.start) }}–{{ formatTime(row.end) }}
          </span>
          <span class="w-14 shrink-0 text-right tabular-nums" :style="{ color: THEME.inkMuted }">
            {{ formatDuration(row.start, row.end) }}
          </span>
          <template v-if="row.isWait">
            <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :style="{ color: THEME.inkMuted }">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998Z" />
            </svg>
            <span class="italic" :style="{ color: THEME.inkMuted }">Waiting — target not yet visible</span>
          </template>
          <template v-else>
            <span class="shrink-0 font-medium">{{ row.name }}</span>
            <span class="truncate" :style="{ color: THEME.inkSecondary }">{{ row.summary }}</span>
          </template>
        </div>
      </li>
    </ol>
  </div>
</template>
