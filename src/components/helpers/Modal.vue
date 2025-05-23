<!-- components/Modal.vue -->
<template>
  <div v-if="show" class="fixed inset-0 z-50 m-4 mt-24 flex items-start justify-center">
    <div class="p-6 bg-black bg-opacity-70 rounded-lg shadow-lg max-w-2xl w-full relative">
      <!-- Header -->
      <div class="mb-4 border-b pb-2 flex justify-between items-center">
        <slot name="header">
          <h2 class="text-xl font-bold">Standard Titel</h2>
        </slot>
        <button @click="$emit('close')" class="w-8 h-8 text-gray-400 hover:text-gray-600">
          <XMarkIcon />
        </button>
      </div>

      <!-- Body -->
      <div class="mb-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
        <slot name="body">
          <p>Standard-Inhalt</p>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline';
defineProps({
  show: Boolean,
});
defineEmits(['close']);
</script>

<style scoped>
/* Smooth scroll behavior */
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #4a5568;
  border-radius: 20px;
}
</style>
