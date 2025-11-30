<template>
  <NumberInputPicker
    v-model="settingsStore.flats.exposureTime"
    :label="$t('components.flatassistant.exposure_time')"
    labelKey="components.flatassistant.exposure_time"
    :min="0"
    :max="9999"
    :step="0.1"
    :decimalPlaces="3"
    inputId="exposure-time"
  />
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const settingsStore = useSettingsStore();
</script>
