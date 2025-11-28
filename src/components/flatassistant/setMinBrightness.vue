<template>
  <NumberInputPicker
    v-model="settingsStore.flats.minBrightness"
    :label="$t('components.flatassistant.min_brightness')"
    labelKey="components.flatassistant.min_brightness"
    :min="0"
    :max="100"
    :step="1"
    :decimalPlaces="0"
    inputId="min-brightness"
  />
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const settingsStore = useSettingsStore();
</script>
