<template>
  <div class="container flex items-center justify-center relative">
    <!-- PHD2 Modal Image -->
    <Phd2Image 
      v-if="guiderStore.phd2Connection?.IsConnected" 
      :show="showPhd2Image"
      @close="showPhd2Image = false"
    />

    <div class="container max-w-3xl relative" style="z-index: 10;">
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
          <div v-if="guiderStore.phd2Connection?.IsConnected" class="flex gap-2">
            <button @click="showPhd2Image = !showPhd2Image" class="default-button-gray" :title="showPhd2Image ? 'Hide PHD2 Image' : 'Show PHD2 Image'">
              <svg class="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="showPhd2Image" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </button>
            <button @click="openSettings = true" class="default-button-gray">
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
                  <Phd2Settings />
                </div>
              </template>
            </Modal>
          </div>
        </div>

        <!-- Status Component -->
        <div class="mt-4">
          <GuiderStatus />
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
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';
import Phd2Settings from '@/components/guider/PHD2/Phd2Settings.vue';
import Phd2Image from '@/components/guider/PHD2/Phd2Image.vue';
import Modal from '@/components/helpers/Modal.vue';
import GuiderStatus from '@/components/guider/GuiderStatus.vue';

const store = apiStore();
const guiderStore = useGuiderStore();
const wasGraphVisible = ref(false);
const openSettings = ref(false);
const showPhd2Image = ref(false);

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
