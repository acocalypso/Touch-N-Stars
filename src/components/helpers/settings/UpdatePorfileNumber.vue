<template>
  <div class="flex flex-col md:flex-row w-full md:items-center">
    <NumberInputPicker
      v-model="value"
      :label="$t(`${labelKey}`)"
      :labelKey="labelKey"
      :helpMessage="helpKey ? $t(`${helpKey}`) : ''"
      :min="min"
      :max="max"
      :step="step"
      :decimalPlaces="decimalPlaces"
      :placeholder="placeholder"
      :useDefaultSentinel="modelDefaultValue !== null"
      wrapperClass="flex-1"
      @change="updateSetting"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import apiService from '@/services/apiService';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const props = defineProps({
  labelKey: {
    type: String,
    required: true,
  },
  helpKey: {
    type: String,
    default: '',
  },
  settingKey: {
    type: String,
    required: true,
  },
  modelValue: {
    type: Number,
    required: true,
  },
  // Fallback for settings that use -1 as a "use the inherited default" sentinel (plate-solve Gain
  // falls back to the camera's, a filter's AutoFocus exposure time to the focuser's). Leave it unset
  // for every other setting, where -1 is an ordinary value and must not be substituted.
  modelDefaultValue: {
    type: Number,
    default: null,
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
const isFocused = ref(false);
const isWriting = ref(false);

const decimalPlaces = computed(() => {
  const stepStr = String(props.step);
  return stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
});

// Only honour the -1 sentinel when the caller actually supplied something to fall back to.
function resolveValue(v) {
  return v === -1 && props.modelDefaultValue !== null ? props.modelDefaultValue : v;
}

async function updateSetting() {
  let settingValue = String(value.value).replace(',', '.');
  isWriting.value = true;
  try {
    await apiService.profileChangeValue(`${props.settingKey}`, settingValue);
  } catch (error) {
    console.error('Error updating setting:', error);
  } finally {
    isWriting.value = false;
  }
}

onMounted(() => {
  value.value = resolveValue(props.modelValue);
});

// Keep the input in sync when the profile changes underneath us (another client or a plugin writing
// the setting). profileInfo is refreshed by the polling loop, so an in-flight response can still
// carry the pre-edit value -- don't fight the user by re-seeding an input they are editing.
watch(
  () => props.modelValue,
  (v) => {
    if (isFocused.value || isWriting.value) return;
    value.value = resolveValue(v);
  }
);
</script>
