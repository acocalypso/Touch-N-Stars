<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono">{{ item.SelectedDevice }}</span>
    </template>

    <template #editor="{ save }">
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.reconnect.device')
        }}</label>
        <select
          :key="item.SelectedDevice"
          class="ml-auto bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          @change="save('SelectedDevice', $event.target.value)"
        >
          <option v-for="d in devices" :key="d" :value="d" :selected="item.SelectedDevice === d">
            {{ d }}
          </option>
        </select>
      </div>
    </template>
  </ItemShell>
</template>

<script setup>
import ItemShell from './ItemShell.vue';

defineProps({
  item: { type: Object, required: true },
});

const devices = [
  'Camera',
  'Filter Wheel',
  'Focuser',
  'Rotator',
  'Mount',
  'Guider',
  'Switch',
  'Flat Panel',
  'Weather',
  'Dome',
  'Safety Monitor',
];
</script>
