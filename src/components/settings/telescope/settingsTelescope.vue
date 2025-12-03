<template>
  <div
    class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
  >
    <h3 class="font-bold text-base text-cyan-400">
      {{ $t('components.settings.telescope.titel') }}
    </h3>
    <NumberInputPicker
      v-model="focalLength"
      :label="$t('components.camera.chip_settings.focal_length')"
      labelKey="components.camera.chip_settings.focal_length"
      :min="10"
      :max="5000"
      :step="1"
      :decimalPlaces="0"
      inputId="focal-length"
      @change="updateFocalLength"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

const store = apiStore();

const focalLength = ref(0);

async function updateFocalLength() {
  try {
    await apiService.profileChangeValue('TelescopeSettings-FocalLength', focalLength.value);
  } catch (error) {
    console.error('Error updating FocalLength:', error);
  }
}

onMounted(() => {
  const profile = store.profileInfo;
  focalLength.value = profile?.TelescopeSettings?.FocalLength || 500;
});
</script>
