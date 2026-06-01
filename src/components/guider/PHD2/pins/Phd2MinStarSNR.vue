<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="snrValue"
      :label="$t('components.guider.phd2.minStarSNR')"
      label-key="components.guider.phd2.minStarSNR"
      :help-message="$t('components.guider.phd2.help.minStarSNR')"
      :min="0"
      :max="100"
      :step="1"
      :decimal-places="0"
      input-id="phd2-min-star-snr"
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

const snrValue = computed({
  get() {
    return guiderStore.phd2MinStarSNR ?? 6;
  },
  set(value) {
    guiderStore.phd2MinStarSNR = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2MinStarSNR();
});

const onChange = async (newValue) => {
  const previousValue = guiderStore.phd2MinStarSNR;
  try {
    await guiderStore.setPHD2MinStarSNR(newValue);
  } catch (error) {
    console.error('Error changing PHD2 min star SNR:', error);
    guiderStore.phd2MinStarSNR = previousValue;
  }
};
</script>
