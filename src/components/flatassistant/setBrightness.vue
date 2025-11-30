<template>
  <NumberInputPicker
    v-model="settingsStore.flats.brightness"
    :label="$t('components.flatassistant.brightness')"
    labelKey="components.flatassistant.brightness"
    :min="0"
    :max="100"
    :step="1"
    :decimalPlaces="0"
    inputId="brightness"
  />
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const settingsStore = useSettingsStore();
</script>
