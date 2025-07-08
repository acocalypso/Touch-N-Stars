<template>
  <div
    class="flex flex-row items-center justify-between w-full border border-gray-300 p-2 rounded-xl transition-all duration-200 hover:border-cyan-500 focus-within:border-cyan-500 hover:shadow-lg"
  >
    <div>
      <p class="text-sm font-medium text-gray-500">
        {{ $t('components.framing.fovSettings.fov') }}
      </p>
    </div>
    <input
      class="default-input h-10 w-20"
      type="number"
      v-model="framingStore.fov"
      min="0"
      max="10000"
    />
  </div>
  <div
    class="flex flex-row items-center justify-between w-full border border-gray-300 p-2 mt-1 rounded-xl transition-all duration-200 hover:border-cyan-500 focus-within:border-cyan-500 hover:shadow-lg"
  >
    <div>
      <p class="text-sm min-w-24 font-medium text-gray-500">
        {{ $t('components.framing.fovSettings.rotationAngle') }}
      </p>
    </div>
    <input
      class="w-full mx-2"
      type="range"
      min="0"
      max="360"
      v-model="framingStore.rotationAngle"
    />
    <input
      class="default-input h-10 w-28"
      type="number"
      v-model="framingStore.rotationAngle"
      min="0"
      max="360"
    />
  </div>
  <div>
    <getImageRotation />
  </div>
  <!-- Vielleicht später
  <div>
    <moveRotator />
  </div>
  -->
  <div>
    <button
      class="flex items-center justify-center min-w-24 min-h-12 bg-cyan-900/15 border border-green-400 rounded-md text-white font-medium transition-colors w-full"
      @click="framingStore.showFramingModal = false"
    >
      <CheckCircleIcon class="w-9 h-9 text-green-500" />
    </button>
  </div>
</template>
<script setup>
import { useFramingStore } from '@/store/framingStore';
import getImageRotation from '@/components/framing/getImageRotation.vue';
import { CheckCircleIcon } from '@heroicons/vue/24/outline';
//import moveRotator from '@/components/framing/moveRotator.vue';

const framingStore = useFramingStore();
</script>
