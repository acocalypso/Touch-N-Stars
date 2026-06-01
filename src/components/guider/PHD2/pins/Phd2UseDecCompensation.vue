<template>
  <div v-if="store.isPINS" class="flex items-center justify-between w-full">
    <span class="text-sm font-medium text-gray-300">
      {{ $t('components.guider.phd2.useDecCompensation') }}
    </span>
    <toggleButton
      @click="toggle"
      :status-value="guiderStore.phd2UseDecCompensation"
      :disabled="guiderStore.phd2UseDecCompensationLoading"
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
  await guiderStore.fetchPHD2UseDecCompensation();
});

const toggle = async () => {
  const previousValue = guiderStore.phd2UseDecCompensation;
  const newValue = !previousValue;
  try {
    guiderStore.phd2UseDecCompensation = newValue;
    await guiderStore.setPHD2UseDecCompensation(newValue);
  } catch (error) {
    console.error('Error changing PHD2 use dec compensation:', error);
    guiderStore.phd2UseDecCompensation = previousValue;
  }
};
</script>
