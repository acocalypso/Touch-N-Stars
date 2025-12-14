<template>
  <div class="flex flex-row w-full items-center min-w-28">
    <label for="binning" class="text-sm sm:text-xs mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.profile') }}
    </label>
    <div class="relative ml-auto">
      <select
        v-model="selectedProfile"
        @change="onProfileChange"
        class="default-select h-8 w-28"
        :class="statusClassConnect"
        :disabled="guiderStore.phd2IsConnected || isChangingProfile"
      >
        <option v-for="profile in profiles" :key="profile" :value="profile">
          {{ profile }}
        </option>
      </select>
      <div
        v-if="isChangingProfile"
        class="absolute inset-0 flex items-center justify-center bg-gray-800/50 rounded pointer-events-none"
      >
        <svg
          class="animate-spin h-5 w-5 text-cyan-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    </div>
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
const isChangingProfile = ref(false);

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
    isChangingProfile.value = true;
    try {
      // Backend erwartet eine ID die bei 1 beginnt, nicht bei 0
      const profileId = profileIndex + 1;
      console.log('Profile changed to:', selectedProfile.value, 'with ID', profileId);
      await guiderStore.setPHD2Profil(profileId);
      await guiderStore.fetchPHD2Cameras();
      await guiderStore.refreshPHD2SelectedMount();
      await guiderStore.fetchPHD2FocalLength();
      await guiderStore.fetchPHD2CalibrationStep();
      await guiderStore.fetchPHD2ReverseDecAfterFlip();
      await guiderStore.fetchPHD2GuideAlgorithmRA();
      await guiderStore.fetchPHD2GuideAlgorithmDEC();
    } finally {
      isChangingProfile.value = false;
    }
  }
}

onMounted(async () => {
  const response = await apiService.getPhd2CurrentProfile();
  profiles.value = guiderStore.phd2EquipmentProfiles;
  selectedProfile.value = response.Response.Profile.name;
});
</script>
