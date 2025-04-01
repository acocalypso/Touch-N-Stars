<template>
  <div class="w-64 flex items-center">
    <label class="mr-2" for="profileDropdown">{{ $t('components.profile.label') }} </label>
    <select
      id="profileDropdown"
      class="default-inputfield"
      v-model="selectedProfileId"
      @change="updateProfile"
    >
      <option v-for="profile in profiles" :key="profile.Id" :value="profile.Id">
        {{ profile.Name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

const store = apiStore(); // Access the store
const profiles = ref([]); // Profiles array
const selectedProfileId = ref(null); // Currently selected profile ID

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
    console.error('Fehler beim Laden der Profile:', error);
  }
}

async function updateProfile() {
  try {
    // Switch to the selected profile
    const response = await apiService.profileSwitch(selectedProfileId.value);
    if (response && response.Success) {
      console.log('Profil erfolgreich aktualisiert');
      fetchProfiles(); // Refresh profiles after update
    } else {
      alert('Fehler beim Aktualisieren des Profils');
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Profils:', error);
    alert('Fehler beim Aktualisieren des Profils');
  }
}

// Fetch profiles when the component is mounted
onMounted(() => {
  fetchProfiles();
});
</script>

<style scoped></style>
