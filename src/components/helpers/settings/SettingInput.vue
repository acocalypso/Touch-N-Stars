<template>
  <div
    class="flex flex-col md:flex-row w-full md:items-center border border-gray-500 p-1 rounded-lg"
  >
    <label class="text-sm sm:text-xs md:mr-3 mb-2 md:mb-1 text-gray-200">{{
      $t(`${labelKey}`)
    }}</label>
    <input
      @change="updateSetting"
      @blur="updateSetting"
      @focus="openPickerOverlay"
      :class="[statusClass]"
      v-model.number="value"
      type="number"
      :min="min"
      :max="max"
      :step="step"
      class="default-input h-8 w-full md:w-28 md:ml-auto py-2"
      :placeholder="placeholder"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/apiService';

const props = defineProps({
  labelKey: {
    type: String,
    required: true,
  },
  settingKey: {
    type: String,
    required: true,
  },
  modelValue: {
    type: Number,
    required: true,
  },
  modelDefaultValue: {
    type: Number,
    default: 0,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100000,
  },
  step: {
    type: Number,
    default: 1,
  },
  placeholder: {
    type: String,
    default: '100',
  },
});

const value = ref(0);
const statusClass = ref('');

function openPickerOverlay() {
  // Bestimme Dezimalplätze basierend auf step
  const stepStr = String(props.step);
  const decimalPlaces = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;

  const pickerOptions = [];
  if (decimalPlaces > 0) {
    // Dezimalzahlen
    const step = parseFloat(props.step);
    let current = props.min;
    while (current <= props.max + 0.0001) {
      // Kleine Toleranz für Floating Point
      pickerOptions.push({
        name: current.toFixed(decimalPlaces),
        value: parseFloat(current.toFixed(decimalPlaces)),
      });
      current += step;
    }
  } else {
    // Integer
    for (let i = props.min; i <= props.max; i += props.step) {
      pickerOptions.push({
        name: i.toString(),
        value: i,
      });
    }
  }

  window.openPickerOverlay(
    props.labelKey,
    pickerOptions,
    value.value,
    (newValue) => {
      // Runde auf die richtige Dezimalstelle
      const rounded =
        decimalPlaces > 0 ? parseFloat(newValue.toFixed(decimalPlaces)) : Math.round(newValue);
      value.value = rounded;
      updateSetting();
    },
    decimalPlaces
  );
}

async function updateSetting() {
  let settingValue = String(value.value).replace(',', '.');
  try {
    const response = await apiService.profileChangeValue(`${props.settingKey}`, settingValue);
    if (!response.Success) return;
    statusClass.value = 'glow-green';
  } catch (error) {
    console.log('Error save setting');
  }
  setTimeout(() => {
    statusClass.value = '';
  }, 1000);
}

onMounted(() => {
  if (props.modelValue === -1) {
    value.value = props.modelDefaultValue;
    return;
  } else {
    value.value = props.modelValue;
  }
});
</script>
