<template>
  <ItemShell :item="item">
    <template #summary>
      <span v-if="item.SelectedProvider" class="text-xs text-slate-300 font-mono">
        {{ item.SelectedProvider.Name }}
      </span>
      <span class="text-xs text-slate-400 font-mono ml-2">
        {{ pad(item.Hours) }}:{{ pad(item.Minutes) }}:{{ pad(item.Seconds) }}
      </span>
    </template>

    <template #editor="{ save }">
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-400">{{
          $t('components.sequence.items.timeCondition.provider')
        }}</span>
        <select
          class="ml-auto w-48 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          :value="item.SelectedProvider?.FullTypeName"
          @change="save('SelectedProvider', $event.target.value)"
        >
          <option v-for="p in providers" :key="p.FullTypeName" :value="p.FullTypeName">
            {{ p.Name }}
          </option>
        </select>
      </div>
      <div class="text-xs text-slate-400 font-medium">
        {{ $t('components.sequence.items.expressionVariable.time') }}
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-1">
        <NumberInputPicker
          :modelValue="item.Hours"
          label="h"
          labelKey="waittime-h"
          :min="0"
          :max="23"
          :step="1"
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
import { ref, onMounted } from 'vue';
import ItemShell from './ItemShell.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import apiService from '@/services/apiService';

defineProps({
  item: { type: Object, required: true },
});

const providers = ref([]);

onMounted(async () => {
  try {
    const response = await apiService.getDateTimeProviders();
    if (response?.Items) providers.value = response.Items;
  } catch {
    // ignore
  }
});

function pad(v) {
  return String(v ?? 0).padStart(2, '0');
}
</script>
