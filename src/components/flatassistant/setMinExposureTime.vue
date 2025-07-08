<template>
  <div class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg">
    <label for="count" class="text-sm mr-3 mb-1 text-gray-400">
      {{ $t('components.flatassistant.min_exposure_time') }}
    </label>
    <input
      id="count"
      v-model.number="flatsStore.minExposureTime"
      type="number"
      class="default-input ml-auto h-8 w-28"
    />
  </div>
</template>
<script setup>
import { onMounted } from 'vue';
import { apiStore } from '@/store/store';
import { useFlatassistantStore } from '@/store/flatassistantStore';

const store = apiStore();
const flatsStore = useFlatassistantStore();

onMounted(() => {
  flatsStore.minExposureTime = store.profileInfo.CameraSettings.MinFlatExposureTime;
});
</script>
