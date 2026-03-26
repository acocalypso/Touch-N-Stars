<template>
  <div
    v-if="focuserStore.focuserSettings?.USBCapacities !== undefined"
    class="flex items-center w-full justify-between border border-gray-500 p-1 md:p-2 rounded-lg"
  >
    <label for="setUSBCapacity" class="text-xs md:text-sm text-gray-200 font-medium">
      {{ $t('components.focuser.settings.USBCapacity') }}
    </label>
    <select
      id="setUSBCapacity"
      v-model="usbCapacity"
      @change="setUSBCapacity"
      class="default-select h-7 md:h-8 w-24 md:w-32"
    >
      <option
        v-for="(label, index) in focuserStore.focuserSettings.USBCapacities"
        :key="index"
        :value="index"
      >
        {{ label }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import apiService from '@/services/apiService';
import { useFocuserStore } from '@/store/focuserStore';

const focuserStore = useFocuserStore();
const usbCapacity = ref(0);

onMounted(() => {
  usbCapacity.value = focuserStore.focuserSettings?.USBCapacity ?? 0;
});

watch(
  () => focuserStore.focuserSettings?.USBCapacity,
  (val) => {
    if (val !== undefined) usbCapacity.value = val;
  }
);

async function setUSBCapacity() {
  try {
    await apiService.focusAction(
      `set-setting?settingName=USBCapacity&newValue=${usbCapacity.value}`
    );
  } catch (error) {
    console.log('[pinsSetUSBCapacity] Error:', error);
  }
}
</script>
