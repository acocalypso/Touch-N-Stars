<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono">
        {{ comparatorLabel }} {{ item.UserMoonIllumination }}%
      </span>
      <span class="text-xs text-slate-500 font-mono ml-1">
        ({{ item.CurrentMoonIllumination?.toFixed(1) }}%)
      </span>
    </template>

    <template #editor="{ save }">
      <!-- Comparator -->
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.moonAltitude.comparator')
        }}</label>
        <select
          :key="comparatorValue"
          class="ml-auto bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          @change="save('Comparator', Number($event.target.value))"
        >
          <option value="1" :selected="comparatorValue === 1">
            {{ $t('components.sequence.items.moonAltitude.below') }}
          </option>
          <option value="3" :selected="comparatorValue === 3">
            {{ $t('components.sequence.items.moonAltitude.above') }}
          </option>
        </select>
      </div>

      <!-- Illumination -->
      <NumberInputPicker
        :modelValue="item.UserMoonIllumination"
        :label="$t('components.sequence.items.moonIllumination.illumination')"
        labelKey="moonIllum-value"
        :min="0"
        :max="100"
        :step="1"
        :decimalPlaces="0"
        @change="save('UserMoonIllumination', $event)"
      />
    </template>
  </ItemShell>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ItemShell from './ItemShell.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import { normalizeComparator } from '@/utils/sequenceUtils';

const { t } = useI18n();

const props = defineProps({
  item: { type: Object, required: true },
});

const comparatorValue = computed(() =>
  normalizeComparator(props.item.Comparator ?? props.item.Data?.Comparator)
);

const comparatorLabel = computed(() =>
  comparatorValue.value === 1
    ? t('components.sequence.items.moonAltitude.below')
    : t('components.sequence.items.moonAltitude.above')
);
</script>
