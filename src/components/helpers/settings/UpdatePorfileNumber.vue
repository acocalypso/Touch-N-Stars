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
      readonly
      class="default-input h-8 w-full md:w-28 md:ml-auto py-2"
      :placeholder="placeholder"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { usePickerStore } from '@/store/pickerStore';
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
const pickerStore = usePickerStore();

const decimalPlaces = computed(() => {
  const stepStr = String(props.step);
  return stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
});

function openPickerOverlay() {
  pickerStore.createDigitPickers(props.labelKey, props.min, props.max, props.step, value.value, decimalPlaces.value);
  pickerStore.open(props.labelKey, [], value.value, (newValue) => {
    value.value = newValue;
    updateSetting();
  }, decimalPlaces.value);
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
