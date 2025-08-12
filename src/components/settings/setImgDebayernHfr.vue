<template>


    <div
    class="flex items-center justify-between w-full "
  >
    <label for="toggle_light" class="text-gray-200">
      {{$t('components.settings.image.DebayeredHFR')}}
    </label>
    <div>
      <toggleButton
        @click="updateSetting"
        :status-value="store.profileInfo.ImageSettings.DebayeredHFR"
        class="pr-5 pl-5 justify-center"
      />
    </div>
  </div>


</template>
<script setup>
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import toggleButton from '../helpers/toggleButton.vue';

const store = apiStore();

async function updateSetting() {
  try {
    if (store.profileInfo.ImageSettings.DebayeredHFR) {
      await apiService.profileChangeValue('ImageSettings-DebayeredHFR', false);
    } else {
      await apiService.profileChangeValue('ImageSettings-DebayeredHFR', true);
    }
  } catch (error) {
    console.log('Error save setting');
  }
}
</script>
