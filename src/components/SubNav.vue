<template>
  <div class="subnav shadow-md overflow-hidden fixed z-10" :class="[subnavClasses, backgroundClasses]">
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
import { defineProps, defineEmits, computed } from 'vue';

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
}

// Check if in landscape mode
const isLandscape = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth > window.innerHeight;
  }
  return false;
});

// Responsive positioning classes
const subnavClasses = computed(() => ({
  // Portrait mode - below main navigation (left: 0, top: after nav)
  'left-0 top-20 w-full': !isLandscape.value,
  // Landscape mode - top of screen, full width
  'left-0 top-0 w-full': isLandscape.value,
}));

// Background classes for consistent styling
const backgroundClasses = computed(() => 'bg-gray-900/95 backdrop-blur-sm');
</script>

<style scoped>
.subnav {
  @apply border-cyan-500/30 transition-all duration-300 ease-in-out;
}

.subnav-button {
  @apply w-auto h-auto
    border border-slate-600/30 
    bg-slate-800/40 
    text-gray-300 
    rounded-full 
    hover:bg-slate-700/60
    hover:border-slate-500/50
    hover:text-gray-200
    backdrop-blur-sm
    transition-all
    duration-200
    ease-out
    focus:outline-none 
    focus:ring-2 
    focus:ring-cyan-500/40
    px-4 py-2 text-sm
    min-w-fit;
}

.active-subnav-button {
  @apply border border-cyan-500/50 
    bg-cyan-700/50 
    text-cyan-100
    shadow-md
    shadow-cyan-500/20;
}

/* Landscape mode specific styles */
@media screen and (orientation: landscape) {
  .subnav {
    width: 100% !important;
    left: 0 !important;
    top: 0 !important;
    border-top: none !important;
    border-bottom: 1px solid rgba(6, 182, 212, 0.3) !important;
  }
}

/* Portrait mode border */
@media screen and (orientation: portrait) {
  .subnav {
    border-top: 1px solid rgba(6, 182, 212, 0.3) !important;
    border-bottom: none !important;
  }
}

/* Safe Area Support for portrait only */
@media screen and (orientation: portrait) {
  @supports (padding-top: env(safe-area-inset-top)) {
    .subnav {
      top: calc(5rem + env(safe-area-inset-top)) !important;
    }
  }
}

/* Dark Mode Compatibility */
@media (prefers-color-scheme: dark) {
  .subnav {
    @apply bg-gray-900/95;
  }
}
</style>