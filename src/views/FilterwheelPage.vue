<template>
  <div class="text-left mb-2">
    <h1 class="text-xl text-center font-bold">{{ $t('components.filterwheel.title') }}</h1>
  </div>
  <div
    v-if="!store.filterInfo.Connected"
    class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
  >
    <p class="text-red-400 font-medium text-center">
      {{ $t('components.filterwheel.please_connect_filterwheel') }}
    </p>
  </div>
  <div v-else class="container flex items-center justify-center">
    <div class="container max-w-md landscape:max-w-xl">
      <div>
        <InfoFilterwheel class="grid grid-cols-2 landscape:grid-cols-3" />
      </div>
      <div
        class="mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
      >
        <strong>{{ $t('components.filterwheel.filter') }}</strong>
        <changeFilter />
      </div>
    </div>
  </div>
</template>
<script setup>
import changeFilter from '@/components/filterwheel/changeFilter.vue';
import InfoFilterwheel from '@/components/filterwheel/InfoFilterwheel.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
</script>
