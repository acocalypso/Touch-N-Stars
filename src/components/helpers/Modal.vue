<template>
  <teleport to="body">
    <div
      v-if="show"
      :class="[
        'fixed inset-0 flex items-center justify-center text-gray-200 p-2 bg-black bg-opacity-30',
        zIndexClass,
      ]"
      @click="handleClose"
    >
      <div
        class="p-6 bg-gradient-to-br from-gray-950 bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full relative"
        @click.stop
      >
        <!-- Header -->
        <div class="mb-4 border-b pb-2 flex justify-between items-center">
          <slot name="header">
            <h2 class="text-xl font-bold">Standard Titel</h2>
          </slot>
          <button
            v-if="!disableClose"
            @click="handleClose"
            class="w-8 h-8 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon />
          </button>
        </div>

        <!-- Body -->
        <div class="flex justify-center mb-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          <slot name="body">
            <p>Standard-Inhalt</p>
          </slot>
        </div>
      </div>
    </div>
  </teleport>
</template>
<script setup>
import { computed } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  show: Boolean,
  zIndex: {
    type: String,
    default: 'z-40',
  },
  disableClose: {
    type: Boolean,
    default: false,
  },
});

const zIndexClass = computed(() => props.zIndex);

const emit = defineEmits(['close']);

function handleClose() {
  if (!props.disableClose) {
    emit('close');
  }
}
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
