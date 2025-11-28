<template>
  <NumberInputPicker
    v-model="flatsStore.maxExposureTime"
    :label="$t('components.flatassistant.max_exposure_time')"
    labelKey="components.flatassistant.max_exposure_time"
    :min="0"
    :max="9999"
    :step="0.1"
    :decimalPlaces="0"
    inputId="max-exposure-time"
  />
</template>
<script setup>
import { onMounted } from 'vue';
import { apiStore } from '@/store/store';
import { useFlatassistantStore } from '@/store/flatassistantStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const store = apiStore();
const flatsStore = useFlatassistantStore();

onMounted(() => {
  flatsStore.maxExposureTime = store.profileInfo.CameraSettings.MaxFlatExposureTime;
});
</script>
