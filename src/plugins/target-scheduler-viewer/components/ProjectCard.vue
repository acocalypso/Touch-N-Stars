<script setup>
import { computed, ref } from 'vue';
import TargetCard from './TargetCard.vue';
import { THEME } from '../theme';
import { fuzzyMatch } from '../fuzzyMatch';
import { computeRollup, buildProjectSettingsRows, classifyTargetCompletion } from '../calculations';

const props = defineProps({
  project: { type: Object, required: true },
  targets: { type: Array, default: () => [] },
  targetsError: { type: String, default: '' },
  searchQuery: { type: String, default: '' },
  completionFilter: { type: String, default: 'all' },
});

const expanded = ref(false);
const showSettings = ref(false);

// Completion filter is strict — it never falls back to "show everything" the
// way search does, since it's inherently about which targets qualify.
const completionFilteredTargets = computed(() => {
  if (props.completionFilter === 'all') return props.targets;
  return props.targets.filter((t) => classifyTargetCompletion(t) === props.completionFilter);
});

const filteredTargets = computed(() => {
  const base = completionFilteredTargets.value;
  if (!props.searchQuery) return base;
  const byName = base.filter((t) => fuzzyMatch(t.Name, props.searchQuery));
  // Empty match means the project itself matched the query (by name) — show
  // the rest of the completion-filtered targets rather than the raw list.
  return byName.length ? byName : base;
});

const isExpanded = computed(
  () => expanded.value || Boolean(props.searchQuery) || props.completionFilter !== 'all'
);

const settingsRows = computed(() => [
  ['Priority', props.project.Priority],
  ['Integration (accepted)', rollup.value.integrationTime],
  ['Integration (expected)', rollup.value.expectedIntegrationTime],
  ['Integration (remaining)', rollup.value.remainingIntegrationTime],
  ...buildProjectSettingsRows(props.project),
]);

// Maps to TNS's own semantic tokens (good/accent/warning/danger) rather than
// inventing new hues, so state colors stay consistent with the rest of the
// app. Any state not in this list (the API doesn't document the full set)
// falls back to a neutral muted dot rather than guessing a color for it.
const STATE_COLORS = {
  Active: 'good',
  Draft: 'accent',
  Inactive: 'warning',
  Closed: 'critical',
};

const stateStyle = computed(() => ({
  dot: THEME[STATE_COLORS[props.project.State]] || THEME.inkMuted,
}));

const rollup = computed(() => computeRollup(props.targets));
</script>

<template>
  <div
    class="overflow-hidden rounded-lg border-l-2"
    :style="{
      backgroundColor: THEME.surface2,
      borderColor: THEME.border,
      borderLeftColor: stateStyle.dot,
    }"
  >
    <button
      class="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:brightness-110"
      @click="expanded = !expanded"
    >
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
        <span
          class="h-2 w-2 shrink-0 rounded-full"
          :style="{ backgroundColor: stateStyle.dot }"
          :title="project.State"
        />
        <span class="break-words font-semibold">{{ project.Name }}</span>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <div
          class="hidden h-1.5 w-24 overflow-hidden rounded-full sm:block"
          :style="{ backgroundColor: THEME.track }"
        >
          <div
            class="h-full rounded-full"
            :style="{ width: rollup.pct + '%', backgroundColor: THEME.good }"
          />
        </div>
        <span class="w-9 text-right text-[11px] tabular-nums" :style="{ color: THEME.inkMuted }"
          >{{ rollup.pct }}%</span
        >
        <span
          role="button"
          tabindex="0"
          class="rounded p-1 transition-colors hover:brightness-125"
          :style="{
            backgroundColor: showSettings ? THEME.track : 'transparent',
            color: THEME.inkMuted,
          }"
          @click.stop="showSettings = !showSettings"
          @keydown.enter.stop="showSettings = !showSettings"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
        </span>
        <svg
          class="h-4 w-4 shrink-0 transition-transform"
          :class="{ 'rotate-180': isExpanded }"
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
      :style="{ gridTemplateRows: showSettings ? '1fr' : '0fr' }"
    >
      <div class="overflow-hidden">
        <dl
          class="grid grid-cols-2 gap-x-4 gap-y-1 border-t p-3 text-[11px] sm:grid-cols-3"
          :style="{ borderColor: THEME.border }"
        >
          <div v-for="[label, value] in settingsRows" :key="label">
            <dt :style="{ color: THEME.inkMuted }">{{ label }}</dt>
            <dd class="break-words">{{ value }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <div
      class="grid transition-[grid-template-rows] duration-200 ease-out"
      :style="{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }"
    >
      <div class="overflow-hidden">
        <div class="space-y-2 border-t p-3" :style="{ borderColor: THEME.border }">
          <div v-if="targetsError" class="text-sm" :style="{ color: THEME.critical }">
            {{ targetsError }}
          </div>
          <div v-else-if="!targets.length" class="text-sm" :style="{ color: THEME.inkMuted }">
            No targets in this project.
          </div>
          <TargetCard v-for="target in filteredTargets" :key="target.Id" :target="target" />
        </div>
      </div>
    </div>
  </div>
</template>
