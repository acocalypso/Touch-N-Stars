<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono">{{ item.AfterExposures }}</span>
    </template>

    <template #editor="{ save }">
      <NumberInputPicker
        :modelValue="item.AfterExposures"
        label="Nach Aufnahmen"
        labelKey="dither-afterExposures"
        :min="0" :max="999" :step="1"
        @change="save('AfterExposures', $event)"
      />
    </template>
  </ItemShell>
</template>

<script setup>
import ItemShell from './ItemShell.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

defineProps({
  item: { type: Object, required: true },
});
</script>
