<template>
  <NumberInputPicker
    v-model="flatsStore.minExposureTime"
    :label="$t('components.flatassistant.min_exposure_time')"
    labelKey="components.flatassistant.min_exposure_time"
    :min="0.001"
    :max="999"
    :step="0.01"
    :decimalPlaces="3"
    inputId="min-exposure-time"
    @change="updateMinExposureTime"
  />
</template>
<script setup>
import { onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useFlatassistantStore } from '@/store/flatassistantStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const store = apiStore();
const flatsStore = useFlatassistantStore();

async function updateMinExposureTime(value) {
  await apiService.profileChangeValue('CameraSettings-MinFlatExposureTime', value);
}

onMounted(() => {
  flatsStore.minExposureTime = store.profileInfo.CameraSettings.MinFlatExposureTime;
});
</script>
