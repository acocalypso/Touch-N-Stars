<template>
  <div class="relative" ref="rootRef">
    <button
      class="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-600/40 transition-colors"
      :title="label"
      @click.stop="toggle"
    >
      <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <PlusIcon v-else class="w-4 h-4" />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        class="fixed z-[9999] bg-gray-800 border border-slate-600 rounded-lg shadow-xl w-64"
        :style="dropdownStyle"
        @click.stop
      >
        <!-- Search -->
        <div class="p-2 border-b border-slate-700">
          <input
            v-model="search"
            type="text"
            placeholder="Suchen…"
            class="w-full bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200 placeholder-slate-500 outline-none focus:border-cyan-500/50"
            @click.stop
          />
        </div>

        <!-- Type list -->
        <div class="max-h-64 overflow-y-auto py-1">
          <template v-if="filteredTypes.length">
            <template v-for="(group, cat) in grouped" :key="cat">
              <div class="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {{ cat }}
              </div>
              <button
                v-for="t in group"
                :key="t.FullTypeName"
                class="flex items-center w-full px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60 transition-colors text-left"
                @click="select(t)"
              >
                {{ t.Name }}
              </button>
            </template>
          </template>
          <div v-else class="px-3 py-3 text-xs text-slate-500 text-center">Keine Ergebnisse</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { PlusIcon } from '@heroicons/vue/24/outline';
import { useSequenceV2Store } from '@/store/sequenceV2Store';

const props = defineProps({
  targetId: { type: String, required: true },
  mode: { type: String, required: true }, // 'item' | 'trigger' | 'condition'
  insertAfter: { type: Boolean, default: true },
});

const store = useSequenceV2Store();
const open = ref(false);
const loading = ref(false);
const search = ref('');
const rootRef = ref(null);
const dropdownStyle = ref({});

const label = computed(
  () =>
    ({
      item: 'Item hinzufügen',
      trigger: 'Trigger hinzufügen',
      condition: 'Condition hinzufügen',
    })[props.mode] ?? 'Hinzufügen'
);

const types = computed(
  () =>
    ({
      item: store.availableItems,
      trigger: store.availableTriggers,
      condition: store.availableConditions,
    })[props.mode] ?? []
);

const filteredTypes = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return types.value;
  return types.value.filter((t) => t.Name?.toLowerCase().includes(q));
});

const grouped = computed(() => {
  const groups = {};
  for (const t of filteredTypes.value) {
    const cat = t.Category ?? 'Sonstige';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(t);
  }
  return groups;
});

function updateDropdownPosition() {
  if (!rootRef.value) return;
  const rect = rootRef.value.getBoundingClientRect();
  const dropdownWidth = 256; // w-64
  let left = rect.right - dropdownWidth;
  if (left < 4) left = 4;
  dropdownStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${left}px`,
  };
}

async function toggle() {
  if (open.value) {
    open.value = false;
    return;
  }
  loading.value = true;
  if (props.mode === 'item') await store.fetchAvailableItems();
  if (props.mode === 'trigger') await store.fetchAvailableTriggers();
  if (props.mode === 'condition') await store.fetchAvailableConditions();
  loading.value = false;
  search.value = '';
  updateDropdownPosition();
  open.value = true;
}

async function select(t) {
  open.value = false;
  if (props.mode === 'item') await store.addItem(props.targetId, t.FullTypeName, props.insertAfter);
  if (props.mode === 'trigger') await store.addTrigger(props.targetId, t.FullTypeName);
  if (props.mode === 'condition') await store.addCondition(props.targetId, t.FullTypeName);
}

function onOutsideClick(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) open.value = false;
}
onMounted(() => document.addEventListener('click', onOutsideClick));
onUnmounted(() => document.removeEventListener('click', onOutsideClick));
</script>
