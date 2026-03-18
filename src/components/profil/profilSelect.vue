<template>
  <div class="w-full flex items-center">
    <!-- Loading Spinner Overlay -->
    <teleport to="body">
      <div
        v-if="isLoading"
        class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center pointer-events-auto"
      >
        <div class="flex flex-col items-center">
          <div
            class="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"
          ></div>
          <p class="text-white mt-4">{{ $t('loading') }}</p>
        </div>
      </div>
    </teleport>

    <label class="mr-2" for="profileDropdown">{{ $t('components.profile.label') }} </label>
    <select
      id="profileDropdown"
      class="default-select w-full ml-auto"
      v-model="selectedProfileId"
      @change="updateProfile"
      :disabled="isLoading || anyDeviceConnected"
    >
      <option v-for="profile in profiles" :key="profile.Id" :value="profile.Id">
        {{ profile.Name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

const store = apiStore(); // Access the store
const profiles = ref([]); // Profiles array
const selectedProfileId = ref(null); // Currently selected profile ID
const isLoading = ref(false); // Loading state

const anyDeviceConnected = computed(
  () =>
    store.mountInfo.Connected ||
    store.cameraInfo.Connected ||
    store.filterInfo.Connected ||
    store.focuserInfo.Connected ||
    store.rotatorInfo.Connected ||
    store.guiderInfo.Connected ||
    store.weatherInfo.Connected ||
    store.safetyInfo.Connected ||
    store.flatdeviceInfo.Connected ||
    store.domeInfo.Connected ||
    store.switchInfo.Connected
);

async function fetchProfiles() {
  try {
    // Fetch the profiles from the API
    const response = await apiService.profileAction('show');
    if (response && response.Response) {
      profiles.value = response.Response;

      // Find the active profile and set it as selected
      const activeProfile = profiles.value.find((profile) => profile.IsActive);
      if (activeProfile) {
        selectedProfileId.value = activeProfile.Id;
      }

      // Update the store with active profil
      store.fetchProfilInfos();
      store.setDefaultCameraSettings();
      store.setDefaultRotatorSettings();
      store.setDefaultCoordinates();
    }
  } catch (error) {
    console.error('Error loading profiles:', error);
  }
}

async function updateProfile() {
  isLoading.value = true;
  try {
    // Switch to the selected profile
    const response = await apiService.profileSwitch(selectedProfileId.value);
    if (response && response.Success) {
      console.log('Profile successfully updated');
      await fetchProfiles(); // Refresh profiles after update
    } else {
      alert('Error updating profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Error updating profile');
  } finally {
    isLoading.value = false;
  }
}

// Fetch profiles when the component is mounted
onMounted(() => {
  fetchProfiles();
});
</script>

<style scoped></style>
