<template>
  <div v-if="store.isPINS" class="w-full">
    <NumberInputPicker
      v-model="gainValue"
      label="Gain"
      label-key="components.guider.phd2.cameraGain"
      :min="-1"
      :max="10000"
      :step="1"
      :decimal-places="0"
      wrapper-class="w-full"
      input-id="phd2-camera-gain"
      @change="onGainChange"
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

const gainValue = computed({
  get() {
    return guiderStore.phd2CameraGain ?? -1;
  },
  set(value) {
    guiderStore.phd2CameraGain = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2CameraGain();
});

const onGainChange = async (newValue) => {
  const previousValue = guiderStore.phd2CameraGain;
  try {
    await guiderStore.setPHD2CameraGain(newValue);
  } catch (error) {
    console.error('Error changing PHD2 camera gain:', error);
    guiderStore.phd2CameraGain = previousValue;
  }
};
</script>
