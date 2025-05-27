<template>
  <teleport to="body">
    <div v-if="show" class="fixed inset-0 z-40 text-gray-200 p-2 pointer-events-none">
      <div
        class="p-6 bg-gradient-to-br from-gray-950/20 rounded-lg shadow-lg max-w-md min-w-56 relative pointer-events-auto touch-none"
        :style="{ position: 'absolute', ...position }"
        @click.stop
      >
        <!-- Header = Drag-Handle -->
        <div
          class="mb-4 border-b pb-2 flex justify-between items-center cursor-move select-none touch-none"
          @mousedown="startDrag"
          @touchstart="startDrag"
        >
          <slot name="header">
            <h2 class="text-xl font-bold">Standard Titel</h2>
          </slot>
          <button @click="emit('close')" class="w-8 h-8 text-gray-400 hover:text-gray-600">
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
import { ref } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

defineProps({
  show: Boolean,
});

const emit = defineEmits(['close']);

const position = ref({ top: '150px', left: '10px' });

const isDragging = ref(false);
let offset = { x: 0, y: 0 };

function getEventCoordinates(e) {
  if (e.touches) {
    return {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }
  return {
    x: e.clientX,
    y: e.clientY,
  };
}

function startDrag(e) {
  isDragging.value = true;
  const { x, y } = getEventCoordinates(e);
  offset.x = x - parseInt(position.value.left);
  offset.y = y - parseInt(position.value.top);
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchmove', onDrag, { passive: false });
  window.addEventListener('touchend', stopDrag);
}

function onDrag(e) {
  if (!isDragging.value) return;
  e.preventDefault(); // wichtig für mobile, um Scroll zu blockieren
  const { x, y } = getEventCoordinates(e);
  position.value.left = `${x - offset.x}px`;
  position.value.top = `${y - offset.y}px`;
}

function stopDrag() {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('touchend', stopDrag);
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
