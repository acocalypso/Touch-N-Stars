<template>
  <div class="container text-center">
    <h5 class="text-xl font-bold text-white mb-4">{{ $t('pages.equipment.title') }}</h5>
    <div class="flex flex-col items-center justify-center">
      <profilSelect
        v-if="
          !store.mountInfo.Connected &&
          !store.cameraInfo.Connected &&
          !store.filterInfo.Connected &&
          !store.focuserInfo.Connected &&
          !store.rotatorInfo.Connected
        "
        class="mb-4"
      />
      <connectEquipment
        class="mb-4 space-y-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6 shadow-lg"
      />
      <selectDevices />
    </div>
  </div>
</template>

<script setup>
import profilSelect from '@/components/profil/profilSelect.vue';
import connectEquipment from '@/components/equipment/connectEquipment.vue';
import { apiStore } from '@/store/store';
import selectDevices from '@/components/equipment/selectDevices.vue';

const store = apiStore();
</script>

<style scoped></style>
