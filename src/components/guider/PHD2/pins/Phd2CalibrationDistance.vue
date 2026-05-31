<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="calibrationDistanceValue"
      :label="$t('components.guider.phd2.calibDistance')"
      label-key="components.guider.phd2.calibDistance"
      :min="10"
      :max="200"
      :step="1"
      :decimal-places="0"
      input-id="phd2-calibration-distance"
      @change="onCalibrationDistanceChange"
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

const calibrationDistanceValue = computed({
  get() {
    return guiderStore.phd2CalibrationDistance ?? 25;
  },
  set(value) {
    guiderStore.phd2CalibrationDistance = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2CalibrationDistance();
});

const onCalibrationDistanceChange = async (newValue) => {
  const previousValue = guiderStore.phd2CalibrationDistance;
  try {
    await guiderStore.setPHD2CalibrationDistance(newValue);
  } catch (error) {
    console.error('Error changing calibration distance:', error);
    guiderStore.phd2CalibrationDistance = previousValue;
  }
};
</script>
