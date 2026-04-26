<template>
  <div v-if="store.isPINS" class="w-full">
    <NumberInputPicker
      v-model="binningValue"
      label="Binning"
      label-key="components.guider.phd2.cameraBinning"
      :min="1"
      :max="8"
      :step="1"
      :decimal-places="0"
      wrapper-class="w-full"
      input-id="phd2-camera-binning"
      @change="onBinningChange"
    />
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useGuiderStore } from '@/store/guiderStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
const guiderStore = useGuiderStore();

const binningValue = computed({
  get() {
    return guiderStore.phd2CameraBinning ?? 1;
  },
  set(value) {
    guiderStore.phd2CameraBinning = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2CameraBinning();
});

const onBinningChange = async (newValue) => {
  const previousValue = guiderStore.phd2CameraBinning;
  try {
    await guiderStore.setPHD2CameraBinning(newValue);
  } catch (error) {
    console.error('Error changing PHD2 camera binning:', error);
    guiderStore.phd2CameraBinning = previousValue;
  }
};
</script>
