<template>
  <Transition name="atlas-sheet">
    <section
      v-if="open"
      class="atlas-sheet"
      :class="[
        isLandscape ? 'atlas-sheet-landscape' : 'atlas-sheet-portrait',
        { 'atlas-sheet-peek': peek },
      ]"
      role="dialog"
      :aria-label="title"
    >
      <header class="atlas-sheet-header">
        <h3 class="min-w-0 flex-1 truncate text-sm font-semibold text-content">{{ title }}</h3>
        <slot name="header-actions" />
        <button
          class="atlas-sheet-close"
          type="button"
          :aria-label="$t('common.close')"
          :title="$t('common.close')"
          @click="$emit('close')"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </header>
      <div class="atlas-sheet-body">
        <slot />
      </div>
    </section>
  </Transition>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useOrientation } from '@/composables/useOrientation';

// The one panel surface of the Atlas: a bottom sheet in portrait, a right-hand column in
// landscape. The view decides what goes inside; only one sheet is ever open.
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  // While true only the rotation ruler stays visible, so the sky behind the
  // sheet (and the camera frame turning on it) can be watched during the drag.
  peek: { type: Boolean, default: false },
});
defineEmits(['close']);

const { isLandscape } = useOrientation();
</script>

<style scoped>
.atlas-sheet {
  position: absolute;
  z-index: 30;
  display: flex;
  flex-direction: column;
  min-height: 0;
  color: var(--color-content);
  background: rgb(17 24 39 / 96%);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-card);
  box-shadow: 0 12px 32px rgb(0 0 0 / 45%);
}
.atlas-sheet-portrait {
  left: calc(0.5rem + env(safe-area-inset-left, 0px));
  right: calc(0.5rem + env(safe-area-inset-right, 0px));
  bottom: var(--atlas-toolbar-clearance);
  max-height: calc(100% - var(--atlas-toolbar-clearance) - var(--atlas-header-clearance));
}
.atlas-sheet-landscape {
  top: var(--atlas-header-clearance);
  right: calc(0.75rem + env(safe-area-inset-right, 0px));
  bottom: var(--atlas-toolbar-clearance);
  width: min(22rem, calc(100% - 1.5rem));
}
.atlas-sheet-peek {
  visibility: hidden;
}
.atlas-sheet-peek :deep(.rotation-ruler) {
  visibility: visible;
  border-radius: var(--radius-control);
  background: rgb(17 24 39 / 85%);
  box-shadow: 0 0 0 0.5rem rgb(17 24 39 / 85%);
}
.atlas-sheet-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  border-bottom: 1px solid var(--color-line);
}
.atlas-sheet-close {
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  border-radius: var(--radius-control);
  color: var(--color-content-muted);
}
.atlas-sheet-close:hover {
  color: var(--color-content);
  background: var(--color-surface-2);
}
.atlas-sheet-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.75rem 1rem 1rem;
}
.atlas-sheet-enter-active,
.atlas-sheet-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.atlas-sheet-enter-from,
.atlas-sheet-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
@media (prefers-reduced-motion: reduce) {
  .atlas-sheet-enter-active,
  .atlas-sheet-leave-active {
    transition: none;
  }
}
</style>
