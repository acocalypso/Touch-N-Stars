<template>
  <ItemShell :item="item">
    <template #summary>
      <span class="text-xs text-slate-400">{{ trackingLabel }}</span>
    </template>

    <template #editor="{ save }">
      <div class="flex items-center gap-3">
        <label class="text-xs text-slate-400 flex-shrink-0">{{
          $t('components.sequence.items.setTracking.trackingMode')
        }}</label>
        <select
          class="ml-auto w-36 md:w-40 bg-slate-700/60 border border-slate-600 rounded px-2 py-1 text-xs text-gray-200"
          :value="item.TrackingMode"
          @change="save('TrackingMode', Number($event.target.value))"
        >
          <option :value="0">Sidereal</option>
          <option :value="1">Lunar</option>
          <option :value="2">Solar</option>
          <option :value="3">King</option>
          <option :value="4">Custom</option>
          <option :value="5">Stopped</option>
        </select>
      </div>
    </template>
  </ItemShell>
</template>

<script setup>
import { computed } from 'vue';
import ItemShell from './ItemShell.vue';

const props = defineProps({
  item: { type: Object, required: true },
});

const TRACKING_MODES = ['Sidereal', 'Lunar', 'Solar', 'King', 'Custom', 'Stopped'];

const trackingLabel = computed(
  () => TRACKING_MODES[props.item.TrackingMode] ?? props.item.TrackingMode
);
</script>
