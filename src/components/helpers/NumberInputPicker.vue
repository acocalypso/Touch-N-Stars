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
    <div
      :class="[
        'flex items-center',
        labelPosition === 'top' ? 'w-full' : 'ml-auto',
        labelPosition === 'top' ? '' : wrapperClass === 'w-full' ? 'w-full' : 'w-24 md:w-28',
      ]"
    >
      <button
        type="button"
        class="flex items-center justify-center shrink-0 w-8 h-10 rounded-l-lg bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-lg font-bold border border-gray-600 select-none"
        @click="stepDown"
      >
        &minus;
      </button>
      <input
        :id="inputId"
        :value="formattedValue"
        type="number"
        :class="['default-input h-10 rounded-none border-x-0 text-center min-w-0 flex-1', statusClass]"
        :placeholder="isDefaultValue && defaultValue === null ? 'default' : placeholder"
        :step="step"
        :min="min"
        :max="max"
        :readonly="settingsStore.touchOptimized"
        @focus="openPicker"
        @input="onDirectInput"
      />
      <button
        type="button"
        class="flex items-center justify-center shrink-0 w-8 h-10 rounded-r-lg bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-lg font-bold border border-gray-600 select-none"
        @click="stepUp"
      >
        +
      </button>
    </div>
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

function emitWithGlow(value) {
  emit('update:modelValue', value);
  emit('change', value);
  statusClass.value = 'glow-green';
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}

const isDefaultValue = computed(() => {
  return props.modelValue === -1 || props.modelValue === null || props.modelValue === undefined;
});

const formattedValue = computed(() => {
  if (isDefaultValue.value) {
    return props.defaultValue !== null ? props.defaultValue : '';
  }
  if (props.decimalPlaces !== null) {
    return Number(props.modelValue).toFixed(props.decimalPlaces);
  }
  return props.modelValue;
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
      emitWithGlow(newValue);
    },
    props.decimalPlaces
  );
}

function currentValue() {
  if (isDefaultValue.value) {
    return props.defaultValue !== null ? props.defaultValue : props.min;
  }
  return props.modelValue;
}

function stepDown() {
  const newValue = Math.max(currentValue() - props.step, props.min);
  emitWithGlow(parseFloat(newValue.toFixed(10)));
}

function stepUp() {
  const newValue = Math.min(currentValue() + props.step, props.max);
  emitWithGlow(parseFloat(newValue.toFixed(10)));
}

function onDirectInput(event) {
  const value = event.target.value;
  if (value === '' || value === null) {
    emit('update:modelValue', -1);
  } else {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const clamped = Math.min(Math.max(numValue, props.min), props.max);
      emitWithGlow(clamped);
    }
  }
}
</script>
