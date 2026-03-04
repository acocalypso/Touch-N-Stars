<template>
  <div class="pt-2 pb-1 space-y-2">

    <!-- Issues -->
    <div v-if="item.Issues && item.Issues.length" class="bg-red-900/20 border border-red-700/40 rounded-lg p-2 space-y-0.5">
      <p v-for="(iss, i) in item.Issues" :key="i" class="text-red-300 text-xs flex items-start gap-1">
        <ExclamationTriangleIcon class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        {{ iss }}
      </p>
    </div>

    <div class="space-y-2">

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
</template>

<script setup>
import { computed, ref } from 'vue';
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import { useSequenceNewStore } from '@/store/sequenceNewStore';

const props = defineProps({
  item: { type: Object, required: true },
});

const store  = useSequenceNewStore();
const saving = ref(false);

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
</script>
