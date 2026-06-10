<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="backlashMinValue"
      :label="$t('components.guider.phd2.backlash.min')"
      label-key="components.guider.phd2.backlash.min"
      :help-message="$t('components.guider.phd2.help.backlashMin')"
      :min="0"
      :max="10000"
      :step="1"
      :decimal-places="0"
      input-id="phd2-backlash-min"
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

const backlashMinValue = computed({
  get() {
    return guiderStore.phd2BacklashFloor ?? 0;
  },
  set(value) {
    guiderStore.phd2BacklashFloor = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2BacklashComp();
});

const onChange = async (newValue) => {
  try {
    await guiderStore.setPHD2BacklashFloor(newValue);
  } catch (error) {
    console.error('Error changing PHD2 backlash min:', error);
    await guiderStore.fetchPHD2BacklashComp();
  }
};
</script>
