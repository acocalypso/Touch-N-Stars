<template>
  <div
    class="flex items-center w-full justify-between border border-gray-500 p-1 md:p-2 rounded-lg"
  >
    <label for="setFanSpeed" class="text-xs md:text-sm text-gray-200 font-medium">
      {{ $t('components.camera.FanSpeed') }}
    </label>
    <select
      @change="setFanSpeed"
      id="setFanSpeed"
      v-model="fanSpeed"
      class="default-select h-7 md:h-8 w-20 md:w-28"
    >
      <option v-for="n in cameraStore.cameraSettings.MaxFanSpeed + 1" :key="n - 1" :value="n - 1">
        {{ n - 1 }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import apiService from '@/services/apiService';
import { useCameraStore } from '@/store/cameraStore';

const cameraStore = useCameraStore();
const fanSpeed = ref(9);

onMounted(() => {
  fanSpeed.value = cameraStore.cameraSettings.FanSpeed;
});

async function setFanSpeed() {
  try {
    //equipment/filterwheel/set-setting?settingName=Unidirectional&newValue=false
    const response = await apiService.cameraAction(
      `set-setting?settingName=FanSpeed&newValue=${fanSpeed.value}`
    );
    await cameraStore.readSettings();
    console.log('[FanSpeed] ', response);
  } catch (error) {
    console.log('Error while setting FanSpeed');
  }
}
</script>
