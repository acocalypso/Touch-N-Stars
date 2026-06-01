<template>
  <div v-if="store.isPINS" class="flex items-center justify-between w-full">
    <span class="text-sm font-medium text-gray-300">
      {{ $t('components.guider.phd2.massChangeEnabled') }}
    </span>
    <toggleButton
      @click="toggle"
      :status-value="guiderStore.phd2MassChangeEnabled"
      :disabled="guiderStore.phd2MassChangeEnabledLoading"
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
  await guiderStore.fetchPHD2MassChangeEnabled();
});

const toggle = async () => {
  const previousValue = guiderStore.phd2MassChangeEnabled;
  const newValue = !previousValue;
  try {
    guiderStore.phd2MassChangeEnabled = newValue;
    await guiderStore.setPHD2MassChangeEnabled(newValue);
  } catch (error) {
    console.error('Error changing PHD2 mass change enabled:', error);
    guiderStore.phd2MassChangeEnabled = previousValue;
  }
};
</script>
