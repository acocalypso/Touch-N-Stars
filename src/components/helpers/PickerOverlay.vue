<template>
  <Transition name="fade">
    <div
      v-if="pickerStore.isOpen"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
    >
      <div
        class="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 w-full max-h-72 p-4 rounded-t-lg"
        @click.stop
      >
        <div class="max-w-md mx-auto">
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium">{{ $t(`${pickerStore.label}`) }}</label>
            <button
              @click="pickerStore.close()"
              :disabled="hasExceededMax"
              :class="[
                'p-2 rounded-full transition-colors',
                hasExceededMax
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-green-500 hover:bg-gray-700/50 hover:text-green-400',
              ]"
            >
              <CheckIcon class="h-6 w-6" />
            </button>
          </div>
          <div class="flex justify-center mb-3">
            <input
              :value="displayValue"
              type="number"
              :class="[
                'max-w-40 px-3 py-2 bg-gray-800 border rounded text-white placeholder-gray-500 focus:outline-none text-center',
                hasExceededMax
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-600 focus:border-cyan-500',
              ]"
              placeholder="Type a value..."
              @change="
                (e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    pickerStore.updateFromInput(val);
                  }
                }
              "
            />
          </div>
          <div class="flex justify-center items-center mb-3">
            <div v-for="(digit, index) in pickerStore.digits" :key="index">
              <div v-if="digit.isDecimalSeparator" class="text-lg font-bold text-gray-300 mx-1">
                .
              </div>
              <div v-else class="w-12">
                <ScrollPicker :options="digit.options" v-model="digit.value" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';
import { CheckIcon } from '@heroicons/vue/24/solid';
import { usePickerStore } from '@/store/pickerStore';
import ScrollPicker from '@/components/helpers/picker/ScrollPicker.vue';

const pickerStore = usePickerStore();

const displayValue = computed(() => {
  return pickerStore.getValueFromDigits();
});

const hasExceededMax = computed(() => {
  return displayValue.value > pickerStore.maxValue;
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
