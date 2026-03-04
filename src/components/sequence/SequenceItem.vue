<template>
  <div class="rounded-lg border transition-colors duration-200" :class="borderClass">

    <!-- Item header row -->
    <div class="flex items-center gap-1.5 px-2 py-2">

      <!-- Drag handle -->
      <span
        class="drag-handle flex-shrink-0 cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400 transition-colors touch-none"
        title="Verschieben"
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 2a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zm-6 6a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zm-6 6a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z"/>
        </svg>
      </span>

      <!-- Collapse chevron -->
      <button
        v-if="hasChildren"
        class="flex-shrink-0 p-0.5 rounded hover:bg-slate-600/40 transition-colors"
        @click.stop="collapsed = !collapsed"
      >
        <ChevronRightIcon
          class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"
          :class="{ 'rotate-90': !collapsed }"
        />
      </button>
      <span v-else class="w-4 flex-shrink-0" />

      <!-- Name -->
      <span class="text-sm font-medium text-gray-200 truncate flex-1 min-w-0">{{ item.Name }}</span>

      <!-- Issues badge -->
      <span
        v-if="item.Issues && item.Issues.length"
        class="flex-shrink-0 flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full px-1.5 py-0.5 text-xs"
        :title="item.Issues.join('\n')"
      >
        <ExclamationTriangleIcon class="w-3 h-3" />
        {{ item.Issues.length }}
      </span>

      <!-- Status badge – hide for CREATED -->
      <span
        v-if="item.Status !== 'CREATED'"
        class="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
        :class="statusColor(item.Status)"
      >
        {{ item.Status }}
      </span>

      <!-- Edit button -->
      <button
        class="flex-shrink-0 p-1 rounded hover:bg-slate-600/40 transition-colors"
        :class="editing ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'"
        title="Bearbeiten"
        @click.stop="editing = !editing"
      >
        <PencilSquareIcon class="w-4 h-4" />
      </button>

      <!-- More menu -->
      <div class="relative flex-shrink-0" ref="moreRef">
        <button
          class="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-600/40 transition-colors"
          title="Mehr"
          @click.stop="moreOpen = !moreOpen"
        >
          <EllipsisVerticalIcon class="w-4 h-4" />
        </button>
        <div
          v-if="moreOpen"
          class="absolute right-0 top-full mt-1 z-30 bg-gray-800 border border-slate-600 rounded-lg shadow-xl py-1 min-w-max"
          @click.stop
        >
          <button class="menu-item" @click="doAction('duplicate')">
            <DocumentDuplicateIcon class="w-4 h-4" /> Duplizieren
          </button>
          <button class="menu-item" @click="doAction('toggle-enable')">
            <component :is="item.Status === 'DISABLED' ? PlayCircleIcon : PauseCircleIcon" class="w-4 h-4" />
            {{ item.Status === 'DISABLED' ? 'Aktivieren' : 'Deaktivieren' }}
          </button>
          <button class="menu-item" @click="doAction('reset')">
            <ArrowPathIcon class="w-4 h-4" /> Status zurücksetzen
          </button>
          <div class="border-t border-slate-700 my-1" />
          <button class="menu-item text-red-400 hover:text-red-300 hover:bg-red-900/20" @click="doAction('remove')">
            <TrashIcon class="w-4 h-4" /> Löschen
          </button>
        </div>
      </div>
    </div>

    <!-- Inline edit panel -->
    <SequenceItemEditPanel
      v-if="editing"
      :item="item"
      class="border-t border-slate-700/50 mx-2 mb-2"
    />


    <!-- Children with nested draggable -->
    <div v-if="!collapsed && hasChildren" class="px-2 pb-2">
      <!-- Target info for DSO container -->
      <div
        v-if="item.Target && item.Target.TargetName"
        class="mb-1.5 px-2 py-1 bg-slate-700/40 rounded text-xs text-slate-300 flex items-center gap-1"
      >
        <svg class="w-3 h-3 text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="10" cy="10" r="7"/>
          <circle cx="10" cy="10" r="2" fill="currentColor" stroke="none"/>
        </svg>
        {{ item.Target.TargetName }}
      </div>

      <!-- Triggers -->
      <div v-if="item.Triggers && item.Triggers.length" class="mb-1.5 space-y-1">
        <div class="text-xs text-purple-400/70 px-1">Triggers</div>
        <SequenceItem
          v-for="trigger in item.Triggers"
          :key="trigger.Id"
          :item="trigger"
          :siblings="item.Triggers"
          class="border-purple-600/30"
        />
      </div>

      <!-- Conditions -->
      <div v-if="item.Conditions && item.Conditions.length" class="mb-1.5 space-y-1">
        <div class="text-xs text-amber-400/70 px-1">Conditions</div>
        <SequenceItem
          v-for="cond in item.Conditions"
          :key="cond.Id"
          :item="cond"
          :siblings="item.Conditions"
          class="border-amber-600/30"
        />
      </div>

      <draggable
        :list="item.Items"
        item-key="Id"
        handle=".drag-handle"
        ghost-class="opacity-30"
        class="space-y-1.5"
        @end="(evt) => onChildDragEnd(evt)"
      >
        <template #item="{ element }">
          <SequenceItem :item="element" :siblings="item.Items" />
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import draggable from 'vuedraggable';
import {
  ChevronRightIcon,
  PencilSquareIcon,
  EllipsisVerticalIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ArrowPathIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';
import { useSequenceNewStore } from '@/store/sequenceNewStore';
import SequenceItemEditPanel from './SequenceItemEditPanel.vue';

const props = defineProps({
  item:     { type: Object,  required: true },
  siblings: { type: Array,   default: () => [] },
});

const store   = useSequenceNewStore();
const collapsed = ref(false);
const editing   = ref(false);
const moreOpen  = ref(false);
const moreRef   = ref(null);

const hasChildren = computed(() => props.item.Items && props.item.Items.length > 0);

function statusColor(status) {
  switch (status) {
    case 'FINISHED': return 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50';
    case 'RUNNING':  return 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50';
    case 'CREATED':  return 'bg-amber-500/30 text-amber-200 border border-amber-400/50';
    case 'SKIPPED':  return 'bg-gray-500/30 text-gray-300 border border-gray-400/50';
    case 'DISABLED': return 'bg-gray-700/50 text-gray-500 border border-gray-600/50';
    default:         return 'bg-gray-600/30 text-gray-300 border border-gray-500/50';
  }
}

const borderClass = computed(() => {
  const s = props.item.Status;
  if (s === 'RUNNING')  return 'border-cyan-600/40 bg-cyan-950/20';
  if (s === 'FINISHED') return 'border-emerald-600/30 bg-emerald-950/10';
  if (s === 'DISABLED') return 'border-slate-700/30 bg-slate-900/20 opacity-60';
  return 'border-slate-600/30 bg-slate-800/30';
});

async function doAction(action) {
  moreOpen.value = false;
  const id = props.item.Id;
  if (!id) return;
  if (action === 'duplicate')     await store.duplicate(id);
  if (action === 'toggle-enable') await store.enable(id, props.item.Status === 'DISABLED');
  if (action === 'reset')         await store.resetStatus(id);
  if (action === 'remove')        await store.remove(id);
}

function onChildDragEnd(evt) {
  if (evt.oldIndex === evt.newIndex) return;
  const siblings = props.item.Items;
  const movedId  = siblings[evt.newIndex].Id;
  const newIdx   = evt.newIndex;
  if (newIdx === 0) {
    store.move(movedId, siblings[1]?.Id, false);
  } else {
    store.move(movedId, siblings[newIdx - 1]?.Id, true);
  }
}

// Close more-menu when clicking outside
function onOutsideClick(e) {
  if (moreRef.value && !moreRef.value.contains(e.target)) {
    moreOpen.value = false;
  }
}
onMounted(() => document.addEventListener('click', onOutsideClick));
onUnmounted(() => document.removeEventListener('click', onOutsideClick));
</script>

<style scoped>
.menu-item {
  @apply flex items-center gap-2 w-full px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700/60 transition-colors;
}
</style>
