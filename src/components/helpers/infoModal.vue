<template>
  <div class="flex items-center">
    <button @click="openModal" class="text-blue-500 hover:text-gray-300">
      <InformationCircleIcon :class="props.size" />
    </button>
  </div>
  <div>
    <!-- Modal Overlay -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <div
        class="bg-gray-800 text-white p-4 rounded-lg min-w-[400px] max-w-4xl max-h-[80vh] min-h-48 overflow-y-auto"
      >
        <div class="flex justify-end items-center">
          <button @click="isModalOpen = false" class="text-white hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <div>
          <h2 class="text-xl font-bold mb-4">{{ props.title }}</h2>
          <p>{{ props.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  title: { type: String, default: 'title' },
  message: { type: String, default: 'abc' },
  size: { type: String, default: 'w-6 h-6' },
});

const isModalOpen = ref(false);

function openModal() {
  isModalOpen.value = true;
}
</script>
<style scoped></style>
