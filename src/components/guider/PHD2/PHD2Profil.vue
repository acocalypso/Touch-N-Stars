<template>
  <div class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg">
    <label for="binning" class="text-sm sm:text-xs mr-3 mb-1 text-gray-200">
      {{ $t('components.guider.phd2.profile') }}
    </label>
    <select
      v-model="selectedProfile"
      class="ml-auto text-black px-3 h-8 w-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-700"
       :class="statusClassConnect"
      @change="connectEquipment"
    >
      <option v-for="profile in profiles" :key="profile" :value="profile">
        {{ profile }} 
      </option>
    </select>
      <button
        @click="disconnectEquipment"
        class="btn-primary bg-gradient-to-br w-full h-full from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600"
      >
            <LinkSlashIcon class="w-full h-7 text-gray-300" />
      </button>
  </div>
</template>

<script setup>
import apiService from '@/services/apiService';
import { onMounted, ref } from 'vue';
import { LinkSlashIcon } from '@heroicons/vue/24/outline';

const profiles = ref([]);
const selectedProfile = ref('');
const statusClassConnect =ref();
const statusClassDisconnect =ref();

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
  

onMounted(async () => {
  const response = await apiService.getPhd2Profile();
  console.log('PHD2 profiles', response.Response);
  profiles.value = response.Response;
  selectedProfile.value = profiles.value[0];
});
</script>
