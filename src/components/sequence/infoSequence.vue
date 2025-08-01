<template>
  <div class="space-y-4">
    <!-- Global Actions Bar -->
    <div
      class="mb-4 flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-slate-200">Sequence View</span>
        <div class="w-1 h-4 bg-slate-600"></div>
        <span class="text-xs text-slate-400"
          >Container</span
        >
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="expandAll"
          class="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors"
        >
          Alle erweitern
        </button>
        <button
          @click="collapseAll"
          class="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-md transition-colors"
        >
          Alle zuklappen
        </button>
      </div>
    </div>

    <!-- Global Triggers Container - Only show if we have valid global triggers -->
    <div
      v-if="globalTriggers.length > 0"
      class="bg-slate-800/60 backdrop-blur-sm border border-slate-600/50 rounded-lg mb-3 shadow-lg"
    >
      <div class="flex items-center justify-between p-3 border-b border-slate-700/50">
        <div class="flex items-center gap-3">
          <button
            @click="sequenceStore.toggleCollapsedState('GlobalTrigger')"
            class="p-1 rounded-md hover:bg-slate-700/50 transition-colors"
            :title="sequenceStore.isCollapsed('GlobalTrigger') ? 'Erweitern' : 'Zusammenklappen'"
          >
            <ChevronRightIcon
              class="w-4 h-4 text-slate-400 transition-transform duration-200"
              :class="{ 'rotate-90': !sequenceStore.isCollapsed('GlobalTrigger') }"
            />
          </button>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
            <h2 class="font-medium text-lg text-slate-100">Global Trigger</h2>
          </div>
        </div>
        <span
          class="bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium px-2 py-1 rounded-full text-xs"
        >
          GLOBAL
        </span>
      </div>

      <div
        v-if="!sequenceStore.isCollapsed('GlobalTrigger')"
        class="p-3 pt-0 overflow-hidden transition-all duration-200 ease-in-out"
      >
        <RecursiveItemState v-if="sequenceStore.sequenceIsEditable" :items="globalTriggers" />
        <RecursiveItemJson v-if="!sequenceStore.sequenceIsEditable" :items="globalTriggers" />
      </div>
    </div>

    <!-- Main Sequence Containers -->
    <div
      v-for="(container, containerIndex) in sequenceStore.sequenceInfo.slice(1)"
      :key="containerIndex"
      class="bg-slate-800/60 backdrop-blur-sm border border-slate-600/50 rounded-lg mb-3 shadow-lg transition-all duration-200 hover:shadow-xl"
    >
      <div class="flex items-center justify-between p-3 border-b border-slate-700/50">
        <div class="flex items-center gap-3">
          <button
            @click="sequenceStore.toggleCollapsedState(container.Name)"
            class="p-1 rounded-md hover:bg-slate-700/50 transition-colors"
            :title="sequenceStore.isCollapsed(container.Name) ? 'Erweitern' : 'Zusammenklappen'"
          >
            <ChevronRightIcon
              class="w-4 h-4 text-slate-400 transition-transform duration-200"
              :class="{ 'rotate-90': !sequenceStore.isCollapsed(container.Name) }"
            />
          </button>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full" :class="getContainerColor(containerIndex)"></div>
            <h2 class="font-medium text-lg text-slate-100">{{ container.Name }}</h2>
          </div>
        </div>
        <span
          :class="statusColor(container.Status)"
          class="font-medium px-2 py-1 rounded-full text-xs"
        >
          {{ container.Status }}
        </span>
      </div>

      <div
        v-if="!sequenceStore.isCollapsed(container.Name)"
        class="p-3 pt-0 overflow-hidden transition-all duration-200 ease-in-out"
      >
        <!-- Only show Items if they exist -->
        <div v-if="container.Items && container.Items.length">
          <RecursiveItemState
            v-if="sequenceStore.sequenceIsEditable"
            :items="container.Items"
            :containerIndex="containerIndex"
          />
          <RecursiveItemJson
            v-if="!sequenceStore.sequenceIsEditable"
            :items="container.Items"
            :containerIndex="containerIndex"
          />
        </div>
        <div v-else class="text-center py-6 text-slate-400 text-sm">
          <div class="w-8 h-8 mx-auto mb-2 opacity-50">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
          </div>
          Keine Items in diesem Container
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue';
import { useSequenceStore } from '@/store/sequenceStore';
import RecursiveItemState from '@/components/sequence/RecursiveItemState.vue';
import RecursiveItemJson from '@/components/sequence/RecursiveItemJson.vue';
import { ChevronRightIcon } from '@heroicons/vue/24/outline';

const sequenceStore = useSequenceStore();

const globalTriggers = computed(() => {
  // Find the first container with GlobalTriggers
  const containerWithTriggers = sequenceStore.sequenceInfo.find(
    (container) => container.GlobalTriggers && container.GlobalTriggers.length
  );
  return containerWithTriggers?.GlobalTriggers || [];
});

function statusColor(status) {
  switch (status) {
    case 'FINISHED':
      return 'bg-green-500/20 text-green-300 border border-green-500/30';
    case 'RUNNING':
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
    case 'CREATED':
      return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
    case 'SKIPPED':
      return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    default:
      return 'bg-slate-600/20 text-slate-300 border border-slate-600/30';
  }
}

function getContainerColor(index) {
  const colors = ['bg-blue-400', 'bg-green-400', 'bg-orange-400', 'bg-purple-400', 'bg-pink-400'];
  return colors[index] || 'bg-slate-400';
}

function expandAll() {
  const allPaths = getAllPaths();
  allPaths.forEach((path) => {
    sequenceStore.setCollapsedState(path, false);
  });
  // Also expand containers
  sequenceStore.sequenceInfo.forEach((container) => {
    if (container.Name) {
      sequenceStore.setCollapsedState(container.Name, false);
    }
  });
  sequenceStore.setCollapsedState('GlobalTrigger', false);
}

function collapseAll() {
  const allPaths = getAllPaths();
  allPaths.forEach((path) => {
    sequenceStore.setCollapsedState(path, true);
  });
  // Also collapse containers
  sequenceStore.sequenceInfo.forEach((container) => {
    if (container.Name) {
      sequenceStore.setCollapsedState(container.Name, true);
    }
  });
  sequenceStore.setCollapsedState('GlobalTrigger', true);
}

function getAllPaths() {
  const paths = [];

  function collectPaths(items) {
    if (!items) return;
    items.forEach((item) => {
      if (item._path) {
        paths.push(item._path);
      }
      if (item.Items) {
        collectPaths(item.Items);
      }
      if (item.Triggers) {
        item.Triggers.forEach((trigger) => {
          if (trigger._path) paths.push(trigger._path);
        });
      }
      if (item.Conditions) {
        item.Conditions.forEach((condition) => {
          if (condition._path) paths.push(condition._path);
        });
      }
    });
  }

  sequenceStore.sequenceInfo.forEach((container) => {
    if (container.Items) collectPaths(container.Items);
    if (container.GlobalTriggers) collectPaths(container.GlobalTriggers);
  });

  return paths;
}

onBeforeMount(async () => {
  await sequenceStore.getSequenceInfo();

  if (sequenceStore.sequenceInfo) {
    console.log('info', sequenceStore.sequenceInfo);
  }
});
</script>

<style scoped></style>
