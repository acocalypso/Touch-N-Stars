<template>
  <!-- Deliberately transparent: the app underneath stays fully readable and
       keeps updating, only the touches are swallowed. The overlay itself is the
       blocker - every tap lands here instead of on a control, which also covers
       drag & drop, pinch zoom and scroll (touch-action: none). No backdrop-filter:
       it would create a containing block for position: fixed children. -->
  <div
    class="screen-lock-overlay fixed inset-0 z-lock select-none"
    @pointerdown="handleBlockedTap"
    @contextmenu.prevent
    @wheel.prevent
  >
    <div class="unlock-anchor" :class="isLandscape ? 'unlock-anchor-landscape' : ''">
      <Transition name="hint">
        <p
          v-if="showHint"
          class="mb-2 px-3 py-1.5 rounded-chip bg-surface-1/90 border border-line text-xs text-content text-center shadow-lg"
        >
          {{ t('plugins.screenLock.holdToUnlock', { seconds: UNLOCK_HOLD_SECONDS }) }}
        </p>
      </Transition>

      <button
        type="button"
        class="unlock-button min-h-touch min-w-touch relative flex items-center justify-center rounded-full border border-line-strong bg-surface-1/90 text-content shadow-lg"
        :aria-label="t('plugins.screenLock.unlock')"
        @pointerdown.stop="startHold"
        @pointerup.stop="cancelHold"
        @pointercancel.stop="cancelHold"
        @pointerleave="cancelHold"
        @contextmenu.prevent
      >
        <!-- Progress ring, same stroke-dasharray technique as the exposure ring
             in NavigationComp.vue -->
        <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            class="fill-none stroke-line-strong stroke-[2.5]"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            class="fill-none stroke-accent stroke-[2.5]"
            stroke-linecap="round"
            :style="{ strokeDasharray: `${Math.round(progress * 100)}, 100` }"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <LockClosedIcon class="w-6 h-6" :class="progress > 0 ? 'text-accent' : 'text-content'" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { LockClosedIcon } from '@heroicons/vue/24/outline';
import { useSettingsStore } from '@/store/settingsStore';
import { useOrientation } from '@/composables/useOrientation';
import { useHaptics } from '@/composables/useHaptics';
import { createHoldTimer } from '@/utils/holdTimer';

const UNLOCK_HOLD_SECONDS = 2;
const HINT_VISIBLE_MS = 2000;

const { t } = useI18n();
const settingsStore = useSettingsStore();
const { isLandscape } = useOrientation();
const { tapLight, notifySuccess } = useHaptics();

const progress = ref(0);
const showHint = ref(false);
let hintTimeoutId = null;
let backButtonListenerHandle = null;

const holdTimer = createHoldTimer({
  durationMs: UNLOCK_HOLD_SECONDS * 1000,
  onProgress: (value) => {
    progress.value = value;
  },
  onComplete: () => {
    progress.value = 0;
    void notifySuccess();
    settingsStore.unlockScreen();
  },
});

function startHold() {
  void tapLight();
  hideHint();
  holdTimer.start();
}

function cancelHold() {
  holdTimer.cancel();
}

function hideHint() {
  if (hintTimeoutId) {
    clearTimeout(hintTimeoutId);
    hintTimeoutId = null;
  }
  showHint.value = false;
}

// A tap anywhere else is swallowed on purpose. Without feedback a transparent
// overlay reads as a frozen app, so point at the way out instead.
function handleBlockedTap() {
  showHint.value = true;
  if (hintTimeoutId) clearTimeout(hintTimeoutId);
  hintTimeoutId = setTimeout(() => {
    showHint.value = false;
    hintTimeoutId = null;
  }, HINT_VISIBLE_MS);
}

onMounted(async () => {
  // Registering any backButton listener suppresses Capacitor's default (history
  // back, or exiting the app on the first route). This one does nothing on
  // purpose: while locked, the hardware back button must neither navigate nor
  // release the lock.
  if (Capacitor.getPlatform() === 'android') {
    backButtonListenerHandle = await CapacitorApp.addListener('backButton', () => {});
  }
});

onBeforeUnmount(async () => {
  holdTimer.dispose();
  hideHint();
  await backButtonListenerHandle?.remove();
  backButtonListenerHandle = null;
});
</script>

<style scoped>
.screen-lock-overlay {
  /* Swallows scroll, pinch zoom and drag gestures rather than passing them on. */
  touch-action: none;
  overscroll-behavior: contain;
}

/* Floats just above the status bar (incl. safe area and any open status panel),
   centered on the stage. */
.unlock-anchor {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(var(--above-statusbar) + var(--status-panel-height));
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 1rem;
}

.unlock-anchor-landscape {
  left: var(--nav-width);
}

.unlock-button {
  width: var(--spacing-touch);
  height: var(--spacing-touch);
  touch-action: none;
}

.hint-enter-active,
.hint-leave-active {
  transition: opacity 0.2s ease;
}

.hint-enter-from,
.hint-leave-to {
  opacity: 0;
}
</style>
