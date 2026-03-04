<template>
  <div
    class="rounded-lg border transition-all duration-200"
    :class="itemBorderClass"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
      :class="itemHeaderClass"
      @click="hasChildren && (collapsed = !collapsed)"
    >
      <div class="flex items-center gap-2 min-w-0">
        <!-- Collapse chevron -->
        <svg
          v-if="hasChildren"
          class="w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200"
          :class="{ 'rotate-90': !collapsed }"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          />
        </svg>
        <span v-else class="w-3.5 flex-shrink-0" />

        <!-- Name -->
        <span class="text-sm font-medium text-gray-200 truncate">{{ item.Name }}</span>

        <!-- Issues indicator -->
        <span
          v-if="item.Issues && item.Issues.length"
          class="flex-shrink-0 flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full px-1.5 py-0.5 text-xs"
          :title="item.Issues.join('\n')"
        >
          <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          {{ item.Issues.length }}
        </span>
      </div>

      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Triggers badges -->
        <span
          v-for="trigger in item.Triggers"
          :key="trigger.Id"
          class="hidden sm:inline-flex bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full px-1.5 py-0.5 text-xs"
        >
          {{ trigger.Name }}
        </span>

        <!-- Status badge -->
        <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="statusColor(item.Status)">
          {{ item.Status }}
        </span>
      </div>
    </div>

    <!-- Conditions (shown below header when expanded) -->
    <div
      v-if="!collapsed && item.Conditions && item.Conditions.length"
      class="px-3 pb-1 flex flex-wrap gap-1"
    >
      <span
        v-for="cond in item.Conditions"
        :key="cond.Id"
        class="bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-1.5 py-0.5 text-xs"
      >
        {{ cond.Name }}
        <template v-if="cond.Iterations">{{ cond.CompletedIterations ?? 0 }}/{{ cond.Iterations }}</template>
      </span>
    </div>

    <!-- Children -->
    <div v-if="!collapsed && hasChildren" class="px-2 pb-2 space-y-1.5">
      <!-- Target info (for DeepSkyObjectContainer) -->
      <div
        v-if="item.Target && item.Target.TargetName"
        class="mx-1 mt-1 px-2 py-1 bg-slate-700/40 rounded text-xs text-slate-300 flex items-center gap-1"
      >
        <svg class="w-3 h-3 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="10" cy="10" r="2"/>
        </svg>
        {{ item.Target.TargetName }}
      </div>

      <SequenceItem
        v-for="child in item.Items"
        :key="child.Id"
        :item="child"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  item: { type: Object, required: true },
  depth: { type: Number, default: 0 },
});

const collapsed = ref(false);

const hasChildren = computed(() => props.item.Items && props.item.Items.length > 0);

function statusColor(status) {
  switch (status) {
    case 'FINISHED':
      return 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50';
    case 'RUNNING':
      return 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50';
    case 'CREATED':
      return 'bg-amber-500/30 text-amber-200 border border-amber-400/50';
    case 'SKIPPED':
      return 'bg-gray-500/30 text-gray-300 border border-gray-400/50';
    default:
      return 'bg-gray-600/30 text-gray-300 border border-gray-500/50';
  }
}

const itemBorderClass = computed(() => {
  const status = props.item.Status;
  if (status === 'RUNNING') return 'border-cyan-600/40 bg-cyan-950/20';
  if (status === 'FINISHED') return 'border-emerald-600/30 bg-emerald-950/10';
  return 'border-slate-600/30 bg-slate-800/30';
});

const itemHeaderClass = computed(() => {
  if (hasChildren.value) return 'hover:bg-slate-700/30 rounded-lg';
  return '';
});
</script>
