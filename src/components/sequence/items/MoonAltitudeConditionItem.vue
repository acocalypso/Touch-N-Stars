<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono">
        {{ comparatorLabel }} {{ item.Offset }}°
      </span>
      <span v-if="item.ExpectedTime" class="text-xs text-amber-400/80 font-mono ml-2">
        ⏱ {{ item.ExpectedTime }}
      </span>
    </template>

    <template #editor="{ save }">
      <!-- Comparator -->
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.moonAltitude.comparator')
        }}</label>
        <select
          :key="item.Data?.Comparator"
          class="ml-auto bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          @change="save('Data.Comparator', Number($event.target.value))"
        >
          <option value="1" :selected="item.Data?.Comparator === 1">
            {{ $t('components.sequence.items.moonAltitude.below') }}
          </option>
          <option value="3" :selected="item.Data?.Comparator === 3">
            {{ $t('components.sequence.items.moonAltitude.above') }}
          </option>
        </select>
      </div>

      <!-- Altitude Offset -->
      <NumberInputPicker
        :modelValue="item.Offset"
        :label="$t('components.sequence.items.moonAltitude.altitude')"
        labelKey="moonAlt-altitude"
        :min="-90"
        :max="90"
        :step="1"
        :decimalPlaces="1"
        @change="save('Offset', $event)"
      />
    </template>
  </ItemShell>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ItemShell from './ItemShell.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const { t } = useI18n();

const props = defineProps({
  item: { type: Object, required: true },
});

const comparatorLabel = computed(() =>
  props.item.Data?.Comparator === 1
    ? t('components.sequence.items.moonAltitude.below')
    : t('components.sequence.items.moonAltitude.above')
);
</script>
