<template>
  <div
    :class="[
      labelPosition === 'top' ? '' : 'flex flex-row w-full items-center min-w-28',
      wrapperClass,
    ]"
  >
    <label
      v-if="label"
      :for="inputId"
      :class="
        labelPosition === 'top'
          ? 'block text-sm font-medium text-gray-300 mb-2'
          : 'text-xs md:text-sm mr-3 mb-1 text-gray-200'
      "
    >
      {{ label }}
    </label>
    <input
      :id="inputId"
      :value="
        isDefaultValue && defaultValue !== null ? defaultValue : isDefaultValue ? '' : modelValue
      "
      type="number"
      :class="[
        labelPosition === 'top' ? 'default-input w-full py-2' : 'default-input h-10',
        labelPosition === 'top'
          ? ''
          : wrapperClass === 'w-full'
            ? 'w-full'
            : 'w-24 md:w-28 ml-auto',
        statusClass,
      ]"
      :placeholder="isDefaultValue && defaultValue === null ? 'default' : placeholder"
      :step="step"
      :min="min"
      :max="max"
      :readonly="settingsStore.touchOptimized"
      @focus="openPicker"
      @input="onDirectInput"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useNumberPicker } from '@/composables/useNumberPicker';
import { useSettingsStore } from '@/store/settingsStore';

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
  labelPosition: {
    type: String,
    required: false,
    default: 'left',
    validator: (value) => ['left', 'top'].includes(value),
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const { openPicker: openNumberPicker } = useNumberPicker();
const settingsStore = useSettingsStore();
const statusClass = ref('');

const isDefaultValue = computed(() => {
  return props.modelValue === -1 || props.modelValue === null || props.modelValue === undefined;
});

function openPicker() {
  // If touch optimization is disabled, don't open picker
  if (!settingsStore.touchOptimized) {
    return;
  }

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

function onDirectInput(event) {
  const value = event.target.value;
  if (value === '' || value === null) {
    emit('update:modelValue', -1);
  } else {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      emit('update:modelValue', numValue);
      statusClass.value = 'glow-green';
      emit('change', numValue);
      setTimeout(() => {
        statusClass.value = '';
      }, 1000);
    }
  }
}
</script>
