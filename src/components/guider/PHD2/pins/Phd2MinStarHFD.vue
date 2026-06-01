<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="minStarHFDValue"
      :label="$t('components.guider.phd2.minStarHFD')"
      label-key="components.guider.phd2.minStarHFD"
      :min="0"
      :max="10"
      :step="0.1"
      :decimal-places="1"
      input-id="phd2-min-star-hfd"
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

const minStarHFDValue = computed({
  get() {
    return guiderStore.phd2MinStarHFD ?? 0;
  },
  set(value) {
    guiderStore.phd2MinStarHFD = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2MinStarHFD();
});

const onChange = async (newValue) => {
  const previousValue = guiderStore.phd2MinStarHFD;
  try {
    await guiderStore.setPHD2MinStarHFD(newValue);
  } catch (error) {
    console.error('Error changing PHD2 min star HFD:', error);
    guiderStore.phd2MinStarHFD = previousValue;
  }
};
</script>
