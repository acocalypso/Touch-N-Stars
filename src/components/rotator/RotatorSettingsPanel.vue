<template>
  <div class="flex flex-col gap-2 sm:gap-4 pb-20">
    <!-- Reverse Setting Container -->
    <div
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.rotator.settings.basic') }}
      </h3>
      <rotatorReverse />
    </div>
  </div>
</template>

<script setup>
import { apiStore } from '@/store/store';
import rotatorReverse from './rotatorReverse.vue';

const store = apiStore();
</script>
