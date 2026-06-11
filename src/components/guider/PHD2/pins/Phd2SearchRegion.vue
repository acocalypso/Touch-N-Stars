<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="searchRegionValue"
      :label="$t('components.guider.phd2.searchRegion')"
      label-key="components.guider.phd2.searchRegion"
      :help-message="$t('components.guider.phd2.help.searchRegion')"
      :min="5"
      :max="50"
      :step="1"
      :decimal-places="0"
      input-id="phd2-search-region"
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

const searchRegionValue = computed({
  get() {
    return guiderStore.phd2SearchRegion ?? 15;
  },
  set(value) {
    guiderStore.phd2SearchRegion = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2SearchRegion();
});

const onChange = async (newValue) => {
  try {
    await guiderStore.setPHD2SearchRegion(newValue);
  } catch (error) {
    console.error('Error changing PHD2 search region:', error);
    await guiderStore.fetchPHD2SearchRegion();
  }
};
</script>
