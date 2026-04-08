<template>
  <NumberInputPicker
    v-model="flatsStore.darkCount"
    :label="$t('components.flatassistant.darks_to_take')"
    labelKey="components.flatassistant.darks_to_take"
    :min="0"
    :max="999"
    :step="1"
    :decimalPlaces="0"
    inputId="dark-count"
    @change="updateDarkCount"
  />
</template>

<script setup>
import apiService from '@/services/apiService';
import { useFlatassistantStore } from '@/store/flatassistantStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const flatsStore = useFlatassistantStore();

async function updateDarkCount(value) {
  await apiService.profileChangeValue('FlatWizardSettings-DarkFlatCount', value);
}
</script>
