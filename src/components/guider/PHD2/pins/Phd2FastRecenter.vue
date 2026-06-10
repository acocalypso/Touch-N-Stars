<template>
  <div v-if="store.isPINS" class="flex items-center justify-between w-full">
    <div class="flex items-center gap-1">
      <span class="text-sm font-medium text-gray-300">
        {{ $t('components.guider.phd2.fastRecenter') }}
      </span>
      <InfoModal
        :title="$t('components.guider.phd2.fastRecenter')"
        :message="$t('components.guider.phd2.help.fastRecenter')"
        size="w-4 h-4"
      />
    </div>
    <toggleButton
      @click="toggle"
      :status-value="guiderStore.phd2FastRecenter"
      :disabled="guiderStore.phd2FastRecenterLoading"
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
  await guiderStore.fetchPHD2FastRecenter();
});

const toggle = async () => {
  const previousValue = guiderStore.phd2FastRecenter;
  const newValue = !previousValue;
  try {
    guiderStore.phd2FastRecenter = newValue;
    await guiderStore.setPHD2FastRecenter(newValue);
  } catch (error) {
    console.error('Error changing PHD2 fast recenter:', error);
    guiderStore.phd2FastRecenter = previousValue;
  }
};
</script>
