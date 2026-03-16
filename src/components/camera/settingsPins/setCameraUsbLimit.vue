<template>
  <div
    v-if="store.checkVersionNewerOrEqual(store.currentApiVersion, '2.2.14.3')"
    class="flex items-center w-full justify-between border border-gray-500 p-1 md:p-2 rounded-lg"
  >
    <label for="setUsbLimit" class="text-xs md:text-sm text-gray-200 font-medium">
      {{ $t('components.camera.usb_limit') }}
    </label>
    <select
      @change="setUsbLimit"
      id="setUsbLimit"
      v-model="usbLimit"
      class="default-select h-7 md:h-8 w-20 md:w-28"
    >
      <option v-for="n in 11" :key="n" :value="n - 1">
        {{ n - 1 }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const store = apiStore();
const usbLimit = ref(9);

onMounted(() => {
  usbLimit.value = store.cameraInfo.USBLimit;
  console.log('USB', usbLimit.value);
});

async function setUsbLimit() {
  try {
    const response = await apiService.setCamerUsbLimit(usbLimit.value);
    console.log('[setUsbLimit] ', response);
    await apiService.profileChangeValue('CameraSettings-USBLimit', usbLimit.value);
  } catch (error) {
    console.log('Error while setting USB limit');
  }
}
</script>
