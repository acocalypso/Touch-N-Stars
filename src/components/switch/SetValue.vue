<template>
  <NumberInputPicker
    v-model="localValue"
    labelKey="components.switch.value"
    :min="props.min"
    :max="props.max"
    :step="1"
    :decimalPlaces="2"
    inputId="switch-value"
    @change="emitValue"
  />
</template>
<script setup>
import { ref, onMounted } from 'vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const emit = defineEmits(['blur']);
const props = defineProps({
  storeValue: {
    type: Number,
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
});
const localValue = ref(0);

function emitValue() {
  emit('blur', localValue.value);
}

onMounted(() => {
  localValue.value = props.storeValue;
});
</script>
