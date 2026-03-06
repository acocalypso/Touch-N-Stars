<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono truncate">{{ item.PredicateDefinition || item.Predicate }}</span>
    </template>

    <template #editor="{ save }">
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.waitUntil.predicate')
        }}</label>
        <input
          type="text"
          class="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          :value="item.PredicateDefinition"
          @change="save('PredicateDefinition', $event.target.value)"
        />
      </div>
    </template>
  </ItemShell>
</template>

<script setup>
import ItemShell from './ItemShell.vue';

defineProps({
  item: { type: Object, required: true },
});
</script>
