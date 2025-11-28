<template>
  <NumberInputPicker
    v-model="flatsStore.minExposureTime"
    :label="$t('components.flatassistant.min_exposure_time')"
    labelKey="components.flatassistant.min_exposure_time"
    :min="0"
    :max="999"
    :step="0.1"
    :decimalPlaces="3"
    inputId="min-exposure-time"
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
  flatsStore.minExposureTime = store.profileInfo.CameraSettings.MinFlatExposureTime;
});
</script>
