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
          v-if="store.isPINS"
          class="flex items-center justify-center mb-4 w-full space-y-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6 shadow-lg"
        >
          <button
            @click="showIndiModal = true"
            class="default-button-gray w-full flex items-center justify-center gap-2"
          >
            <Cog6ToothIcon class="w-5 h-5" />
            {{ $t('pages.equipment.indiSetup') }}
          </button>
        </div>
        <div
          class="mb-24 space-y-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6 shadow-lg"
        >
          <connectEquipment />
        </div>
      </div>
    </div>
  </div>

  <!-- INDI Setup Modal -->
  <Modal :show="showIndiModal" @close="showIndiModal = false">
    <template #header>
      <h2 class="text-xl font-bold">{{ $t('pages.equipment.indiSetup') }}</h2>
    </template>
    <template #body>
      <selectIndi v-if="store.isPINS" />
    </template>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';
import profilSelect from '@/components/profil/profilSelect.vue';
import connectEquipment from '@/components/equipment/connectEquipment.vue';
import selectIndi from '@/components/equipment/selectIndi.vue';
import Modal from '@/components/helpers/Modal.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
const showIndiModal = ref(false);
</script>

<style scoped></style>
