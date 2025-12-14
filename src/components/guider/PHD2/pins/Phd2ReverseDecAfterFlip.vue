<template>
  <div class="flex items-center justify-between w-full">
    <span class="text-sm font-medium text-gray-300">
      {{ $t('components.guider.phd2.reverseDecAfterFlip') }}
    </span>
    <toggleButton
      @click="toggleReverseDecAfterFlip"
      :status-value="guiderStore.phd2ReverseDecAfterFlip"
      :disabled="guiderStore.phd2ReverseDecAfterFlipLoading"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGuiderStore } from '@/store/guiderStore';
import toggleButton from '@/components/helpers/toggleButton.vue';

const guiderStore = useGuiderStore();

onMounted(async () => {
  await guiderStore.fetchPHD2ReverseDecAfterFlip();
});

const toggleReverseDecAfterFlip = async () => {
  const previousValue = guiderStore.phd2ReverseDecAfterFlip;
  const newValue = !previousValue;

  try {
    // Optimistic update
    guiderStore.phd2ReverseDecAfterFlip = newValue;
    await guiderStore.setPHD2ReverseDecAfterFlip(newValue);
    console.log('Reverse DEC after flip changed to:', guiderStore.phd2ReverseDecAfterFlip);
  } catch (error) {
    console.error('Error changing reverse DEC after flip:', error);
    // Bei Fehler zum vorherigen Wert zurückkehren
    guiderStore.phd2ReverseDecAfterFlip = previousValue;
  }
};
</script>
