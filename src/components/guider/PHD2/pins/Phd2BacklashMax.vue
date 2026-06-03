<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="backlashMaxValue"
      :label="$t('components.guider.phd2.backlash.max')"
      label-key="components.guider.phd2.backlash.max"
      :help-message="$t('components.guider.phd2.help.backlashMax')"
      :min="0"
      :max="10000"
      :step="1"
      :decimal-places="0"
      input-id="phd2-backlash-max"
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

const backlashMaxValue = computed({
  get() {
    return guiderStore.phd2BacklashCeiling ?? 0;
  },
  set(value) {
    guiderStore.phd2BacklashCeiling = value;
  },
});

onMounted(async () => {
  await guiderStore.fetchPHD2BacklashComp();
});

const onChange = async (newValue) => {
  try {
    await guiderStore.setPHD2BacklashCeiling(newValue);
  } catch (error) {
    console.error('Error changing PHD2 backlash max:', error);
    await guiderStore.fetchPHD2BacklashComp();
  }
};
</script>
