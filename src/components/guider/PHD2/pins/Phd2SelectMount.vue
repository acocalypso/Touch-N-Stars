<template>
  <div v-if="store.isPINS" class="w-full">
    <label class="block text-gray-200 text-sm font-medium mb-2"> PHD2 Mount </label>
    <select
      v-model="guiderStore.phd2SelectedMountIndex"
      @change="onMountChange"
      class="default-select w-full"
      :disabled="guiderStore.phd2MountsLoading"
    >
      <option v-if="guiderStore.phd2MountsLoading" value="" disabled>Loading mounts...</option>
      <option v-for="(mount, index) in guiderStore.phd2Mounts" :key="index" :value="index">
        {{ mount }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGuiderStore } from '@/store/guiderStore';
import { apiStore } from '@/store/store';

const store = apiStore();
const guiderStore = useGuiderStore();

onMounted(async () => {
  await guiderStore.fetchPHD2Mounts();
});

const onMountChange = async () => {
  const previousIndex = guiderStore.phd2SelectedMountIndex;
  try {
    await guiderStore.setPHD2Mount(guiderStore.phd2SelectedMountIndex);
    console.log('Mount changed to:', guiderStore.phd2SelectedMountName);
  } catch (error) {
    console.error('Error changing mount:', error);
    // Bei Fehler zur vorherigen Auswahl zurückkehren
    guiderStore.phd2SelectedMountIndex = previousIndex;
  }
};
</script>
