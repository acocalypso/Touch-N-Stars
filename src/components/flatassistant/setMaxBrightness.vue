<template>
  <NumberInputPicker
    v-model="settingsStore.flats.maxBrightness"
    :label="$t('components.flatassistant.max_brightness')"
    labelKey="components.flatassistant.max_brightness"
    :min="store.flatdeviceInfo?.MinBrightness || 0"
    :max="store.flatdeviceInfo?.MaxBrightness || 65535"
    :step="1"
    :decimalPlaces="0"
    inputId="max-brightness"
  />
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
const store = apiStore();

const settingsStore = useSettingsStore();
</script>
