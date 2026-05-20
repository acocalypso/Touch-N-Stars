<template>
  <div
    class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
  >
    <h3 class="font-bold text-base text-cyan-400">
      {{ $t('components.settings.mount.titel') }}
    </h3>
    <NumberInputPicker
      v-model="indiMaxSlewRateDps"
      :label="$t('components.settings.mount.max_slew_rate')"
      labelKey="components.settings.mount.max_slew_rate"
      :min="0.1"
      :max="20"
      :step="0.1"
      :decimalPlaces="1"
      inputId="indi-max-slew-rate"
      @change="updateIndiMaxSlewRateDps"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const store = apiStore();

const indiMaxSlewRateDps = ref(3.0);

async function updateIndiMaxSlewRateDps() {
  try {
    await apiService.profileChangeValue(
      'TelescopeSettings-IndiMaxSlewRateDps',
      indiMaxSlewRateDps.value
    );
  } catch (error) {
    console.error('Error updating IndiMaxSlewRateDps:', error);
  }
}

onMounted(() => {
  const profile = store.profileInfo;
  indiMaxSlewRateDps.value = profile?.TelescopeSettings?.IndiMaxSlewRateDps ?? 3.0;
});
</script>
