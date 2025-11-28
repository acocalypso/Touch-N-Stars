<template>
  <div class="flex flex-col border border-gray-500 p-1 pb-2 rounded-lg w-full">
    <div class="flex gap-2 items-end">
      <NumberInputPicker
        v-model="azimuth"
        :label="$t('components.dome.control.slew_label')"
        labelKey="components.dome.control.slew_label"
        :min="0"
        :max="360"
        :step="1"
        :decimalPlaces="0"
        placeholder="1"
        inputId="azimuth"
      />
      <button
        class="default-button-cyan h-7 md:h-8"
        @click="slewDome"
        :disabled="store.domeInfo.Slewing || isSlewing"
      >
        <label>{{ $t('components.dome.control.slew') }}</label>
        <div
          v-if="store.domeInfo.Slewing || isSlewing"
          class="ml-2 w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </button>
      <button @click="stopSlew" class="default-button-red w-16 mr-1">
        <StopCircleIcon class="w-8 h-8" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useI18n } from 'vue-i18n';
import { StopCircleIcon } from '@heroicons/vue/24/outline';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const { t } = useI18n();
const store = apiStore();
const azimuth = ref(0);
const isSlewing = ref(false);

async function slewDome() {
  isSlewing.value = true;
  try {
    await apiService.domeAction(`slew?waitToFinish=true&azimuth=${azimuth.value}`);
    isSlewing.value = false;
    if (store.domeInfo.Azimuth.toFixed(0) === azimuth.value.toFixed(0)) {
      console.log('Slewing to the same azimuth, stopping slew.');
      isSlewing.value = false;
    } else {
      console.log('Slewing to azimuth:', azimuth.value);
    }
  } catch (error) {
    isSlewing.value = false;
    console.error('Error stopping slew:', error);
  }
}

async function stopSlew() {
  try {
    const response = await apiService.domeAction('stop');
    if (!response.Success) return;
    isSlewing.value = false;
    console.log('Stopping slew:', response);
  } catch (error) {
    console.log(t('components.dome.control.errors.stop_slew'));
  }
}

onMounted(() => {
  if (store.domeInfo.Azimuth !== undefined && !isNaN(store.domeInfo.Azimuth)) {
    azimuth.value = store.domeInfo.Azimuth.toFixed(1);
  } else {
    azimuth.value = 0;
  }
});
</script>
