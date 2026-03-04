<template>
  <div class="space-y-3">
    <!-- Loading state -->
    <div v-if="!store.loaded" class="text-center py-12 text-slate-400">
      <svg class="w-8 h-8 mx-auto mb-2 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      Sequenz wird geladen...
    </div>

    <template v-else>
      <!-- Global Triggers -->
      <div
        v-if="store.globalTriggers.length"
        class="bg-slate-800/60 backdrop-blur-sm border border-purple-600/30 rounded-lg shadow-lg"
      >
        <div
          class="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/30 rounded-t-lg"
          @click="toggleSection('globalTriggers')"
        >
          <div class="flex items-center gap-2">
            <ChevronRight class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="{ 'rotate-90': !collapsed.globalTriggers }" />
            <div class="w-2 h-2 bg-purple-400 rounded-full shadow-sm shadow-purple-400/50" />
            <span class="font-medium text-purple-200">Global Trigger</span>
          </div>
          <span class="bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full px-2 py-0.5 text-xs">
            GLOBAL
          </span>
        </div>
        <div v-if="!collapsed.globalTriggers" class="p-3 pt-0 space-y-1.5">
          <SequenceItem
            v-for="trigger in store.globalTriggers"
            :key="trigger.Id"
            :item="trigger"
          />
        </div>
      </div>

      <!-- Start / Targets / End containers -->
      <div
        v-for="(container, idx) in store.containers"
        :key="container.Id ?? idx"
        class="bg-slate-800/60 backdrop-blur-sm border border-slate-600/50 rounded-lg shadow-lg"
      >
        <div
          class="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/30 rounded-t-lg"
          @click="toggleSection(container.Id ?? idx)"
        >
          <div class="flex items-center gap-2">
            <ChevronRight
              class="w-4 h-4 text-slate-400 transition-transform duration-200"
              :class="{ 'rotate-90': !collapsed[container.Id ?? idx] }"
            />
            <div class="w-2 h-2 rounded-full" :class="containerDot(idx)" />
            <span class="font-medium text-gray-100">{{ container.Name }}</span>
          </div>
          <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="statusColor(container.Status)">
            {{ container.Status }}
          </span>
        </div>

        <div v-if="!collapsed[container.Id ?? idx]" class="p-3 pt-0 space-y-1.5">
          <template v-if="container.Items && container.Items.length">
            <SequenceItem
              v-for="item in container.Items"
              :key="item.Id"
              :item="item"
            />
          </template>
          <div v-else class="text-center py-6 text-slate-500 text-sm">
            Keine Elemente
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { reactive, onMounted, onUnmounted } from 'vue';
import { ChevronRightIcon as ChevronRight } from '@heroicons/vue/24/outline';
import { useSequenceNewStore } from '@/store/sequenceNewStore';
import SequenceItem from './SequenceItem.vue';

const store = useSequenceNewStore();

const collapsed = reactive({
  globalTriggers: false,
});

function toggleSection(key) {
  collapsed[key] = !collapsed[key];
}

function statusColor(status) {
  switch (status) {
    case 'FINISHED': return 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50';
    case 'RUNNING':  return 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50';
    case 'CREATED':  return 'bg-amber-500/30 text-amber-200 border border-amber-400/50';
    case 'SKIPPED':  return 'bg-gray-500/30 text-gray-300 border border-gray-400/50';
    default:         return 'bg-gray-600/30 text-gray-300 border border-gray-500/50';
  }
}

const DOT_COLORS = ['bg-blue-400', 'bg-green-400', 'bg-orange-400', 'bg-purple-400'];
function containerDot(idx) {
  return DOT_COLORS[idx] ?? 'bg-slate-400';
}

onMounted(() => store.startPolling());
onUnmounted(() => store.stopPolling());
</script>
