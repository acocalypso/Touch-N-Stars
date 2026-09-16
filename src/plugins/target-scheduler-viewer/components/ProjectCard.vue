<script setup>
import { ref } from 'vue';
import TargetCard from './TargetCard.vue';
import { targetSchedulerApi } from '../services/targetSchedulerApi';

const props = defineProps({
  project: { type: Object, required: true },
});

const expanded = ref(false);
const targets = ref(null);
const loading = ref(false);
const error = ref('');

async function toggle() {
  expanded.value = !expanded.value;
  if (expanded.value && !targets.value) {
    loading.value = true;
    error.value = '';
    try {
      targets.value = await targetSchedulerApi.getTargets(props.project.Id);
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }
}

const stateColor = {
  Active: 'bg-green-600',
  Inactive: 'bg-gray-600',
  Completed: 'bg-blue-600',
};
</script>

<template>
  <div class="rounded-lg border border-gray-700 bg-gray-900">
    <button
      class="flex w-full items-center justify-between gap-2 p-3 text-left"
      @click="toggle"
    >
      <div class="flex items-center gap-2">
        <span
          class="rounded px-1.5 py-0.5 text-[10px] uppercase text-white"
          :class="stateColor[project.State] || 'bg-gray-600'"
        >
          {{ project.State }}
        </span>
        <span class="font-semibold">{{ project.Name }}</span>
        <span class="text-[11px] text-gray-400">priority {{ project.Priority }}</span>
      </div>
      <span class="text-gray-400">{{ expanded ? '▲' : '▼' }}</span>
    </button>

    <div v-if="expanded" class="space-y-2 border-t border-gray-700 p-3">
      <div v-if="loading" class="text-sm text-gray-400">Loading targets…</div>
      <div v-else-if="error" class="text-sm text-red-400">{{ error }}</div>
      <div v-else-if="!targets.length" class="text-sm text-gray-500">No targets in this project.</div>
      <TargetCard v-for="target in targets" :key="target.Id" :target="target" />
    </div>
  </div>
</template>
