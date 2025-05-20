<template>
  <div v-if="store.isBackendReachable" class=" w-full h-7 text-xs text-gray-300 flex items-center">
    <div v-if="store.cameraInfo.Connected" class="flex items-center gap-1 pl-1">
      <button class="flex w-5 h-5">
         <CameraIcon :class="{ 'text-green-500': store.cameraInfo.IsExposing }" />
      </button>
      <p >
        Gain: {{ Number(store.cameraInfo.Gain).toFixed(0) }}
      </p>
      <p v-if="store.cameraInfo.CoolerOn">
        Temp: {{ Number(store.cameraInfo.Temperature).toFixed(1) }} °C
      </p>
    </div>

  </div>
</template>

<script setup>
import { apiStore } from '@/store/store';
import { useLogStore } from '@/store/logStore';
import { ref, onMounted } from 'vue';


const store = apiStore();
const logStore = useLogStore();
const isLoading = ref(true);
const showAboutModal = ref(false);
const showWeatherModal = ref(false);
import { CameraIcon } from '@heroicons/vue/24/outline';

onMounted(() => {

});


</script>

<style scoped></style>
