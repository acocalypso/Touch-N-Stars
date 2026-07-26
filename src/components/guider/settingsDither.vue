<template>
  <div class="flex flex-col w-full border border-gray-500 p-1 md:p-2 rounded-lg">
    <!-- Dither Pixels -->
    <div class="flex flex-row items-center justify-between">
      <NumberInputPicker
        v-model="ditherPixels"
        :label="$t('components.guider.ditherPixels')"
        labelKey="components.guider.ditherPixels"
        :min="0"
        :max="100"
        :step="1"
        :decimalPlaces="0"
        placeholder="3"
        inputId="ditherPixels"
        wrapperClass="w-24"
        @change="setDitherPixels"
      />
    </div>

    <ProfileToggle
      labelKey="components.guider.ditherRAOnly"
      settingKey="GuiderSettings-DitherRAOnly"
      labelClass="text-xs md:text-sm text-gray-200"
      toggleClass="pr-5 pl-5 justify-center h-7 md:h-8"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import ProfileToggle from '@/components/helpers/settings/ProfileToggle.vue';

const store = apiStore();

const ditherPixels = ref(3.0);

const statusClassDitherPixels = ref('');

const initializeSettings = () => {
  if (!store.profileInfo?.GuiderSettings) {
    console.warn('GuiderSettings not loaded');
    return;
  }

  ditherPixels.value = store.profileInfo.GuiderSettings.DitherPixels ?? 3.0;
};

async function setDitherPixels() {
  try {
    await apiService.profileChangeValue('GuiderSettings-DitherPixels', ditherPixels.value);
    statusClassDitherPixels.value = 'glow-green';
  } catch (error) {
    console.error('Error setting dither pixels:', error);
    statusClassDitherPixels.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassDitherPixels.value = '';
    }, 2000);
  }
}

onMounted(() => {
  initializeSettings();
});
</script>
