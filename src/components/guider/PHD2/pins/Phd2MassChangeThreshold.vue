<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="thresholdValue"
      :label="$t('components.guider.phd2.massChangeThreshold')"
      label-key="components.guider.phd2.massChangeThreshold"
      :min="0"
      :max="100"
      :step="1"
      :decimal-places="1"
      input-id="phd2-mass-change-threshold"
      @change="onChange"
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

const thresholdValue = computed({
  get() {
    return guiderStore.phd2MassChangeThreshold ?? 50;
  },
  set(value) {
    guiderStore.phd2MassChangeThreshold = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2MassChangeThreshold();
});

const onChange = async (newValue) => {
  const previousValue = guiderStore.phd2MassChangeThreshold;
  try {
    await guiderStore.setPHD2MassChangeThreshold(newValue);
  } catch (error) {
    console.error('Error changing PHD2 mass change threshold:', error);
    guiderStore.phd2MassChangeThreshold = previousValue;
  }
};
</script>
