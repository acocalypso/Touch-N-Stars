<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 flex-shrink-0">{{ modeLabel }}</span>
    </template>

    <template #editor="{ save }">
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.setReadoutMode.mode')
        }}</label>
        <select
          class="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          :value="item.Mode"
          @change="save('Mode', Number($event.target.value))"
        >
          <option v-for="(name, index) in readoutModes" :key="index" :value="index">
            {{ name }}
          </option>
        </select>
      </div>
    </template>
  </ItemShell>
</template>

<script setup>
import { computed } from 'vue';
import { apiStore } from '@/store/store';
import ItemShell from './ItemShell.vue';

const props = defineProps({
  item: { type: Object, required: true },
});

const store = apiStore();

const readoutModes = computed(() => store.cameraInfo?.ReadoutModes ?? []);

const modeLabel = computed(() => readoutModes.value[props.item.Mode] ?? `Mode ${props.item.Mode}`);
</script>
