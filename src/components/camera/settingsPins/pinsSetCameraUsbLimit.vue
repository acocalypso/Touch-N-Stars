<template>
  <div
    class="flex items-center w-full justify-between border border-line-strong p-1 md:p-2 rounded-control"
  >
    <label for="setUsbLimit" class="text-xs md:text-sm text-content font-medium">
      {{ $t('components.camera.usb_limit') }}
    </label>
    <select
      @change="setUsbLimit"
      id="setUsbLimit"
      v-model="usbLimit"
      class="tns-select w-20 md:w-28"
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
    const cameraResponse = await apiService.cameraAction(
      `set-setting?settingName=USBLimit&newValue=${usbLimit.value}`
    );
    console.log('[pinsSetUsbLimit Camera] ', cameraResponse);
    const profileResponse = await apiService.profileChangeValue(
      'CameraSettings-USBLimit',
      usbLimit.value
    );
    console.log('[pinsSetUsbLimit Profile] ', profileResponse);
  } catch (error) {
    console.log('[pinsSetUsbLimit] Error while setting USB limit', error);
  }
}
</script>
