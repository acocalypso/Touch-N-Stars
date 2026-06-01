<template>
  <div v-if="store.isPINS" class="flex items-center justify-between w-full">
    <span class="text-sm font-medium text-gray-300">
      {{ $t('components.guider.phd2.assumeDecOrthogonal') }}
    </span>
    <toggleButton
      @click="toggle"
      :status-value="guiderStore.phd2AssumeDecOrthogonal"
      :disabled="guiderStore.phd2AssumeDecOrthogonalLoading"
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
  await guiderStore.fetchPHD2AssumeDecOrthogonal();
});

const toggle = async () => {
  const previousValue = guiderStore.phd2AssumeDecOrthogonal;
  const newValue = !previousValue;
  try {
    guiderStore.phd2AssumeDecOrthogonal = newValue;
    await guiderStore.setPHD2AssumeDecOrthogonal(newValue);
  } catch (error) {
    console.error('Error changing PHD2 assume dec orthogonal:', error);
    guiderStore.phd2AssumeDecOrthogonal = previousValue;
  }
};
</script>
