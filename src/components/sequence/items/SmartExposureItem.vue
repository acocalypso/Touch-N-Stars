<template>
  <ItemShell :item="item">
    <template v-if="item.Iterations > 1" #summary>
      <span class="text-xs text-slate-400 font-mono">× {{ item.Iterations }}</span>
    </template>
  </ItemShell>
</template>

<script setup>
import ItemShell from './ItemShell.vue';

defineProps({
  item: { type: Object, required: true },
});
</script>
