<template>
  <div v-if="settings?.[settingName] !== undefined" class="w-full">
    <div class="flex items-center justify-between border border-gray-500 p-1 md:p-2 rounded-lg">
      <label :for="settingName" class="text-xs md:text-sm text-gray-200 font-medium">
        {{ $t(labelKey) }}
      </label>
      <toggleButton @click="toggleMode" :status-value="settings[settingName]" class="h-7 md:h-8" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import apiService from '@/services/apiService';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { useFocuserStore } from '@/store/focuserStore';
import { useCameraStore } from '@/store/cameraStore';
import { useFilterStore } from '@/store/filterStore';

const props = defineProps({
  labelKey: {
    type: String,
    required: true,
  },
  // Device setting name used by the PINS 'set-setting' endpoint, e.g. 'BeepOnMove'
  settingName: {
    type: String,
    required: true,
  },
  device: {
    type: String,
    required: true,
    validator: (value) => ['focuser', 'camera', 'filter'].includes(value),
  },
});

const devices = {
  focuser: { store: useFocuserStore(), settingsKey: 'focuserSettings', action: 'focusAction' },
  camera: { store: useCameraStore(), settingsKey: 'cameraSettings', action: 'cameraAction' },
  filter: { store: useFilterStore(), settingsKey: 'filterwheelSettings', action: 'filterAction' },
};

const deviceStore = devices[props.device].store;
const settings = computed(() => deviceStore[devices[props.device].settingsKey]);

async function toggleMode() {
  const newValue = !settings.value[props.settingName];
  try {
    await apiService[devices[props.device].action](
      `set-setting?settingName=${props.settingName}&newValue=${newValue}`
    );
  } catch (error) {
    console.error(`[PinsSettingToggle] Error setting ${props.settingName}:`, error);
  }
  // Re-read the device settings so the toggle reflects the value the device reports
  await deviceStore.readSettings();
}
</script>
