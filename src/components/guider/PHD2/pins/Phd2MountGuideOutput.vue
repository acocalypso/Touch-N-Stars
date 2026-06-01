<template>
  <div v-if="store.isPINS" class="flex items-center justify-between w-full">
    <div class="flex items-center gap-1">
      <span class="text-sm font-medium text-gray-300">
        {{ $t('components.guider.phd2.mountGuideOutput') }}
      </span>
      <InfoModal
        :title="$t('components.guider.phd2.mountGuideOutput')"
        :message="$t('components.guider.phd2.help.mountGuideOutput')"
        size="w-4 h-4"
      />
    </div>
    <toggleButton
      @click="toggle"
      :status-value="guiderStore.phd2MountGuideOutput"
      :disabled="guiderStore.phd2MountGuideOutputLoading"
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
  await guiderStore.fetchPHD2MountGuideOutput();
});

const toggle = async () => {
  const previousValue = guiderStore.phd2MountGuideOutput;
  const newValue = !previousValue;
  try {
    guiderStore.phd2MountGuideOutput = newValue;
    await guiderStore.setPHD2MountGuideOutput(newValue);
  } catch (error) {
    console.error('Error changing PHD2 mount guide output:', error);
    guiderStore.phd2MountGuideOutput = previousValue;
  }
};
</script>
