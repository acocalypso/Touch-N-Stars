<template>
  <div class="subnav bg-gray-800 shadow-sm fixed left-0 z-10">
    <div class="flex mx-auto h-12 items-center justify-center px-4 space-x-4">
      <button
        v-for="item in items"
        :key="item.name"
        class="subnav-button"
        :class="{ 'active-subnav-button': item.value === activeItem }"
        @click="selectItem(item.value)"
        :title="item.name"
      >
        {{ item.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  items: {
    type: Array,
    required: true,
  },
  activeItem: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:activeItem']);

function selectItem(value) {
  emit('update:activeItem', value);
  //console.log(activeItem);
}
</script>

<style scoped>
.subnav {
  @apply w-full border-t border-cyan-500/20;
}

.subnav-button {
  @apply text-gray-300 text-sm px-3 py-2 rounded hover:bg-gray-700 hover:text-white transition-all;
}

.active-subnav-button {
  @apply text-white bg-cyan-700 rounded;
}
</style>
