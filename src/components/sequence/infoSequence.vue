<template>
  <div class="space-y-4">
    <!-- Subtle Actions Bar -->
    <div class="mb-3 flex justify-end">
      <div class="flex items-center gap-1">
        <button
          @click="expandAll"
          class="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 rounded transition-colors"
        >
          {{ $t('components.sequence.expandAll') }}
        </button>
        <div class="w-px h-3 bg-gray-700"></div>
        <button
          @click="collapseAll"
          class="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 rounded transition-colors"
        >
          {{ $t('components.sequence.collapseAll') }}
        </button>
      </div>
    </div>

    <!-- Global Triggers Container - Only show if we have valid global triggers -->
    <div
      v-if="globalTriggers.length > 0"
      class="bg-gray-900/70 backdrop-blur-sm rounded-lg mb-3 border border-gray-800/60"
    >
      <div class="flex items-center justify-between p-3 border-b border-gray-700/60">
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
            <div class="w-2 h-2 bg-purple-400 rounded-full shadow-purple-400/50 shadow-sm"></div>
            <h2 class="font-medium text-lg text-purple-200">Global Trigger</h2>
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
      <div class="flex items-center justify-between p-3 border-b border-gray-700/60">
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
            <h2 class="font-medium text-lg text-gray-100">{{ container.Name }}</h2>
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
      return 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-emerald-400/20 shadow-sm';
    case 'RUNNING':
      return 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-cyan-400/20 shadow-sm';
    case 'CREATED':
      return 'bg-amber-500/30 text-amber-200 border border-amber-400/50 shadow-amber-400/20 shadow-sm';
    case 'SKIPPED':
      return 'bg-gray-500/30 text-gray-300 border border-gray-400/50';
    default:
      return 'bg-gray-600/30 text-gray-300 border border-gray-500/50';
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
