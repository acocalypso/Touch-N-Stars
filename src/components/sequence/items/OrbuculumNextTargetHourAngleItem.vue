<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono">
        {{ comparatorLabel }} {{ item.NextTargetHourAngle }}h
      </span>
      <span v-if="item.ExpectedTimeStr" class="text-xs text-amber-400/80 font-mono"
        >⏱ {{ item.ExpectedTimeStr }}</span
      >
    </template>

    <template #editor="{ save }">
      <!-- Comparator -->
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.moonAltitude.comparator')
        }}</label>
        <select
          :key="item.Comparator"
          class="ml-auto bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          @change="save('Comparator', Number($event.target.value))"
        >
          <option value="1" :selected="item.Comparator === 1">
            {{ $t('components.sequence.items.moonAltitude.below') }}
          </option>
          <option value="3" :selected="item.Comparator === 3">
            {{ $t('components.sequence.items.moonAltitude.above') }}
          </option>
        </select>
      </div>

      <!-- NextTargetHourAngle -->
      <NumberInputPicker
        :modelValue="item.NextTargetHourAngle ?? 0"
        label="Stundenwinkel h"
        labelKey="orb-next-ha"
        :min="-12"
        :max="12"
        :step="0.1"
        :decimalPlaces="2"
        @change="save('NextTargetHourAngle', $event)"
      />

      <!-- Read-only status -->
      <div v-if="item.NextTargetName" class="text-xs text-slate-500">
        Nächstes Ziel: <span class="text-slate-300">{{ item.NextTargetName }}</span>
      </div>
    </template>
  </ItemShell>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ItemShell from './ItemShell.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const { t } = useI18n();

const props = defineProps({ item: { type: Object, required: true } });

const comparatorLabel = computed(() =>
  props.item.Comparator === 1
    ? t('components.sequence.items.moonAltitude.below')
    : t('components.sequence.items.moonAltitude.above')
);
</script>
