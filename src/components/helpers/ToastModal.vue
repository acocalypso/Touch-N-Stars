<template>
  <transition name="fade">
    <div
      v-if="toastStore.newMessage"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <div
        :class="[
          'bg-gray-800 text-white p-4 m-8 rounded-lg max-w-xl max-h-[80vh] min-h-36 min-w-64 overflow-y-auto',
          toastTypeShadow,
        ]"
      >
        <div class="flex justify-end items-center">
          <button @click="toastStore.newMessage = false" class="text-white hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <div>
          <h2 class="text-xl font-bold text-center text-gray-200 mb-4">{{ toastStore.title }}</h2>
          <p class="text-gray-200">{{ toastStore.message }}</p>
        </div>
        <div class="flex items-center gap-2 mt-4" v-if="toastStore.link && toastStore.linkText">
          <GlobeAltIcon class="w-6 h-6" />
          <a :href="toastStore.link" target="_blank" class="text-cyan-400 hover:underline">
            {{ toastStore.linkText }}
          </a>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue';
import { useToastStore } from '@/store/toastStore';
import { XMarkIcon, GlobeAltIcon } from '@heroicons/vue/24/outline';

const toastStore = useToastStore();

const toastTypeShadow = computed(() => {
  switch (toastStore.type) {
    case 'info':
      return 'shadow-lg shadow-blue-500/50 ring-1 ring-blue-500/50';
    case 'warning':
      return 'shadow-lg shadow-orange-500/50 ring-1 ring-orange-500/50';
    case 'error':
      return 'shadow-lg shadow-red-500/50 ring-1 ring-red-500/50';
    default:
      return '';
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
