<template>
  <NumberInputPicker
    v-model="settingsStore.camera.offset"
    :label="$t('components.camera.offset')"
    labelKey="components.camera.offset"
    :min="0"
    :max="9999"
    :step="1"
    :decimalPlaces="0"
    inputId="offset"
  />
</template>
<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const settingsStore = useSettingsStore();
</script>
