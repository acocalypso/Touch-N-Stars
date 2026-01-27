<template>
  <div class="flex flex-col items-center">
    <div class="flex flex-col max-w-lg items-center justify-center">
      <h5 class="text-xl font-bold text-white mb-4">{{ $t('pages.equipment.title') }}</h5>
      <div class="flex flex-col items-center justify-center">
        <div
          v-if="
            !store.mountInfo.Connected &&
            !store.cameraInfo.Connected &&
            !store.filterInfo.Connected &&
            !store.focuserInfo.Connected &&
            !store.rotatorInfo.Connected &&
            !store.guiderInfo.Connected &&
            !store.weatherInfo.Connected &&
            !store.safetyInfo.Connected &&
            !store.flatdeviceInfo.Connected &&
            !store.domeInfo.Connected &&
            !store.switchInfo.Connected
          "
          class="flex items-center justify-center mb-4 w-full space-y-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6 shadow-lg"
        >
          <profilSelect />
        </div>
        <div
          class="mb-24 space-y-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6 shadow-lg"
        >
          <connectEquipment />
          <selectIndi />
        </div>
      </div>
      </div>
    </div>
</template>

<script setup>
import profilSelect from '@/components/profil/profilSelect.vue';
import connectEquipment from '@/components/equipment/connectEquipment.vue';
import selectIndi from '@/components/equipment/selectIndi.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
</script>

<style scoped></style>
