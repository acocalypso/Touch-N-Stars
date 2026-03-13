<template>
  <ItemShell :item="item">
    <template v-if="item.Iterations > 0" #summary>
      <span class="text-xs text-slate-400 font-mono">× {{ item.Iterations }}</span>
    </template>

    <template #editor="{ save }">
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{ $t('common.name') }}</label>
        <TextInput
          :modelValue="item.Name ?? ''"
          inputClass="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          @change="save('Name', $event)"
        />
      </div>
    </template>
  </ItemShell>
</template>

<script setup>
import ItemShell from './ItemShell.vue';
import TextInput from '@/components/helpers/TextInput.vue';

defineProps({
  item: { type: Object, required: true },
});
</script>
