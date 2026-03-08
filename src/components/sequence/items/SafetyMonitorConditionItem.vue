<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs font-mono" :class="item.IsSafe ? 'text-emerald-400' : 'text-red-400'">
        {{ item.IsSafe ? '✓ Safe' : '✗ Unsafe' }}
      </span>
    </template>
  </ItemShell>
</template>

<script setup>
import ItemShell from './ItemShell.vue';

defineProps({
  item: { type: Object, required: true },
});
</script>
