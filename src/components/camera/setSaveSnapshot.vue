<template>
  <div
    class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
  >
    <label for="toggle_light" class="text-gray-200">
      {{ $t('components.camera.set_save_snapshot') }}
    </label>
    <div>
      <toggleButton
        @click="toggleSave"
        :status-value="store.profileInfo.SnapShotControlSettings.Save"
        class="pr-5 pl-5 justify-center"
      />
    </div>
  </div>
</template>
<script setup>
import toggleButton from '@/components/helpers/toggleButton.vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';

const store = apiStore();


async function toggleSave() {
  if (store.profileInfo.SnapShotControlSettings.Save) {
    await apiService.profileChangeValue(
      'SnapShotControlSettings-Save',
      false
    );
    console.log('Save snapshots off');
  } else {
    await apiService.profileChangeValue(
      'SnapShotControlSettings-Save',
      true
    );
    console.log('Save snapshots on');
  }
}

</script>
