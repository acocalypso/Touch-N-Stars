<template>
  <div v-if="store.isPINS" class="flex flex-row w-full items-center min-w-28">
    <NumberInputPicker
      v-model="backlashAmountValue"
      :label="$t('components.guider.phd2.backlash.amount')"
      label-key="components.guider.phd2.backlash.amount"
      :help-message="$t('components.guider.phd2.help.backlashAmount')"
      :min="amountMin"
      :max="amountMax"
      :step="1"
      :decimal-places="0"
      input-id="phd2-backlash-amount"
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

const backlashAmountValue = computed({
  get() {
    return guiderStore.phd2BacklashPulseWidth ?? 0;
  },
  set(value) {
    guiderStore.phd2BacklashPulseWidth = value;
  },
});

// PHD2 requires floor <= pulseWidth <= ceiling, so constrain the amount to that range.
const amountMin = computed(() => guiderStore.phd2BacklashFloor ?? 0);
const amountMax = computed(() => guiderStore.phd2BacklashCeiling ?? 10000);

onMounted(async () => {
  await guiderStore.fetchPHD2BacklashComp();
});

const onChange = async (newValue) => {
  try {
    await guiderStore.setPHD2BacklashPulseWidth(newValue);
  } catch (error) {
    console.error('Error changing PHD2 backlash amount:', error);
    await guiderStore.fetchPHD2BacklashComp();
  }
};
</script>
