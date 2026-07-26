<template>
  <div
    class="flex items-center w-full justify-between border border-line-strong p-1 md:p-2 rounded-control"
  >
    <label for="setFanSpeed" class="text-xs md:text-sm text-content font-medium">
      {{ $t('components.camera.FanSpeed') }}
    </label>
    <select
      @change="setFanSpeed"
      id="setFanSpeed"
      v-model="fanSpeed"
      class="tns-select w-20 md:w-28"
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
    const cameraResponse = await apiService.cameraAction(
      `set-setting?settingName=FanSpeed&newValue=${fanSpeed.value}`
    );
    console.log('[pinsSetFanSpeed Camera] ', cameraResponse);
    const profileResponse = await apiService.profileChangeValue(
      'CameraSettings-FanSpeed',
      fanSpeed.value
    );
    console.log('[pinsSetFanSpeed Profile] ', profileResponse);
    await cameraStore.readSettings();
  } catch (error) {
    console.log('[pinsSetFanSpeed] Error while setting FanSpeed', error);
  }
}
</script>
