<template>
  <Transition name="fade">
    <div
      v-if="pickerStore.isOpen"
      class="fixed inset-0 z-50 flex flex-col items-center justify-end bg-black/40 backdrop-blur-sm"
      @click="pickerStore.cancel()"
    >
      <!-- Floating value display above the bottom sheet -->
      <div class="mb-4 flex flex-col items-center pointer-events-none" @click.stop>
        <label class="text-xs text-gray-400 mb-1">{{ $t(`${pickerStore.label}`) }}</label>
        <span
          :class="[
            'text-4xl font-bold tabular-nums drop-shadow-lg',
            pickerStore.isOutOfRange ? 'text-red-400' : 'text-white',
          ]"
        >
          {{ pickerStore.displayValue }}
        </span>
      </div>
      <!-- Bottom sheet -->
      <div
        class="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 w-full p-4 rounded-t-lg"
        @click.stop
      >
        <div class="max-w-sm mx-auto">
          <!-- Cancel / Confirm bar -->
          <div class="flex items-center justify-between mb-3">
            <button
              @click="pickerStore.cancel()"
              class="p-2 rounded-full transition-colors text-red-500 hover:bg-gray-700/50 hover:text-red-400"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
            <button
              @click="pickerStore.close()"
              :disabled="isConfirmDisabled"
              :class="[
                'p-2 rounded-full transition-colors',
                isConfirmDisabled
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-green-500 hover:bg-gray-700/50 hover:text-green-400',
              ]"
            >
              <CheckIcon class="h-6 w-6" />
            </button>
          </div>
          <!-- Numpad grid -->
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="n in [1, 2, 3]"
              :key="n"
              @click="pickerStore.appendDigit(n)"
              class="numpad-btn"
            >
              {{ n }}
            </button>
            <button @click="pickerStore.backspace()" class="numpad-btn numpad-action">
              <BackspaceIcon class="h-6 w-6 mx-auto" />
            </button>

            <button
              v-for="n in [4, 5, 6]"
              :key="n"
              @click="pickerStore.appendDigit(n)"
              class="numpad-btn"
            >
              {{ n }}
            </button>
            <button @click="pickerStore.clearInput()" class="numpad-btn numpad-action">C</button>

            <button
              v-for="n in [7, 8, 9]"
              :key="n"
              @click="pickerStore.appendDigit(n)"
              class="numpad-btn"
            >
              {{ n }}
            </button>
            <button
              v-if="pickerStore.isNegativeAllowed"
              @click="pickerStore.toggleSign()"
              class="numpad-btn numpad-action"
            >
              +/-
            </button>
            <div v-else></div>

            <!-- Bottom row -->
            <button
              v-if="pickerStore.decimalPlaces > 0"
              @click="pickerStore.appendDecimal()"
              :disabled="pickerStore.hasDecimalPoint"
              class="numpad-btn"
            >
              .
            </button>
            <button
              @click="pickerStore.appendDigit(0)"
              :class="['numpad-btn', pickerStore.decimalPlaces === 0 ? 'col-span-2' : '']"
            >
              0
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';
import { CheckIcon, XMarkIcon, BackspaceIcon } from '@heroicons/vue/24/solid';
import { usePickerStore } from '@/store/pickerStore';

const pickerStore = usePickerStore();

const isConfirmDisabled = computed(() => {
  return (
    pickerStore.isOutOfRange || pickerStore.inputString === '' || pickerStore.inputString === '-'
  );
});
</script>

<style scoped>
.numpad-btn {
  @apply h-14 rounded-lg text-xl font-semibold
    bg-gray-800 text-gray-200
    active:bg-gray-600
    transition-colors
    flex items-center justify-center
    select-none;
}

.numpad-action {
  @apply bg-gray-700 text-gray-300;
}

.numpad-btn:disabled {
  @apply opacity-30;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
