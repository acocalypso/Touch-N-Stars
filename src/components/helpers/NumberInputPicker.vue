<template>
  <div
    class="flex flex-row w-full items-center min-w-28"
    :class="wrapperClass"
  >
    <label v-if="label" :for="inputId" class="text-xs md:text-sm mr-3 mb-1 text-gray-200">
      {{ label }}
    </label>
    <input
      :id="inputId"
      :value="isDefaultValue && defaultValue !== null ? defaultValue : isDefaultValue ? '' : modelValue"
      type="number"
      :class="[
        'default-input h-7 md:h-8',
        wrapperClass === 'w-full' ? 'w-full' : 'w-24 md:w-28 ml-auto',
        statusClass
      ]"
      :placeholder="isDefaultValue && defaultValue === null ? 'default' : placeholder"
      :step="step"
      :min="min"
      :max="max"
      readonly
      @focus="openPicker"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
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
  defaultValue: {
    type: Number,
    required: false,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const { openPicker: openNumberPicker } = useNumberPicker();
const statusClass = ref('');

const isDefaultValue = computed(() => {
  return props.modelValue === -1 || props.modelValue === null || props.modelValue === undefined;
});

function openPicker() {
  let valueToPass;
  if (isDefaultValue.value) {
    valueToPass = props.defaultValue !== null ? props.defaultValue : props.min;
  } else {
    valueToPass = props.modelValue;
  }

  openNumberPicker(
    props.labelKey,
    props.min,
    props.max,
    props.step,
    valueToPass,
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
