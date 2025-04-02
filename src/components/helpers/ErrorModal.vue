<template>
    <!-- Modal Overlay -->
    <div
      v-if="errorStore.isError"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <div
        class="bg-gray-800 text-white p-4 m-8 rounded-lg max-w-xl max-h-[80vh] min-h-48 overflow-y-auto"
      >
        <div class="flex justify-end items-center">
          <button @click="errorStore.isError = false" class="text-white hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <div>
          <h2 class="text-xl font-bold mb-4">{{ errorStore.errorTitle }}</h2>
          <p>{{ errorStore.errorMessage }}</p>
        </div>
        <div class="flex items-center gap-2 mt-4" v-if="errorStore.errorLink && errorStore.errorLinkText">
          <GlobeAltIcon class="w-6 h-6" />
          <a :href="errorStore.errorLink" target="_blank" class="text-cyan-400 hover:underline">
            {{ errorStore.errorLinkText }}
          </a>
        </div>
      </div>
    </div>
</template>

<script setup>
import { useErrorStore } from '@/store/errorStore';
import { XMarkIcon, GlobeAltIcon } from '@heroicons/vue/24/outline';

const errorStore = useErrorStore();

</script>
