<template>
  <div class="flex-1 min-w-0">
    <!-- Summary row -->
    <div class="flex items-center gap-1.5">
      <span class="text-sm font-medium text-gray-200 truncate min-w-0">{{ item.Name }}</span>

      <!-- Quick info -->
      <span class="text-xs text-slate-400 flex-shrink-0 font-mono">
        {{ item.ExposureTime }}s
      </span>
      <span class="text-xs text-slate-500 flex-shrink-0">G{{ item.Gain }}</span>
      <span class="text-xs text-slate-500 flex-shrink-0">{{ item.ImageType }}</span>

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
    <div v-if="editing" class="border-t border-slate-700/50 mt-1 pt-2 space-y-2">

      <!-- Issues -->
      <div v-if="item.Issues && item.Issues.length" class="bg-red-900/20 border border-red-700/40 rounded-lg p-2 space-y-0.5">
        <p v-for="(iss, i) in item.Issues" :key="i" class="text-red-300 text-xs flex items-start gap-1">
          <ExclamationTriangleIcon class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {{ iss }}
        </p>
      </div>

      <!-- Exposure Time -->
      <div class="flex items-center justify-between gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0 w-32">Belichtungszeit (s)</label>
        <input
          type="number" step="0.1" min="0"
          class="flex-1 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200 min-w-0 font-mono"
          :value="item.ExposureTime"
          @blur="save('ExposureTime', $event.target.value)"
          @keydown.enter="$event.target.blur()"
        />
      </div>

      <!-- Gain -->
      <div class="flex items-center justify-between gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0 w-32">Gain</label>
        <input
          type="number" step="1"
          class="flex-1 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200 min-w-0 font-mono"
          :value="item.Gain"
          @blur="save('Gain', $event.target.value)"
          @keydown.enter="$event.target.blur()"
        />
      </div>

      <!-- Offset -->
      <div class="flex items-center justify-between gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0 w-32">Offset</label>
        <input
          type="number" step="1"
          class="flex-1 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200 min-w-0 font-mono"
          :value="item.Offset"
          @blur="save('Offset', $event.target.value)"
          @keydown.enter="$event.target.blur()"
        />
      </div>

      <!-- Binning -->
      <div class="flex items-center justify-between gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0 w-32">Binning</label>
        <select
          class="flex-1 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200 min-w-0"
          :value="binningValue"
          @change="save('Binning', $event.target.value)"
        >
          <option value='{"X":1,"Y":1}'>1x1</option>
          <option value='{"X":2,"Y":2}'>2x2</option>
          <option value='{"X":3,"Y":3}'>3x3</option>
          <option value='{"X":4,"Y":4}'>4x4</option>
        </select>
      </div>

      <!-- Image Type -->
      <div class="flex items-center justify-between gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0 w-32">Bildtyp</label>
        <select
          class="flex-1 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200 min-w-0"
          :value="item.ImageType"
          @change="save('ImageType', $event.target.value)"
        >
          <option value="LIGHT">LIGHT</option>
          <option value="DARK">DARK</option>
          <option value="FLAT">FLAT</option>
          <option value="BIAS">BIAS</option>
        </select>
      </div>

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
import { ref, computed } from 'vue';
import { ExclamationTriangleIcon, PencilSquareIcon } from '@heroicons/vue/24/outline';
import { useSequenceV2Store } from '@/store/sequenceV2Store';

const props = defineProps({
  item: { type: Object, required: true },
});

const store   = useSequenceV2Store();
const editing = ref(false);
const saving  = ref(false);

const binningValue = computed(() => {
  const b = props.item.Binning;
  if (!b) return '{"X":1,"Y":1}';
  return JSON.stringify({ X: b.X, Y: b.Y });
});

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
