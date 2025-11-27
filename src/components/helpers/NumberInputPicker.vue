<template>
  <div
    class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 md:p-2 rounded-lg"
    :class="wrapperClass"
  >
    <label v-if="label" :for="inputId" class="text-xs md:text-sm mr-3 mb-1 text-gray-200">
      {{ label }}
    </label>
    <input
      :id="inputId"
      :value="modelValue"
      type="number"
      class="default-input ml-auto h-7 md:h-8 w-20 md:w-28"
      :class="statusClass"
      :placeholder="placeholder"
      :step="step"
      :min="min"
      :max="max"
      readonly
      @focus="openPicker"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useNumberPicker } from '@/composables/useNumberPicker';

const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  label: {
    type: String,
    required: false,
    default: '',
  },
  labelKey: {
    type: String,
    required: true,
  },
  min: {
    type: Number,
    required: true,
  },
  max: {
    type: Number,
    required: true,
  },
  step: {
    type: Number,
    required: true,
  },
  decimalPlaces: {
    type: Number,
    required: false,
    default: null,
  },
  placeholder: {
    type: String,
    required: false,
    default: '',
  },
  wrapperClass: {
    type: String,
    required: false,
    default: '',
  },
  inputId: {
    type: String,
    required: false,
    default: 'number-input',
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const { openPicker: openNumberPicker } = useNumberPicker();
const statusClass = ref('');

function openPicker() {
  openNumberPicker(
    props.labelKey,
    props.min,
    props.max,
    props.step,
    props.modelValue,
    (newValue) => {
      emit('update:modelValue', newValue);
      statusClass.value = 'glow-green';
      emit('change', newValue);
      setTimeout(() => {
        statusClass.value = '';
      }, 1000);
    },
    props.decimalPlaces
  );
}
</script>
