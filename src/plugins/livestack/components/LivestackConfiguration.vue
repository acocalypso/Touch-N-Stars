<template>
  <button
    class="flex items-center justify-center p-1 w-10 h-10 rounded-full mr-2 bg-gray-700/50 text-white border border-gray-400 z-[500]"
    @click="showConfiguration = !showConfiguration"
  >
    <Cog6ToothIcon class="w-6 h-6" />
  </button>

  <ModalTransparanet :show="showConfiguration" @close="showConfiguration = false">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-1xl font-semibold">Livestack configuration</h2>
        <div class="flex items-center gap-2 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
            />
          </svg>
          <span class="text-xs">Drag</span>
        </div>
      </div>
    </template>
    <template #body>
      <div class="flex flex-row items-center justify-between w-full p-2">
        <label for="toggle_osc_components" class="text-gray-200"> Show RGB composition only </label>
        <div>
          <toggleButton
            id="toggle_osc_components"
            @click="store.toogleShowFilters()"
            :status-value="!store.showFilters"
            class="pr-5 pl-5 justify-center z-40"
          />
        </div>
      </div>
    </template>
  </ModalTransparanet>
</template>

<script setup>
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';
import ModalTransparanet from '@/components/helpers/ModalTransparanet.vue';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { ref } from 'vue';
import { useLivestackStore } from '../store/livestackStore.js';

const showConfiguration = ref(false);
const store = useLivestackStore();
</script>
