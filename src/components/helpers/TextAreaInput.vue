<template>
  <textarea
    :class="inputClass"
    :rows="rows"
    v-model="localValue"
    @focus="focused = true"
    @blur="onBlur"
  />
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  inputClass: { type: String, default: '' },
  rows: { type: Number, default: 3 },
});
const emit = defineEmits(['change']);

const focused = ref(false);
const localValue = ref(props.modelValue ?? '');

watch(
  () => props.modelValue,
  (val) => {
    if (!focused.value) localValue.value = val ?? '';
  }
);

function onBlur() {
  focused.value = false;
  emit('change', localValue.value);
}
</script>
