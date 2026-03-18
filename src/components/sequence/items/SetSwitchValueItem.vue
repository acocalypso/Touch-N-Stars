<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 flex-shrink-0">{{ item.SelectedSwitch?.Name }}</span>
      <span class="text-xs text-slate-500 font-mono flex-shrink-0">{{ item.Value }}</span>
    </template>

    <template #editor="{ save }">
      <!-- Switch selection -->
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.setSwitchValue.switch')
        }}</label>
        <select
          class="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          :value="item.SwitchIndex"
          @change="save('SwitchIndex', Number($event.target.value))"
        >
          <option v-for="(sw, i) in item.WritableSwitches" :key="sw.Id" :value="i">
            {{ sw.Name }}
          </option>
        </select>
      </div>

      <!-- Value -->
      <NumberInputPicker
        :modelValue="item.Value"
        :label="$t('components.sequence.items.setSwitchValue.value')"
        labelKey="set-switch-value"
        :min="selectedSwitch?.Minimum ?? -Infinity"
        :max="selectedSwitch?.Maximum ?? Infinity"
        :step="selectedSwitch?.StepSize ?? 0.01"
        :decimalPlaces="2"
        @change="save('Value', $event)"
      />
    </template>
  </ItemShell>
</template>

<script setup>
import { computed } from 'vue';
import ItemShell from './ItemShell.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const props = defineProps({
  item: { type: Object, required: true },
});

const selectedSwitch = computed(() => {
  const switches = props.item.WritableSwitches;
  if (!switches) return null;
  return switches[props.item.SwitchIndex] ?? null;
});
</script>
