<template>
  <div class="scroll-picker-wrapper">
    <VueScrollPicker
      :options="options"
      :modelValue="modelValue"
      @update:modelValue="emits('update:modelValue', $event)"
    />
  </div>
</template>

<script setup>
import { VueScrollPicker } from 'vue-scroll-picker';
import 'vue-scroll-picker/style.css';

defineProps({
  options: {
    type: Array,
    required: true,
    default: () => [],
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
});

const emits = defineEmits(['update:modelValue']);
</script>

<style scoped>
/* VueScrollPicker Styling */
:deep(.vue-scroll-picker) {
  background-color: rgb(55 65 81); /* gray-700 */
  border: 1px solid rgb(34 197 94 / 0.2); /* cyan border */
  border-radius: 0.5rem;
}

:deep(.vue-scroll-picker-item) {
  color: rgb(209 213 219); /* gray-300 */
  line-height: 1.2em;
}

:deep(.vue-scroll-picker-item[aria-selected='true']) {
  color: rgb(34 197 94); /* cyan-500 */
  font-weight: 600;
}

:deep(.vue-scroll-picker-item[data-value=''], .vue-scroll-picker-item[aria-disabled='true']) {
  color: rgb(107 114 128); /* gray-500 */
}

:deep(.vue-scroll-picker-layer-top) {
  background: linear-gradient(180deg, rgb(55 65 81) 10%, rgba(55, 65, 81, 0.5));
  border-bottom: 1px solid rgb(34 197 94 / 0.3);
}

:deep(.vue-scroll-picker-layer-bottom) {
  background: linear-gradient(0deg, rgb(55 65 81) 10%, rgba(55, 65, 81, 0.5));
  border-top: 1px solid rgb(34 197 94 / 0.3);
}
</style>
