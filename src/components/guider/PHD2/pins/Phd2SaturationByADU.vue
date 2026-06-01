<template>
  <div v-if="store.isPINS" class="flex items-center justify-between w-full">
    <span class="text-sm font-medium text-gray-300">
      {{ $t('components.guider.phd2.saturationByADU') }}
    </span>
    <toggleButton
      @click="toggle"
      :status-value="guiderStore.phd2SaturationByADU"
      :disabled="guiderStore.phd2SaturationByADULoading"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGuiderStore } from '@/store/guiderStore';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
const guiderStore = useGuiderStore();

onMounted(async () => {
  await guiderStore.fetchPHD2SaturationByADU();
});

const toggle = async () => {
  const previousValue = guiderStore.phd2SaturationByADU;
  const newValue = !previousValue;
  try {
    guiderStore.phd2SaturationByADU = newValue;
    await guiderStore.setPHD2SaturationByADU(newValue);
  } catch (error) {
    console.error('Error changing PHD2 saturation by ADU:', error);
    guiderStore.phd2SaturationByADU = previousValue;
  }
};
</script>
