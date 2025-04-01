<template>
  <div
    class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
  >
    <label for="toggle_light" class="text-gray-400">
      {{ $t('components.dome.control.follow') }}
    </label>
    <div>
      <toggleButton
        @click="toggleDomeFollow"
        :status-value="store.domeInfo.DriverFollowing"
        class="pr-5 pl-5 justify-center"
      />
    </div>
  </div>
</template>
<script setup>
//Attention: DriverFollowing is not the feedback of the switch. It can therefore not yet be used. 

import apiService from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { apiStore } from '@/store/store';
import toggleButton from '@/components/helpers/toggleButton.vue';

const store = apiStore();
const { t } = useI18n();

async function toggleDomeFollow() {
  try {
    if (store.domeInfo.DriverFollowing){
      await apiService.domeAction('set-follow?enabled=false');
      store.domeInfo.DriverFollowing = false;
      console.log('Dome follow disabled');
    } else {
      await apiService.domeAction('set-follow?enabled=true');
      store.domeInfo.DriverFollowing = true;
      console.log('Dome follow enabled');
    }
  } catch (error) {
    console.log(t('components.dome.control.errors.close'));
  }
}
</script>
