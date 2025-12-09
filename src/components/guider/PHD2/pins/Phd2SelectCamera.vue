<template>
  <div class="w-full">
    <label class="block text-gray-200 text-sm font-medium mb-2"> PHD2 Camera </label>
    <select
      v-model="guiderStore.phd2SelectedCameraIndex"
      @change="onCameraChange"
      class="default-select w-full"
      :disabled="guiderStore.phd2CamerasLoading"
    >
      <option v-if="guiderStore.phd2CamerasLoading" value="" disabled>Loading cameras...</option>
      <option v-for="(camera, index) in guiderStore.phd2Cameras" :key="index" :value="index">
        {{ camera }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGuiderStore } from '@/store/guiderStore';

const guiderStore = useGuiderStore();

onMounted(async () => {
  await guiderStore.fetchPHD2Cameras();
});

const onCameraChange = async () => {
  const previousIndex = guiderStore.phd2SelectedCameraIndex;
  try {
    await guiderStore.setPHD2Camera(guiderStore.phd2SelectedCameraIndex);
    console.log('Camera changed to:', guiderStore.phd2SelectedCameraName);
  } catch (error) {
    console.error('Error changing camera:', error);
    // Bei Fehler zur vorherigen Auswahl zurückkehren
    guiderStore.phd2SelectedCameraIndex = previousIndex;
  }
};
</script>