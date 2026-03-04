<template>
  <div
    class="subnav shadow-md fixed z-10 overflow-hidden"
    :class="[subnavClasses, backgroundClasses]"
  >
    <!-- Scroll fade left -->
    <div v-if="canScrollStart" class="scroll-fade scroll-fade-left pointer-events-none">
      <div class="scroll-arrow arrow-left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
    </div>
    <!-- Scroll fade right -->
    <div v-if="canScrollEnd" class="scroll-fade scroll-fade-right pointer-events-none">
      <div class="scroll-arrow arrow-right">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
    </div>

    <div
      ref="navContentRef"
      class="flex mx-auto h-12 items-center justify-start px-2 space-x-1 overflow-x-auto scrollbar-hide"
      @scroll="updateScrollIndicators"
    >
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
import { computed, ref, onMounted, watch, nextTick } from 'vue';
import { useOrientation } from '@/composables/useOrientation';
const props = defineProps({
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

// Scroll indicators
const navContentRef = ref(null);
const canScrollStart = ref(false);
const canScrollEnd = ref(false);

function updateScrollIndicators() {
  const el = navContentRef.value;
  if (!el) return;
  const threshold = 5;
  canScrollStart.value = el.scrollLeft > threshold;
  canScrollEnd.value = el.scrollLeft + el.clientWidth < el.scrollWidth - threshold;
}

onMounted(() => {
  nextTick(() => updateScrollIndicators());
});

watch(
  () => props.items,
  () => nextTick(() => updateScrollIndicators()),
  { deep: true }
);
</script>
<style scoped>
.subnav {
  @apply border-cyan-500/30 transition-all duration-300 ease-in-out;
}
.subnav-button {
  @apply flex-shrink-0 h-auto
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

/* Scroll Fade Indicators */
.scroll-fade {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}
.scroll-fade-left {
  left: 0;
  width: 40px;
  background: linear-gradient(
    to right,
    rgba(17, 24, 39, 1) 0%,
    rgba(17, 24, 39, 0.8) 50%,
    rgba(17, 24, 39, 0) 100%
  );
}
.scroll-fade-right {
  right: 0;
  width: 40px;
  background: linear-gradient(
    to left,
    rgba(17, 24, 39, 1) 0%,
    rgba(17, 24, 39, 0.8) 50%,
    rgba(17, 24, 39, 0) 100%
  );
}
.scroll-arrow {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.4);
}
.scroll-arrow svg {
  width: 100%;
  height: 100%;
}
.arrow-left {
  position: absolute;
  left: 4px;
}
.arrow-right {
  position: absolute;
  right: 4px;
}
</style>
