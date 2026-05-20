<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono truncate">
        {{ item.PredicateDefinition || '—' }}
      </span>
    </template>

    <template #editor="{ save }">
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.loopWhile.expression')
        }}</label>
        <input
          type="text"
          class="ml-auto flex-1 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200 font-mono"
          :value="item.PredicateDefinition"
          @blur="save('PredicateDefinition', $event.target.value)"
          @keydown.enter="$event.target.blur()"
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
