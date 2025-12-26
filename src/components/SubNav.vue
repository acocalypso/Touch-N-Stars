<template>
  <div class="subnav shadow-md fixed z-10" :class="[subnavClasses, backgroundClasses]">
    <div class="flex mx-auto h-12 items-center justify-center px-2 space-x-1">
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
import { computed } from 'vue';
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
    bg-transparent
    text-gray-400
    rounded-md
    hover:text-gray-200
    hover:bg-gray-800/30
    transition-all
    duration-200
    ease-out
    focus:outline-none
    px-2 py-1.5 sm:px-4 sm:py-2
    text-xs sm:text-sm
    flex-1
    max-w-52
    flex
    items-center
    justify-center
    gap-1 sm:gap-2
    relative;
}
.subnav-button::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: transparent;
  transition: all 200ms ease-out;
}
.subnav-button:hover::after {
  background-color: rgba(6, 182, 212, 0.3);
}
.active-subnav-button {
  @apply text-cyan-400;
}
.active-subnav-button::after {
  background-color: rgba(6, 182, 212, 1) !important;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.6);
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
