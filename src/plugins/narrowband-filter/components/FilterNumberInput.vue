<template>
  <div
    class="flex items-center justify-between w-full"
    :class="{ 'opacity-50 pointer-events-none': disabled }"
  >
    <label class="text-sm font-medium text-gray-300 whitespace-nowrap">
      {{ $t(labelKey) }}
    </label>
    <input
      :value="formattedValue"
      type="number"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      class="h-8 w-24 rounded-lg border border-gray-600 bg-gray-700/50 px-2 text-sm text-white text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
      @focus="openPicker"
      @input="onDirectInput"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNumberPicker } from '@/composables/useNumberPicker';
import { useSettingsStore } from '@/store/settingsStore';

const settingsStore = useSettingsStore();
const { openPicker: openNumberPicker } = useNumberPicker();

const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
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
  disabled: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const formattedValue = computed(() => {
  let decimal = props.decimalPlaces;
  if (decimal === null || decimal === undefined) {
    const stepStr = String(props.step);
    decimal = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
  }
  return props.modelValue.toFixed(decimal);
});

function onDirectInput(event) {
  let value = parseFloat(event.target.value);

  if (isNaN(value)) {
    value = props.min;
  }

  value = Math.max(props.min, Math.min(props.max, value));
  emit('update:modelValue', value);
}

function openPicker() {
  if (!settingsStore.touchOptimized || props.disabled) return;

  openNumberPicker(
    props.labelKey,
    props.min,
    props.max,
    props.step,
    props.modelValue,
    (newValue) => {
      emit('update:modelValue', newValue);
    },
    props.decimalPlaces
  );
}
</script>
