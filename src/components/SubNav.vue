<template>
  <div class="subnav shadow-md fixed z-10" :class="[subnavClasses, backgroundClasses]">
    <div class="flex mx-auto h-12 items-center justify-center px-6 space-x-4">
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
import { useOrientation } from '@/composables/useOrientation';
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
const { isLandscape } = useOrientation();
// Responsive positioning classes - basierend auf tatsächlicher Navbar-Breite
const subnavClasses = computed(() => ({
  // Portrait mode - below main navigation (left: 0, top: after nav)
  'left-0 top-20 w-full': !isLandscape.value,
  // Landscape mode - top of screen, starting after navbar (w-32 = 8rem = 128px)
  'left-32 top-0 w-[calc(100vw-8rem)]': isLandscape.value,
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
    px-2 py-2 text-xs
    flex-1
    max-w-52;
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
    left: 8rem !important; /* 128px - entspricht w-32 der Navbar */
    right: 0 !important; /* Bis zum rechten Rand */
    width: calc(100% - 8rem) !important; /* Volle Breite minus Navbar */
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
