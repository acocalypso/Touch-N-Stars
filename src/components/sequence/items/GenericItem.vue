<template>
  <div class="flex-1 min-w-0">
    <!-- Summary row -->
    <div class="flex items-center gap-1.5">
      <span class="text-sm font-medium text-gray-200 truncate flex-1 min-w-0">{{ item.Name }} Generic </span>

      <!-- Issues badge -->
      <span
        v-if="item.Issues && item.Issues.length"
        class="flex-shrink-0 flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full px-1.5 py-0.5 text-xs"
        :title="item.Issues.join('\n')"
      >
        <ExclamationTriangleIcon class="w-3 h-3" />
        {{ item.Issues.length }}
      </span>

      <!-- Status badge -->
      <span
        v-if="item.Status && item.Status !== 'CREATED'"
        class="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
        :class="statusColor(item.Status)"
      >
        {{ item.Status }}
      </span>

      <!-- Edit toggle -->
      <button
        class="flex-shrink-0 p-1 rounded hover:bg-slate-600/40 transition-colors"
        :class="editing ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'"
        title="Bearbeiten"
        @click.stop="editing = !editing"
      >
        <PencilSquareIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Edit panel -->
    <div v-if="editing" class="border-t border-slate-700/50 mt-1 pt-2 text-xs text-slate-500">
      Kein Editor verfügbar
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ExclamationTriangleIcon, PencilSquareIcon } from '@heroicons/vue/24/outline';

defineProps({
  item: { type: Object, required: true },
});

const editing = ref(false);

function statusColor(status) {
  switch (status) {
    case 'FINISHED': return 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50';
    case 'RUNNING':  return 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50';
    case 'SKIPPED':  return 'bg-gray-500/30 text-gray-300 border border-gray-400/50';
    case 'DISABLED': return 'bg-gray-700/50 text-gray-500 border border-gray-600/50';
    default:         return 'bg-gray-600/30 text-gray-300 border border-gray-500/50';
  }
}
</script>
