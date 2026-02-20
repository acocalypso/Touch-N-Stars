<template>
  <div class="flex flex-col items-center w-full px-4">
    <div class="flex flex-col w-full max-w-lg items-center justify-center">
      <h5 class="text-xl font-bold text-white mb-4">{{ $t('pages.equipment.title') }}</h5>
      <div class="flex flex-col w-full items-center justify-center">
        <div
          class="flex items-center justify-center mb-4 w-full space-y-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg"
        >
          <profilSelect />
        </div>
        <div
          class="w-full pb-20 space-y-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg"
        >
          <connectEquipment />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import profilSelect from '@/components/profil/profilSelect.vue';
import connectEquipment from '@/components/equipment/connectEquipment.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
</script>

<style scoped></style>
