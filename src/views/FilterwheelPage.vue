<template>
  <div class="text-left mb-2">
    <h1 class="text-xl text-center font-bold">{{ $t('components.filterwheel.title') }}</h1>
  </div>
  <div
    v-if="!store.filterInfo.Connected"
    class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
  >
    <p class="text-red-400 font-medium text-center">
      {{ $t('components.filterwheel.please_connect_filterwheel') }}
    </p>
  </div>
  <div v-else class="container flex items-center justify-center">
    <div class="container max-w-md landscape:max-w-xl">
      <div>
        <InfoFilterwheel class="grid grid-cols-2 landscape:grid-cols-3" />
      </div>

      <div>
        <!-- Settings Button -->
        <button
          v-if="false"
          @click="openSettings = true"
          class="default-button-gray flex items-center justify-center px-3 px-2 mt-2"
        >
          <Cog6ToothIcon class="w-5 h-5" />
        </button>
      </div>

      <div
        class="mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
      >
        <strong>{{ $t('components.filterwheel.filter') }}</strong>
        <changeFilter />
      </div>
    </div>
  </div>

  <!-- Settings Modal -->
  <Modal :show="openSettings" @close="openSettings = false">
    <template #header>
      <h2 class="text-2xl font-semibold">{{ $t('components.filterwheel.settings.title') }}</h2>
    </template>
    <template #body>
      <div class="flex flex-col gap-1 mt-2 w-full">
        <FilterSettings />
      </div>
    </template>
  </Modal>
</template>
<script setup>
import { ref } from 'vue';
import changeFilter from '@/components/filterwheel/changeFilter.vue';
import InfoFilterwheel from '@/components/filterwheel/InfoFilterwheel.vue';
import Modal from '@/components/helpers/Modal.vue';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';
import FilterSettings from '@/components/filterwheel/settings/FilterSettings.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
const openSettings = ref(false);
</script>
