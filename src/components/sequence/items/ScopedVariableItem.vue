<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono truncate">{{ item.Identifier }}</span>
      <span v-if="item.OriginalDefinition" class="text-xs text-slate-500 font-mono truncate"
        >= {{ item.OriginalDefinition }}</span
      >
    </template>

    <template #editor="{ save }">
      <!-- Name -->
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.expressionVariable.identifier')
        }}</label>
        <TextInput
          :modelValue="item.Identifier"
          inputClass="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          @change="save('Identifier', $event)"
        />
      </div>

      <!-- Initially -->
      <NumberInputPicker
        :modelValue="Number(item.OriginalDefinition)"
        :label="$t('components.sequence.items.expressionVariable.initially')"
        labelKey="scopedvar-initial"
        :min="-999999"
        :max="999999"
        :step="1"
        :decimalPlaces="2"
        @change="save('OriginalDefinition', String($event))"
      />
    </template>
  </ItemShell>
</template>

<script setup>
import ItemShell from './ItemShell.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import TextInput from '@/components/helpers/TextInput.vue';

defineProps({
  item: { type: Object, required: true },
});
</script>
