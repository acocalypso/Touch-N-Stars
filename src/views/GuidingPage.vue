<template>
  <div>
    <!-- PHD2 Mode: New layout with image background -->
    <Phd2GuiderLayout v-if="store.guiderInfo.DeviceId === 'PHD2_Single'" />

    <!-- Non-PHD2 Mode: Original layout -->
    <template v-else>
      <div class="container max-w-3xl mx-auto p-4">
        <h5 class="text-xl text-center font-bold text-white mb-4">
          {{ $t('components.guider.title') }}
        </h5>
        <div
          v-if="!store.guiderInfo.Connected"
          class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p class="text-red-400 font-medium text-center">
            {{ $t('components.guider.notConnected') }}
          </p>
        </div>
        <div v-else>
          <!-- Original control buttons layout -->
          <div
            class="flex flex-col md:flex-row gap-1 md:space-x-4 mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
          >
            <ControlGuider />
          </div>

          <!-- Status Component -->
          <div class="mt-4">
            <GuiderStatus />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { apiStore } from '@/store/store';
import { useGuiderStore } from '@/store/guiderStore';
import Phd2GuiderLayout from '@/components/guider/PHD2/Phd2GuiderLayout.vue';
import ControlGuider from '@/components/guider/ControlGuider.vue';
import GuiderStatus from '@/components/guider/GuiderStatus.vue';
import { useI18n } from 'vue-i18n';

const store = apiStore();
const guiderStore = useGuiderStore();
const { t: $t } = useI18n();
const wasGraphVisible = ref(false);

onMounted(() => {
  wasGraphVisible.value = guiderStore.showGuiderGraph;
  guiderStore.showGuiderGraph = true;

  watch(
    () => guiderStore.showGuiderGraph,
    () => {
      console.log('showGuiderGraph geändert:', guiderStore.showGuiderGraph);
      wasGraphVisible.value = guiderStore.showGuiderGraph;
    }
  );
});

onUnmounted(() => {
  guiderStore.showGuiderGraph = wasGraphVisible.value;
});
</script>