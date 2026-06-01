<template>
  <div v-if="store.isPINS" class="flex items-center justify-between w-full">
    <span class="text-sm font-medium text-gray-300">
      {{ $t('components.guider.phd2.beepForLostStar') }}
    </span>
    <toggleButton
      @click="toggle"
      :status-value="guiderStore.phd2BeepForLostStar"
      :disabled="guiderStore.phd2BeepForLostStarLoading"
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
  await guiderStore.fetchPHD2BeepForLostStar();
});

const toggle = async () => {
  const previousValue = guiderStore.phd2BeepForLostStar;
  const newValue = !previousValue;
  try {
    guiderStore.phd2BeepForLostStar = newValue;
    await guiderStore.setPHD2BeepForLostStar(newValue);
  } catch (error) {
    console.error('Error changing PHD2 beep for lost star:', error);
    guiderStore.phd2BeepForLostStar = previousValue;
  }
};
</script>
