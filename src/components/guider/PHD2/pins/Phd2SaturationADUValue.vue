<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="aduValue"
      :label="$t('components.guider.phd2.saturationADUValue')"
      label-key="components.guider.phd2.saturationADUValue"
      :help-message="$t('components.guider.phd2.help.saturationADUValue')"
      :min="0"
      :max="65535"
      :step="1"
      :decimal-places="0"
      input-id="phd2-saturation-adu-value"
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

const aduValue = computed({
  get() {
    return guiderStore.phd2SaturationADUValue ?? 0;
  },
  set(value) {
    guiderStore.phd2SaturationADUValue = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2SaturationADUValue();
});

const onChange = async (newValue) => {
  const previousValue = guiderStore.phd2SaturationADUValue;
  try {
    await guiderStore.setPHD2SaturationADUValue(newValue);
  } catch (error) {
    console.error('Error changing PHD2 saturation ADU value:', error);
    guiderStore.phd2SaturationADUValue = previousValue;
  }
};
</script>
