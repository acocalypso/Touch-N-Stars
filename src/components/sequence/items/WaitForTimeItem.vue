<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono">
        {{ String(item.Hours).padStart(2, '0') }}:{{ String(item.Minutes).padStart(2, '0') }}:{{
          String(item.Seconds).padStart(2, '0')
        }}
      </span>
    </template>

    <template #editor="{ save }">
      <div class="text-xs text-slate-400 font-medium">
        {{ $t('components.sequence.items.expressionVariable.time') }}
      </div>
      <div class="grid grid-cols-3 gap-1">
        <NumberInputPicker
          :modelValue="item.Hours"
          label="h"
          labelKey="waittime-h"
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
          labelKey="waittime-m"
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
          labelKey="waittime-s"
          :min="0"
          :max="59"
          :step="1"
          labelPosition="top"
          wrapperClass="w-full"
          @change="save('Seconds', $event)"
        />
      </div>

      <NumberInputPicker
        :modelValue="item.MinutesOffset"
        :label="$t('components.sequence.items.expressionVariable.minutesOffset')"
        labelKey="waittime-offset"
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

defineProps({
  item: { type: Object, required: true },
});
</script>
