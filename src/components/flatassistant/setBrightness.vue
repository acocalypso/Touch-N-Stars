<template>
  <NumberInputPicker
    v-model="settingsStore.flats.brightness"
    :label="$t('components.flatassistant.brightness')"
    labelKey="components.flatassistant.brightness"
    :min="store.flatdeviceInfo?.MinBrightness || 0"
    :max="store.flatdeviceInfo?.MaxBrightness || 65535"
    :step="1"
    :decimalPlaces="0"
    inputId="brightness"
  />
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import { apiStore } from '@/store/store';
const store = apiStore();

const settingsStore = useSettingsStore();
</script>
