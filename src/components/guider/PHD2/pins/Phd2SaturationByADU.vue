<template>
  <div v-if="store.isPINS" class="flex items-center justify-between w-full">
    <div class="flex items-center gap-1">
      <span class="text-sm font-medium text-gray-300">
        {{ $t('components.guider.phd2.saturationByADU') }}
      </span>
      <InfoModal
        :title="$t('components.guider.phd2.saturationByADU')"
        :message="$t('components.guider.phd2.help.saturationByADU')"
        size="w-4 h-4"
      />
    </div>
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
import InfoModal from '@/components/helpers/infoModal.vue';
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
