<template>
  <div
    v-if="store.checkVersionNewerOrEqual(store.currentApiVersion, '2.2.14.3')"
    class="flex items-center w-full justify-between border border-gray-500 p-1 md:p-2 rounded-lg"
  >
    <label for="setUsbLimit" class="text-xs md:text-sm text-gray-200 font-medium">
      {{ $t('components.camera.usb_limit') }} PINS
    </label>
    <select
      @change="setUsbLimit"
      id="setUsbLimit"
      v-model="usbLimit"
      class="default-select h-7 md:h-8 w-20 md:w-28"
    >
      <option v-for="n in store.cameraInfo.USBLimitMax" :key="n" :value="n">
        {{ n }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { useCameraStore } from '@/store/cameraStore';

const store = apiStore();
const cameraStore = useCameraStore();
const usbLimit = ref(9);

onMounted(() => {
  usbLimit.value = cameraStore.cameraSettings.USBLimit;
});

async function setUsbLimit() {
  try {
    //equipment/filterwheel/set-setting?settingName=Unidirectional&newValue=false
    const response = await apiService.cameraAction(`set-setting?settingName=USBLimit&newValue=${usbLimit.value}`);
    console.log('[setUsbLimit] ', response);
  } catch (error) {
    console.log('Error while setting USB limit');
  }
}
</script>
