<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400 font-mono">{{ item.RmsThreshold }}"</span>
    </template>

    <template #editor="{ save }">
      <NumberInputPicker
        :modelValue="item.RmsThreshold"
        :label="$t('components.sequence.items.interruptWhenRMSAbove.rmsThreshold')"
        labelKey="rms-threshold"
        :min="0"
        :max="100"
        :step="0.1"
        :decimalPlaces="1"
        @change="save('RmsThreshold', $event)"
      />

      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.interruptWhenRMSAbove.mode')
        }}</label>
        <select
          :value="item.Mode"
          class="ml-auto bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          @change="save('Mode', Number($event.target.value))"
        >
          <option :value="0">
            {{ $t('components.sequence.items.interruptWhenRMSAbove.modeRMS') }}
          </option>
          <option :value="1">
            {{ $t('components.sequence.items.interruptWhenRMSAbove.modePeak') }}
          </option>
        </select>
      </div>

      <NumberInputPicker
        v-if="item.Mode === 0"
        :modelValue="item.MinimumPoints"
        :label="$t('components.sequence.items.interruptWhenRMSAbove.minimumPoints')"
        labelKey="rms-minpoints"
        :min="1"
        :max="100"
        :step="1"
        @change="save('MinimumPoints', $event)"
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
