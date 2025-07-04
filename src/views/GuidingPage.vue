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
          <div v-if="store.guiderInfo.DeviceId === 'PHD2_Single'">
            <button
              @click="openSettings = true"
              class="btn-primary bg-gradient-to-br w-full h-full from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600"
            >
              <Cog6ToothIcon class="w-full h-7 text-gray-300" />
            </button>

            <Modal :show="openSettings" @close="openSettings = false">
              <template #header>
                <h2 class="text-2xl font-semibold">{{ $t('components.camera.settings') }}</h2>
              </template>

              <template #body>
                <!-- Beliebiger Inhalt hier -->
                <div
                  v-if="store.guiderInfo.DeviceId === 'PHD2_Single'"
                  class="flex flex-col gap-1 mt-2 w-full"
                >
                <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <SetExposure  />
                </div>
                <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <SetRaAlgoPara />
                  </div>
                <div class="p-4 flex flex-col gap-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <SetDecAlgoPara />
                  </div>
                </div>
              </template>
            </Modal>
          </div>
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

import Modal from '@/components/helpers/Modal.vue';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';

const store = apiStore();
const guiderStore = useGuiderStore();
const wasGraphVisible = ref(false);
const openSettings = ref(false);

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
