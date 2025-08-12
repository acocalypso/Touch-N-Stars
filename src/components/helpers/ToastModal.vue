<template>
  <!-- Confirmation/Critical Toasts (blocking) -->
  <transition name="fade">
    <div
      v-if="toastStore.newMessage && (toastStore.isConfirmation || toastStore.type === 'critical')"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <div
        :class="[
          'bg-gray-800 text-white p-4 m-8 rounded-lg max-w-xl max-h-[80vh] min-h-36 min-w-64 overflow-y-auto',
          toastTypeShadow,
        ]"
      >
        <div class="flex justify-end items-center">
          <button @click="toastStore.closeToast()" class="text-white hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <div>
          <h2 class="text-xl font-bold text-center text-gray-200 mb-4">{{ toastStore.title }}</h2>
          <p class="text-gray-200 text-center">{{ toastStore.message }}</p>
        </div>

        <!-- Bestehender Link-Bereich -->
        <div class="flex items-center gap-2 mt-4" v-if="toastStore.link && toastStore.linkText">
          <GlobeAltIcon class="w-6 h-6" />
          <a :href="toastStore.link" target="_blank" class="text-cyan-400 hover:underline">
            {{ toastStore.linkText }}
          </a>
        </div>

        <!-- Neue Bestätigungsbuttons -->
        <div v-if="toastStore.isConfirmation" class="flex justify-center gap-4 mt-6">
          <button
            @click="toastStore.cancelAction()"
            class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {{ toastStore.cancelText }}
          </button>
          <button
            @click="toastStore.confirmAction()"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {{ toastStore.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- Non-blocking Toast Notifications -->
  <div class="fixed top-4 right-4 z-40 space-y-3 max-w-sm pointer-events-none">
    <transition-group name="toast-slide">
      <div
        v-if="toastStore.newMessage && !toastStore.isConfirmation && toastStore.type !== 'critical'"
        key="toast"
        :class="[
          'bg-gray-800 text-white p-4 rounded-lg shadow-lg pointer-events-auto',
          toastTypeShadow,
          toastTypeClasses,
        ]"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="font-bold text-sm mb-1">{{ toastStore.title }}</h3>
            <p class="text-sm text-gray-200">{{ toastStore.message }}</p>

            <!-- Link für Toast -->
            <div class="flex items-center gap-2 mt-2" v-if="toastStore.link && toastStore.linkText">
              <GlobeAltIcon class="w-4 h-4" />
              <a
                :href="toastStore.link"
                target="_blank"
                class="text-cyan-400 hover:underline text-sm"
              >
                {{ toastStore.linkText }}
              </a>
            </div>
          </div>
          <button
            @click="toastStore.closeToast()"
            class="text-gray-400 hover:text-white ml-2 flex-shrink-0"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { computed, watch, onBeforeUnmount } from 'vue';
import { useToastStore } from '@/store/toastStore';
import { XMarkIcon, GlobeAltIcon } from '@heroicons/vue/24/outline';

const toastStore = useToastStore();

// Auto-close Timer
let autoCloseTimer = null;

// Watch für neue Toast-Nachrichten
watch(
  () => toastStore.newMessage,
  (newValue) => {
    if (newValue && !toastStore.isConfirmation && toastStore.type !== 'critical' && toastStore.autoClose) {
      // Timer für normale Toast-Nachrichten (nicht für Confirmations oder Critical)
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
      autoCloseTimer = setTimeout(() => {
        toastStore.closeToast();
      }, toastStore.autoCloseDelay);
    } else if (!newValue && autoCloseTimer) {
      // Timer löschen wenn Toast manuell geschlossen wird
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }
  },
  { immediate: true }
);

// Cleanup bei Component-Destroy
onBeforeUnmount(() => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
  }
});

const toastTypeShadow = computed(() => {
  switch (toastStore.type) {
    case 'info':
      return 'shadow-lg shadow-blue-500/50 ring-1 ring-blue-500/50';
    case 'success':
      return 'shadow-lg shadow-green-500/50 ring-1 ring-green-500/50';
    case 'warning':
      return 'shadow-lg shadow-orange-500/50 ring-1 ring-orange-500/50';
    case 'error':
      return 'shadow-lg shadow-red-500/50 ring-1 ring-red-500/50';
    default:
      return '';
  }
});

const toastTypeClasses = computed(() => {
  switch (toastStore.type) {
    case 'info':
      return 'border-l-4 border-blue-500';
    case 'success':
      return 'border-l-4 border-green-500';
    case 'warning':
      return 'border-l-4 border-orange-500';
    case 'error':
      return 'border-l-4 border-red-500';
    default:
      return 'border-l-4 border-cyan-500';
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast-slide-enter-active {
  transition: all 0.3s ease-out;
}
.toast-slide-leave-active {
  transition: all 0.3s ease-in;
}
.toast-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.toast-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
