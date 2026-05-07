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
          <option :value="0">{{ $t('components.sequence.items.setTracking.sidereal') }}</option>
          <option :value="1">{{ $t('components.sequence.items.setTracking.lunar') }}</option>
          <option :value="2">{{ $t('components.sequence.items.setTracking.solar') }}</option>
          <option :value="3">{{ $t('components.sequence.items.setTracking.king') }}</option>
          <option :value="4">{{ $t('components.sequence.items.setTracking.custom') }}</option>
          <option :value="5">{{ $t('components.sequence.items.setTracking.stopped') }}</option>
        </select>
      </div>
    </template>
  </ItemShell>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ItemShell from './ItemShell.vue';

const { t } = useI18n();

const props = defineProps({
  item: { type: Object, required: true },
});

const TRACKING_MODE_KEYS = ['sidereal', 'lunar', 'solar', 'king', 'custom', 'stopped'];

const trackingLabel = computed(() => {
  const key = TRACKING_MODE_KEYS[props.item.TrackingMode];
  return key ? t(`components.sequence.items.setTracking.${key}`) : String(props.item.TrackingMode);
});
</script>
