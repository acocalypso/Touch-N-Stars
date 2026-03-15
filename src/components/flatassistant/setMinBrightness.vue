<template>
  <NumberInputPicker
    v-model="settingsStore.flats.minBrightness"
    :label="$t('components.flatassistant.min_brightness')"
    labelKey="components.flatassistant.min_brightness"
    :min="store.flatdeviceInfo?.MinBrightness || 0"
    :max="store.flatdeviceInfo?.MaxBrightness || 65535"
    :step="1"
    :decimalPlaces="0"
    inputId="min-brightness"
  />
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const settingsStore = useSettingsStore();
const store = apiStore();
</script>
