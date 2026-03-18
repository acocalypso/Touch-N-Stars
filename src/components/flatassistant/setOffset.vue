<template>
  <NumberInputPicker
    v-model="flatsStore.offset"
    :label="$t('components.camera.offset')"
    labelKey="components.camera.offset"
    :min="0"
    :max="9999"
    :step="1"
    :decimalPlaces="0"
    inputId="offset"
  />
</template>
<script setup>
import { onMounted } from 'vue';
import { useFlatassistantStore } from '@/store/flatassistantStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import { apiStore } from '@/store/store';

const flatsStore = useFlatassistantStore();
const store = apiStore();

onMounted(() => {
  flatsStore.offset = store.profileInfo?.CameraSettings?.Offset;
});
</script>
