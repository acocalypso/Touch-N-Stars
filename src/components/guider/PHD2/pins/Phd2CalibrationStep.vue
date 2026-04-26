<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="calibrationStepValue"
      :label="$t('components.guider.phd2.calibrationStep')"
      label-key="components.guider.phd2.calibrationStep"
      :min="1"
      :max="10000"
      :step="1"
      :decimal-places="0"
      input-id="phd2-calibration-step"
      @change="onCalibrationStepChange"
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

const calibrationStepValue = computed({
  get() {
    return guiderStore.phd2CalibrationStep ?? 0;
  },
  set(value) {
    guiderStore.phd2CalibrationStep = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2CalibrationStep();
});

const onCalibrationStepChange = async (newValue) => {
  const previousValue = guiderStore.phd2CalibrationStep;
  try {
    await guiderStore.setPHD2CalibrationStep(newValue);
    console.log('Calibration step changed to:', guiderStore.phd2CalibrationStep);
  } catch (error) {
    console.error('Error changing calibration step:', error);
    // Bei Fehler zum vorherigen Wert zurückkehren
    guiderStore.phd2CalibrationStep = previousValue;
  }
};
</script>
