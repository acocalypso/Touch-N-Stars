<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono">
        {{ comparatorLabel }} {{ item.TargetAltitude }}°
      </span>
      <span
        v-if="item.ExpectedTime && item.ExpectedTime !== '00:00'"
        class="text-xs text-amber-400/80 font-mono"
        >⏱ {{ item.ExpectedTime }}</span
      >
    </template>

    <template #editor="{ save }">
      <!-- TargetAltitude -->
      <NumberInputPicker
        :modelValue="item.TargetAltitude ?? 0"
        :label="$t('components.sequence.items.altitudeCondition.altitude')"
        labelKey="orb-target-alt"
        :min="-90"
        :max="90"
        :step="1"
        :decimalPlaces="1"
        @change="save('TargetAltitude', $event)"
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
  props.item.Data?.Comparator === 1
    ? t('components.sequence.items.moonAltitude.below')
    : t('components.sequence.items.moonAltitude.above')
);
</script>
