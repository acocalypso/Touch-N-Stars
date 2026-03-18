<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono">
        +{{ item.Amount }}% /
        {{ $t('components.sequence.items.autofocus.samples', { n: item.SampleSize }) }}
      </span>
    </template>

    <template #editor="{ save }">
      <NumberInputPicker
        :modelValue="item.Amount"
        :label="$t('components.sequence.items.autofocus.hfrIncrease')"
        labelKey="af-hfr-amount"
        :min="1"
        :max="100"
        :step="1"
        :decimalPlaces="0"
        @change="save('Amount', $event)"
      />
      <NumberInputPicker
        :modelValue="item.SampleSize"
        :label="$t('components.sequence.items.autofocus.sampleSize')"
        labelKey="af-hfr-sample"
        :min="1"
        :max="100"
        :step="1"
        @change="save('SampleSize', $event)"
      />
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400">{{
          $t('components.sequence.items.autofocus.trendPerFilter')
        }}</label>
        <button
          class="ml-auto px-3 py-1 rounded text-xs font-medium border transition-colors"
          :class="
            item.TrendPerFilter
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
              : 'bg-slate-700/60 text-slate-400 border-slate-600 hover:bg-slate-700'
          "
          @click="save('TrendPerFilter', !item.TrendPerFilter)"
        >
          {{
            item.TrendPerFilter
              ? $t('components.sequence.items.on')
              : $t('components.sequence.items.off')
          }}
        </button>
      </div>
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
