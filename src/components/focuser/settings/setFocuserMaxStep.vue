<template>
  <div
    v-if="store.focuserInfo.CanSetMaxStep"
    class="flex flex-row items-center justify-start"
  >
    <NumberInputPicker
      v-model="maxStep"
      :label="$t('components.focuser.settings.MaxStep')"
      labelKey="components.focuser.settings.MaxStep"
      :min="0"
      :max="999999"
      :step="1"
      :decimalPlaces="0"
      placeholder="1000"
      inputId="maxStep"
      @change="updateSetting"
      :disabled="store.focuserInfo.IsMoving"
    />
  </div>
</template>
<script setup>
//#################################
//This is PINS only
//#################################
import { ref, watch } from 'vue';
import { apiStore } from '@/store/store';
import apiPinsService from '@/services/apiPinsService';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const store = apiStore();
const maxStep = ref(0);

async function updateSetting() {
  try {
    const response = await apiPinsService.focuserAction(`maxstep?position=${maxStep.value}`);

    if (!response.Success) {
      // Revert on error
      maxStep.value = store.profileInfo?.FocuserSettings?.MaxStep ?? 0;
    }
  } catch (error) {
    console.log('Error save setting', error);
    // Revert on error
    maxStep.value = store.profileInfo?.FocuserSettings?.MaxStep ?? 0;
  }
}

watch(
  () => store.focuserInfo.MaxStep,
  (newValue) => {
    if (newValue !== undefined) {
      maxStep.value = newValue;
    }
  },
  { immediate: true }
);
</script>
