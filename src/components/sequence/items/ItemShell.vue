<template>
  <div class="flex-1 min-w-0">
    <!-- Header: left=name+summary, right=badges+edit (vertically centered) -->
    <div class="flex items-center gap-1.5">

      <!-- Left: name + summary stacked -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="text-sm font-medium text-gray-200 truncate min-w-0">{{ item.Name }}</span>
          <span v-if="label" class="flex-shrink-0 text-xs text-slate-500 font-normal">{{ label }}</span>
        </div>
        <div v-if="$slots.summary" class="flex items-center gap-2 mt-0.5">
          <slot name="summary" />
        </div>
      </div>

      <!-- Right: badges + edit, centered relative to full height -->
      <div class="flex-shrink-0 flex items-center gap-1.5">
        <!-- Issues badge -->
        <span
          v-if="item.Issues && item.Issues.length"
          class="flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full px-1.5 py-0.5 text-xs"
          :title="item.Issues.join('\n')"
        >
          <ExclamationTriangleIcon class="w-3 h-3" />
          {{ item.Issues.length }}
        </span>

        <!-- Status badge -->
        <span
          v-if="item.Status && item.Status !== 'CREATED'"
          class="rounded-full px-2 py-0.5 text-xs font-medium"
          :class="statusColor(item.Status)"
        >
          {{ item.Status }}
        </span>

        <!-- Edit toggle -->
        <button
          v-if="hasEditor"
          class="p-1 rounded hover:bg-slate-600/40 transition-colors"
          :class="editing ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'"
          title="Bearbeiten"
          @click.stop="editing = !editing"
        >
          <PencilSquareIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Edit panel -->
    <div v-if="editing && hasEditor" class="border-t border-slate-700/50 mt-1 pt-2 space-y-2">

      <!-- Issues list -->
      <div v-if="item.Issues && item.Issues.length" class="bg-red-900/20 border border-red-700/40 rounded-lg p-2 space-y-0.5">
        <p v-for="(iss, i) in item.Issues" :key="i" class="text-red-300 text-xs flex items-start gap-1">
          <ExclamationTriangleIcon class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {{ iss }}
        </p>
      </div>

      <!-- Type-specific editor fields -->
      <slot name="editor" :save="save" :saving="saving" />

      <!-- Saving indicator -->
      <div v-if="saving" class="text-xs text-cyan-400 flex items-center gap-1">
        <svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Speichern…
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, useSlots } from 'vue';
import { ExclamationTriangleIcon, PencilSquareIcon } from '@heroicons/vue/24/outline';
import { useSequenceV2Store } from '@/store/sequenceV2Store';

const props = defineProps({
  item:  { type: Object, required: true },
  label: { type: String, default: '' },
});

const slots   = useSlots();
const store   = useSequenceV2Store();
const editing = ref(false);
const saving  = ref(false);

const hasEditor = computed(() => !!slots.editor);

async function save(key, value) {
  saving.value = true;
  await store.setProperty(props.item.Id, key, value);
  saving.value = false;
}

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
