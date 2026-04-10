<template>
  <NumberInputPicker
    v-model="flatsStore.count"
    :label="$t('components.flatassistant.count')"
    labelKey="components.flatassistant.count"
    :min="1"
    :max="999"
    :step="1"
    :decimalPlaces="0"
    inputId="count"
    @change="updateFlatCount"
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

async function updateFlatCount(value) {
  await apiService.profileChangeValue('FlatWizardSettings-FlatCount', value);
}

onMounted(() => {
  flatsStore.count = store.profileInfo?.FlatWizardSettings?.FlatCount || 1;
});
</script>
