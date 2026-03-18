<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 truncate">{{ item.Text }}</span>
    </template>

    <template #editor="{ save }">
      <div class="flex items-start gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0 mt-1">{{
          $t('components.sequence.items.annotation.text')
        }}</label>
        <TextAreaInput
          :modelValue="item.Text ?? ''"
          inputClass="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200 resize-none"
          :rows="3"
          @change="save('Text', $event)"
        />
      </div>
    </template>
  </ItemShell>
</template>

<script setup>
import ItemShell from './ItemShell.vue';
import TextAreaInput from '@/components/helpers/TextAreaInput.vue';

defineProps({
  item: { type: Object, required: true },
});
</script>
