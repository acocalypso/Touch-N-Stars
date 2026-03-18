<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono truncate">{{ item.Variable }}</span>
      <span class="text-xs text-slate-500 font-mono">{{ item.TimeString }}</span>
    </template>

    <template #editor="{ save }">
      <!-- Variable name -->
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.expressionVariable.identifier')
        }}</label>
        <TextInput
          :modelValue="item.Variable"
          inputClass="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          @change="save('Variable', $event)"
        />
      </div>

      <!-- Time -->
      <div class="text-xs text-slate-400 font-medium">
        {{ $t('components.sequence.items.expressionVariable.time') }}
      </div>
      <div class="grid grid-cols-3 gap-1">
        <NumberInputPicker
          :modelValue="item.Hours"
          label="h"
          labelKey="resetdate-h"
          :min="0"
          :max="23"
          :step="1"
          labelPosition="top"
          wrapperClass="w-full"
          @change="save('Hours', $event)"
        />
        <NumberInputPicker
          :modelValue="item.Minutes"
          label="m"
          labelKey="resetdate-m"
          :min="0"
          :max="59"
          :step="1"
          labelPosition="top"
          wrapperClass="w-full"
          @change="save('Minutes', $event)"
        />
        <NumberInputPicker
          :modelValue="item.Seconds"
          label="s"
          labelKey="resetdate-s"
          :min="0"
          :max="59"
          :step="1"
          labelPosition="top"
          wrapperClass="w-full"
          @change="save('Seconds', $event)"
        />
      </div>

      <!-- Offset -->
      <NumberInputPicker
        :modelValue="item.MinutesOffset"
        :label="$t('components.sequence.items.expressionVariable.minutesOffset')"
        labelKey="resetdate-offset"
        :min="-1440"
        :max="1440"
        :step="1"
        :decimalPlaces="0"
        @change="save('MinutesOffset', $event)"
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
