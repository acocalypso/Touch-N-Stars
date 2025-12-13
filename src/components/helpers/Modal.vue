<template>
  <teleport to="body">
    <!-- Overlay (nur wenn nicht minimiert) -->
    <div
      v-if="show && !isMinimized"
      :class="[
        'fixed inset-0 flex items-center justify-center text-gray-200 p-2 bg-black bg-opacity-30',
        zIndexClass,
      ]"
      @click="handleBackdropClick"
    >
      <div
        :class="[
          'p-6 bg-gradient-to-br from-gray-950 bg-gray-800 rounded-lg shadow-lg w-full relative',
          props.maxWidth,
        ]"
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

    <!-- Minimized floating box (nur wenn minimiert) -->
    <div
      v-if="show && isMinimized"
      :class="['fixed bottom-4 right-4 shadow-2xl', zIndexClass]"
    >
      <div
        :class="[
          'p-6 bg-gradient-to-br from-gray-950 bg-gray-800 rounded-lg shadow-lg relative',
          'min-w-[300px]',
        ]"
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
  maxWidth: {
    type: String,
    default: 'max-w-2xl',
  },
  closeOnBackdropClick: {
    type: Boolean,
    default: true,
  },
  isMinimized: {
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

function handleBackdropClick(event) {
  if (event.target === event.currentTarget && props.closeOnBackdropClick) {
    handleClose();
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

/* High z-index for modals */
:deep(.z-\[80\]) {
  z-index: 80 !important;
}
</style>
