<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="maxStarHFDValue"
      :label="$t('components.guider.phd2.maxStarHFD')"
      label-key="components.guider.phd2.maxStarHFD"
      :min="0"
      :max="10"
      :step="0.1"
      :decimal-places="1"
      input-id="phd2-max-star-hfd"
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

const maxStarHFDValue = computed({
  get() {
    return guiderStore.phd2MaxStarHFD ?? 0;
  },
  set(value) {
    guiderStore.phd2MaxStarHFD = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2MaxStarHFD();
});

const onChange = async (newValue) => {
  const previousValue = guiderStore.phd2MaxStarHFD;
  try {
    await guiderStore.setPHD2MaxStarHFD(newValue);
  } catch (error) {
    console.error('Error changing PHD2 max star HFD:', error);
    guiderStore.phd2MaxStarHFD = previousValue;
  }
};
</script>
