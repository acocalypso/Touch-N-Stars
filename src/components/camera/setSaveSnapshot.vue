<template>
  <div class="flex flex-col w-full border border-gray-500 p-1 md:p-2 rounded-lg">
    <div class="flex flex-row items-center justify-between">
      <label for="toggle_light" class="text-xs md:text-sm text-gray-200">
        {{ $t('components.camera.set_save_snapshot') }}
      </label>
      <div>
        <toggleButton
          @click="toggleSave"
          :status-value="store.profileInfo.SnapShotControlSettings.Save"
          class="pr-5 pl-5 justify-center h-7 md:h-8"
        />
      </div>
    </div>
    <div class="flex flex-row items-center justify-between mt-2 md:mt-3">
      <label for="targetName" class="text-xs md:text-sm text-gray-200 mr-2">
        {{ $t('components.camera.snapshotTargetName') }}
      </label>
      <input
        id="targetName"
        v-model="settingsStore.camera.snapshotTargetName"
        type="text"
        class="default-input h-7 md:h-8 flex-1 text-xs md:text-sm"
        :disabled="!store.profileInfo.SnapShotControlSettings.Save"
      />
    </div>
  </div>
</template>
<script setup>
import toggleButton from '@/components/helpers/toggleButton.vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { useSettingsStore } from '@/store/settingsStore';

const store = apiStore();
const settingsStore = useSettingsStore();

async function toggleSave() {
  if (store.profileInfo.SnapShotControlSettings.Save) {
    await apiService.profileChangeValue('SnapShotControlSettings-Save', false);
    console.log('Save snapshots off');
  } else {
    await apiService.profileChangeValue('SnapShotControlSettings-Save', true);
    console.log('Save snapshots on');
  }
}
</script>
