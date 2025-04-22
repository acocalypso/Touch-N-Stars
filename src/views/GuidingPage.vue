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
        </div>
        <div
          class="flex mt-5 mb-20 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-2"
        >
          <div class="flex flex-col w-full">
            <div class="w-full">
              <rmsGraph />
            </div>
            <div class="min-w-24 pt-4 flex gap-3 ml-7 text-gray-300">
              <GuiderStats />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import rmsGraph from '@/components/guider/GuiderGraph.vue';
import { apiStore } from '@/store/store';
import ControlGuider from '@/components/guider/ControlGuider.vue';
import GuiderStats from '@/components/guider/GuiderStats.vue';

const store = apiStore();
</script>

<style scoped></style>
