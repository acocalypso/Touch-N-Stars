<script setup>
import { computed, ref } from 'vue';
import TargetCard from './TargetCard.vue';
import { THEME } from '../theme';

const props = defineProps({
  project: { type: Object, required: true },
  targets: { type: Array, default: () => [] },
  targetsError: { type: String, default: '' },
});

const expanded = ref(false);

const stateStyle = computed(() => {
  if (props.project.State === 'Active') {
    return { dot: THEME.good, text: THEME.good };
  }
  return { dot: THEME.inkMuted, text: THEME.inkMuted };
});

const rollup = computed(() => {
  let desired = 0;
  let accepted = 0;
  for (const target of props.targets) {
    for (const plan of target.ExposurePlan || []) {
      desired += plan.Desired;
      accepted += plan.Accepted;
    }
  }
  return {
    desired,
    accepted,
    pct: desired > 0 ? Math.min(100, Math.round((accepted / desired) * 100)) : 0,
  };
});
</script>

<template>
  <div
    class="overflow-hidden rounded-lg border-l-2"
    :style="{ backgroundColor: THEME.surface2, borderColor: THEME.border, borderLeftColor: stateStyle.dot }"
  >
    <button
      class="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:brightness-110"
      @click="expanded = !expanded"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <span class="flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-wide" :style="{ color: stateStyle.text }">
          <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: stateStyle.dot }" />
          {{ project.State }}
        </span>
        <span class="truncate font-semibold">{{ project.Name }}</span>
        <span class="shrink-0 text-[11px]" :style="{ color: THEME.inkMuted }">priority {{ project.Priority }}</span>
      </div>

      <div class="flex shrink-0 items-center gap-3">
        <div class="hidden items-center gap-2 sm:flex">
          <div class="h-1.5 w-24 overflow-hidden rounded-full" :style="{ backgroundColor: THEME.track }">
            <div class="h-full rounded-full" :style="{ width: rollup.pct + '%', backgroundColor: THEME.good }" />
          </div>
          <span class="w-9 text-right text-[11px] tabular-nums" :style="{ color: THEME.inkMuted }">{{ rollup.pct }}%</span>
        </div>
        <svg
          class="h-4 w-4 shrink-0 transition-transform"
          :class="{ 'rotate-180': expanded }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          :style="{ color: THEME.inkMuted }"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </button>

    <div
      class="grid transition-[grid-template-rows] duration-200 ease-out"
      :style="{ gridTemplateRows: expanded ? '1fr' : '0fr' }"
    >
      <div class="overflow-hidden">
        <div class="space-y-2 border-t p-3" :style="{ borderColor: THEME.border }">
          <div v-if="targetsError" class="text-sm" :style="{ color: THEME.critical }">{{ targetsError }}</div>
          <div v-else-if="!targets.length" class="text-sm" :style="{ color: THEME.inkMuted }">
            No targets in this project.
          </div>
          <TargetCard v-for="target in targets" :key="target.Id" :target="target" />
        </div>
      </div>
    </div>
  </div>
</template>
