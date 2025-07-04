<template>
  <div class="container flex items-center justify-center">
    <div class="container max-w-3xl">
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
        <!-- Wenn verbunden dann hier der Inhalt -->
        <div
          class="flex flex-col md:flex-row gap-1 md:space-x-4 mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <ControlGuider />
          <SetExposure />
          <SetRaAlgoPara />
          <SetDecAlgoPara />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { apiStore } from '@/store/store';
import { useGuiderStore } from '@/store/guiderStore';
import ControlGuider from '@/components/guider/ControlGuider.vue';
import SetExposure from '@/components/guider/PHD2/SetExposure.vue';
import SetRaAlgoPara from '@/components/guider/PHD2/SetRaAlgoPara.vue';
import SetDecAlgoPara from '@/components/guider/PHD2/SetDecAlgoPara.vue';

const store = apiStore();
const guiderStore = useGuiderStore();
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

<style scoped></style>
