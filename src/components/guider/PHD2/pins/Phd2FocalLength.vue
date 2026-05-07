<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="focalLengthValue"
      :label="$t('components.guider.phd2.focalLength')"
      label-key="components.guider.phd2.focalLength"
      :min="1"
      :max="10000"
      :step="1"
      :decimal-places="0"
      input-id="phd2-focal-length"
      @change="onFocalLengthChange"
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

const focalLengthValue = computed({
  get() {
    return guiderStore.phd2FocalLength ?? 0;
  },
  set(value) {
    guiderStore.phd2FocalLength = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2FocalLength();
});

const onFocalLengthChange = async (newValue) => {
  const previousValue = guiderStore.phd2FocalLength;
  try {
    await guiderStore.setPHD2FocalLength(newValue);
    console.log('Focal length changed to:', guiderStore.phd2FocalLength);
  } catch (error) {
    console.error('Error changing focal length:', error);
    // Bei Fehler zum vorherigen Wert zurückkehren
    guiderStore.phd2FocalLength = previousValue;
  }
};
</script>
