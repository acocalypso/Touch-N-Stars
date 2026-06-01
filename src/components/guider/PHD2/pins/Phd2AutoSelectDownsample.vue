<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <label for="phd2-auto-select-downsample" class="text-sm sm:text-xs mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.autoSelectDownsample') }}
    </label>
    <select
      id="phd2-auto-select-downsample"
      v-model="guiderStore.phd2AutoSelectDownsample"
      @change="onChange"
      class="default-select h-8 w-32 ml-auto"
      :disabled="guiderStore.phd2AutoSelectDownsampleLoading"
    >
      <option v-for="option in options" :key="option" :value="option">
        {{ option }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGuiderStore } from '@/store/guiderStore';
import { apiStore } from '@/store/store';

const store = apiStore();
const guiderStore = useGuiderStore();

const options = ['Auto', '1', '2', '3'];

onMounted(async () => {
  await guiderStore.fetchPHD2AutoSelectDownsample();
});

const onChange = async () => {
  const previousValue = guiderStore.phd2AutoSelectDownsample;
  try {
    await guiderStore.setPHD2AutoSelectDownsample(guiderStore.phd2AutoSelectDownsample);
  } catch (error) {
    console.error('Error changing PHD2 auto-select downsample:', error);
    guiderStore.phd2AutoSelectDownsample = previousValue;
  }
};
</script>
