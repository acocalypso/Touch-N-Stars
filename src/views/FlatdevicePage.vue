<template>
  <div class="text-left mb-2">
    <h1 class="text-xl text-center font-bold">{{ $t('components.flat.title') }}</h1>
  </div>
  <div
    v-if="!store.flatdeviceInfo.Connected"
    class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
  >
    <p class="text-red-400 font-medium text-center">
      {{ $t('components.flat.please_connect_flatDevice') }}
    </p>
  </div>
  <div v-else class="container flex items-center justify-center">
    <div class="container max-w-md landscape:max-w-xl">
      <div>
        <InfoFlatdevice class="grid grid-cols-2 landscape:grid-cols-3" />
      </div>
      <div
        class="mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
      >
        <controlFlatdevice class="w-full" />
      </div>
    </div>
  </div>
</template>

<script setup>
import InfoFlatdevice from '@/components/flatdevice/InfoFlatdevice.vue';
import controlFlatdevice from '@/components/flatdevice/controlFlatdevice.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
</script>
