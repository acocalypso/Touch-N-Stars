<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="scaleValue"
      :label="$t('components.guider.phd2.ditherScale')"
      label-key="components.guider.phd2.ditherScale"
      :help-message="$t('components.guider.phd2.help.ditherScale')"
      :min="0"
      :max="10"
      :step="0.1"
      :decimal-places="1"
      input-id="phd2-dither-scale"
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

const scaleValue = computed({
  get() {
    return guiderStore.phd2DitherScale ?? 1;
  },
  set(value) {
    guiderStore.phd2DitherScale = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2DitherScale();
});

const onChange = async (newValue) => {
  try {
    await guiderStore.setPHD2DitherScale(newValue);
  } catch (error) {
    // v-model already mutated the store, so reload the real value from the server on failure.
    console.error('Error changing PHD2 dither scale:', error);
    await guiderStore.fetchPHD2DitherScale();
  }
};
</script>
