<template>
  <NumberInputPicker
    v-model="settingsStore.flats.maxBrightness"
    :label="$t('components.flatassistant.max_brightness')"
    labelKey="components.flatassistant.max_brightness"
    :min="0"
    :max="100"
    :step="1"
    :decimalPlaces="0"
    inputId="max-brightness"
  />
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const settingsStore = useSettingsStore();
</script>
