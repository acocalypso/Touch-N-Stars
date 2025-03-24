<template>
  <div>
    <!-- Modal Trigger -->
    <button
      @click="isModalOpen = true"
      class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md z-10"
    >
      <PencilIcon class="w-6 h-6 text-white" />
    </button>

    <!-- Modal Overlay -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      @click.self="isModalOpen = false"
    >
      <div
        class="bg-gray-800 text-white p-6 rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto"
        @click.stop
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">{{ $t('components.sequence.info.header') }}</h2>
          <button @click="isModalOpen = false" class="text-white hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <div class="space-y-6">
          <section>
            <p class="mb-2">{{ $t('components.sequence.info.message') }}</p>
            <div class="flex items-center gap-2 mt-2">
              <GlobeAltIcon class="w-6 h-6" />
            <a
              href="https://github.com/Touch-N-Stars/Touch-N-Stars/issues"
              target="_blank"
              class="text-cyan-400 hover:underline"
              >GitHub</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { PencilIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import {GlobeAltIcon} from '@heroicons/vue/24/outline';

const isModalOpen = ref(false);
</script>
