<template>
  <div v-if="store.isPINS" class="flex items-center justify-between w-full">
    <span class="text-sm font-medium text-gray-300">
      {{ $t('components.guider.phd2.useMultipleStars') }}
    </span>
    <toggleButton
      @click="toggleUseMultipleStars"
      :status-value="guiderStore.phd2UseMultipleStars"
      :disabled="guiderStore.phd2UseMultipleStarsLoading"
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
  await guiderStore.fetchPHD2UseMultipleStars();
});

const toggleUseMultipleStars = async () => {
  const previousValue = guiderStore.phd2UseMultipleStars;
  const newValue = !previousValue;

  try {
    // Optimistic update
    guiderStore.phd2UseMultipleStars = newValue;
    await guiderStore.setPHD2UseMultipleStars(newValue);
    console.log('Use multiple stars changed to:', guiderStore.phd2UseMultipleStars);
  } catch (error) {
    console.error('Error changing use multiple stars:', error);
    // Bei Fehler zum vorherigen Wert zurückkehren
    guiderStore.phd2UseMultipleStars = previousValue;
  }
};
</script>
