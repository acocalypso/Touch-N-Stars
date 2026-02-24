<template>
  <div class="flex flex-col gap-2 sm:gap-4 pb-20">
    <div
      v-if="!isWandererCover"
      class="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg"
    >
      <p class="text-orange-400 font-medium text-center">
        {{ $t('components.flat.settings.noSettingsForDevice') }}
      </p>
    </div>
    <!-- WandererCover Settings -->
    <div
      v-if="isWandererCover"
      class="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.flat.settings.title') }}
      </h3>
      <setFlatdeviceHeater />
      <setFlatdeviceOpenPosition />
      <setFlatdeviceClosedPosition />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import setFlatdeviceHeater from './settings/setFlatdeviceHeater.vue';
import setFlatdeviceOpenPosition from './settings/setFlatdeviceOpenPosition.vue';
import setFlatdeviceClosedPosition from './settings/setFlatdeviceClosedPosition.vue';
import { apiStore } from '@/store/store';

const store = apiStore();

const isWandererCover = computed(() => {
  return store.flatdeviceInfo.Name && store.flatdeviceInfo.Name.includes('Wanderer');
});
</script>
