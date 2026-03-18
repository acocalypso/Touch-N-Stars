<template>
  <div v-if="!store.flatdeviceInfo.Connected" class="text-red-500">
    <p>{{ $t('components.flat.please_connect_flatDevice') }}</p>
  </div>
  <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
    <StatusString
      :isEnabled="store.flatdeviceInfo.Name !== undefined"
      :Name="$t('components.flat.device_name')"
      :Value="store.flatdeviceInfo.Name"
    />
    <StatusString
      :isEnabled="store.flatdeviceInfo.LocalizedCoverState !== undefined"
      :Name="$t('components.flat.cover_state')"
      :Value="store.flatdeviceInfo.LocalizedCoverState"
    />
    <StatusString
      :isEnabled="store.flatdeviceInfo.LocalizedLightOnState !== undefined"
      :Name="$t('components.flat.light_state')"
      :Value="store.flatdeviceInfo.LocalizedLightOnState"
    />
    <StatusString
      :isEnabled="
        store.flatdeviceInfo.Brightness !== undefined && !isNaN(store.flatdeviceInfo.Brightness)
      "
      :Name="$t('components.flat.brightness')"
      :Value="store.flatdeviceInfo.Brightness"
    />
    <StatusString
      v-if="isWandererCover"
      :isEnabled="currentPosition !== undefined && !isNaN(currentPosition)"
      :Name="$t('components.flat.settings.currentPosition')"
      :Value="`${currentPosition.toFixed(1)}°`"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import StatusString from '@/components/helpers/StatusString.vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

const store = apiStore();
const currentPosition = ref(undefined);

const isWandererCover = computed(() => {
  return store.flatdeviceInfo.Name && store.flatdeviceInfo.Name.includes('Wanderer');
});

async function loadCurrentPosition() {
  try {
    const response = await apiService.flatdeviceGetCurrentPosition();
    if (response.Success) {
      currentPosition.value = response.Response;
    }
  } catch (error) {
    console.error('Error loading current position:', error);
  }
}

onMounted(() => {
  if (isWandererCover.value) {
    loadCurrentPosition();
  }
});

// Watch for cover state changes and reload current position
watch(
  () => store.flatdeviceInfo.CoverState,
  () => {
    if (isWandererCover.value) {
      loadCurrentPosition();
    }
  }
);
</script>
