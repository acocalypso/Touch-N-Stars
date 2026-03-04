<template>
  <div class="pt-2 pb-1 space-y-3">

    <!-- Issues -->
    <div v-if="item.Issues && item.Issues.length" class="bg-red-900/20 border border-red-700/40 rounded-lg p-2 space-y-0.5">
      <p v-for="(iss, i) in item.Issues" :key="i" class="text-red-300 text-xs flex items-start gap-1">
        <ExclamationTriangleIcon class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        {{ iss }}
      </p>
    </div>

    <!-- Loading metadata -->
    <div v-if="loadingMeta" class="flex items-center gap-2 text-slate-500 text-xs py-1">
      <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Lade Felder…
    </div>

    <!-- Fields from metadata -->
    <div v-else-if="fields.length" class="space-y-2">
      <div
        v-for="field in fields"
        :key="field.name"
        class="flex items-center justify-between gap-3"
      >
        <label class="text-xs text-slate-400 flex-shrink-0 w-32 truncate" :title="field.name">
          {{ field.label }}
        </label>

        <!-- Boolean toggle -->
        <button
          v-if="field.type === 'boolean'"
          class="text-xs rounded-full px-3 py-1 border transition-colors"
          :class="fieldValues[field.name]
            ? 'bg-cyan-600/30 text-cyan-300 border-cyan-600/50'
            : 'bg-slate-700/40 text-slate-400 border-slate-600/40'"
          @click="toggleBool(field.name)"
        >
          {{ fieldValues[field.name] ? 'Ja' : 'Nein' }}
        </button>

        <!-- Select -->
        <select
          v-else-if="field.type === 'select'"
          class="flex-1 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200 min-w-0"
          :value="fieldValues[field.name]"
          @change="onSelectChange(field.name, $event.target.value)"
        >
          <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <!-- Number -->
        <input
          v-else-if="field.type === 'number'"
          type="number"
          class="flex-1 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200 min-w-0 font-mono"
          :value="fieldValues[field.name]"
          :step="field.step ?? 1"
          @blur="onInputBlur(field.name, $event.target.value)"
          @keydown.enter="$event.target.blur()"
        />

        <!-- String / fallback -->
        <input
          v-else
          type="text"
          class="flex-1 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200 min-w-0"
          :value="fieldValues[field.name]"
          @blur="onInputBlur(field.name, $event.target.value)"
          @keydown.enter="$event.target.blur()"
        />
      </div>
    </div>

    <!-- No editable fields -->
    <div v-else class="text-xs text-slate-500 py-1">Keine editierbaren Felder</div>

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
import { ref, reactive, onMounted } from 'vue';
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import apiService from '@/services/apiService';
import { useSequenceNewStore } from '@/store/sequenceNewStore';
import { excludedKeys } from '@/utils/sequenceConfig';

const props = defineProps({
  item: { type: Object, required: true },
});

const store       = useSequenceNewStore();
const loadingMeta = ref(true);
const saving      = ref(false);
const fields      = ref([]);
const fieldValues = reactive({});

// Determine input type from a metadata property entry or the raw value
function inferType(key, metaProp, rawValue) {
  // Use metadata type hint if available
  if (metaProp) {
    const t = (metaProp.Type ?? metaProp.type ?? '').toLowerCase();
    if (t.includes('bool'))   return 'boolean';
    if (t.includes('int') || t.includes('double') || t.includes('float') || t.includes('decimal')) return 'number';
    if (metaProp.Options || metaProp.options) return 'select';
  }
  // Fallback: infer from raw value
  if (typeof rawValue === 'boolean') return 'boolean';
  if (typeof rawValue === 'number')  return 'number';
  return 'string';
}

function buildLabel(key) {
  // CamelCase → "Camel Case"
  return key.replace(/([A-Z])/g, ' $1').trim();
}

onMounted(async () => {
  // Seed fieldValues from current item data
  for (const [k, v] of Object.entries(props.item)) {
    if (!excludedKeys.has(k) && v !== null && v !== undefined && typeof v !== 'object') {
      fieldValues[k] = v;
    }
  }

  try {
    const meta = await apiService.fetchSequenceMetadata(props.item.Id);
    const metaObj = meta?.Data ?? meta ?? {};

    // metaObj is expected to be a dict of propertyName → { Type, Options, ... }
    const entries = Object.entries(metaObj).filter(([k]) => !excludedKeys.has(k) && !k.endsWith('Expression') && !k.endsWith('Definition'));

    for (const [key, propMeta] of entries) {
      const rawValue = props.item[key];
      if (rawValue === null || rawValue === undefined || typeof rawValue === 'object') continue;

      const type = inferType(key, propMeta, rawValue);
      const fieldDef = { name: key, label: buildLabel(key), type };

      if (type === 'select') {
        const opts = propMeta.Options ?? propMeta.options ?? [];
        fieldDef.options = Array.isArray(opts)
          ? opts.map((o) => (typeof o === 'object' ? { value: o.Value ?? o.value, label: o.Name ?? o.Label ?? o.value } : { value: o, label: String(o) }))
          : Object.entries(opts).map(([v, l]) => ({ value: v, label: l }));
      }
      if (type === 'number') {
        fieldDef.step = String(rawValue).includes('.') ? 0.1 : 1;
      }

      fields.value.push(fieldDef);
      if (!(key in fieldValues)) fieldValues[key] = rawValue;
    }

    // If metadata gave no fields, fall back to item props
    if (fields.value.length === 0) {
      for (const [k, v] of Object.entries(props.item)) {
        if (excludedKeys.has(k)) continue;
        if (k.endsWith('Expression') || k.endsWith('Definition')) continue;
        if (v === null || v === undefined || typeof v === 'object') continue;
        const type = inferType(k, null, v);
        fields.value.push({ name: k, label: buildLabel(k), type, step: type === 'number' && String(v).includes('.') ? 0.1 : 1 });
      }
    }
  } catch (e) {
    console.error('fetchSequenceMetadata:', e);
    // Fallback to item props
    for (const [k, v] of Object.entries(props.item)) {
      if (excludedKeys.has(k)) continue;
      if (k.endsWith('Expression') || k.endsWith('Definition')) continue;
      if (v === null || v === undefined || typeof v === 'object') continue;
      const type = inferType(k, null, v);
      fields.value.push({ name: k, label: buildLabel(k), type, step: type === 'number' && String(v).includes('.') ? 0.1 : 1 });
    }
  } finally {
    loadingMeta.value = false;
  }
});

async function save(key, value) {
  if (String(fieldValues[key]) === String(value)) return;
  fieldValues[key] = value;
  saving.value = true;
  await store.setProperty(props.item.Id, key, value);
  saving.value = false;
}

function onInputBlur(key, value) {
  save(key, value);
}

function onSelectChange(key, value) {
  save(key, value);
}

function toggleBool(key) {
  save(key, !fieldValues[key]);
}
</script>
