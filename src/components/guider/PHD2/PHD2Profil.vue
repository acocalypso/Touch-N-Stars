<template>
  <div class="flex flex-row w-full items-center min-w-28">
    <label for="binning" class="text-sm sm:text-xs mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.profile') }}
    </label>
    <select
      v-model="selectedProfile"
      @change="onProfileChange"
      class="default-select h-8 w-28 ml-auto"
      :class="statusClassConnect"
      :disabled="guiderStore.phd2IsConnected"
    >
      <option v-for="profile in profiles" :key="profile" :value="profile">
        {{ profile }}
      </option>
    </select>
    <div class="flex flex-row gap-1 ml-1">
      <button
        @click="connectEquipment"
        class="default-button-cyan w-12"
        v-show="!guiderStore.phd2IsConnected"
      >
        <LinkIcon class="w-7 h-7 text-gray-300" />
      </button>
      <button
        @click="disconnectEquipment"
        class="default-button-red w-12"
        v-show="guiderStore.phd2IsConnected"
      >
        <LinkSlashIcon class="w-full h-7 text-gray-300" />
      </button>
    </div>
  </div>
</template>

<script setup>
import apiService from '@/services/apiService';
import { useGuiderStore } from '@/store/guiderStore';
import { onMounted, ref } from 'vue';
import { LinkSlashIcon, LinkIcon } from '@heroicons/vue/24/outline';

const guiderStore = useGuiderStore();
const profiles = ref([]);
const selectedProfile = ref('');
const statusClassConnect = ref();
const statusClassDisconnect = ref();

async function connectEquipment() {
  try {
    await apiService.connectPHD2Equipment(selectedProfile.value);
    statusClassConnect.value = 'glow-green';
  } catch (error) {
    statusClassConnect.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassConnect.value = '';
    }, 1000);
  }
}

async function disconnectEquipment() {
  try {
    await apiService.disconnectPHD2Equipment();
    statusClassDisconnect.value = 'glow-green';
  } catch (error) {
    statusClassDisconnect.value = 'glow-red';
  } finally {
    setTimeout(() => {
      statusClassDisconnect.value = '';
    }, 1000);
  }
}

async function onProfileChange() {
  const profileIndex = profiles.value.indexOf(selectedProfile.value);
  if (profileIndex !== -1) {
    // Backend erwartet eine ID die bei 1 beginnt, nicht bei 0
    const profileId = profileIndex + 1;
    console.log('Profile changed to:', selectedProfile.value, 'with ID', profileId);
    await guiderStore.setPHD2Profil(profileId);
    await guiderStore.fetchPHD2Cameras();
    await guiderStore.refreshPHD2SelectedMount();
    await guiderStore.fetchPHD2FocalLength();
    await guiderStore.fetchPHD2CalibrationStep();
    await guiderStore.fetchPHD2ReverseDecAfterFlip();
  }
}

onMounted(async () => {
  const response = await apiService.getPhd2CurrentProfile();
  profiles.value = guiderStore.phd2EquipmentProfiles;
  selectedProfile.value = response.Response.Profile.name;
});
</script>
