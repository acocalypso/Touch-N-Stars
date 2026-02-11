<template>
  <div
    :class="borderClass"
    class="flex flex-col sm:flex-row border p-2 rounded-lg h-full gap-2 sm:items-center transition-all duration-300"
  >
    <label class="text-sm sm:w-36 shrink-0" for="guiderCamSelect">{{ deviceName }}:</label>
    <div class="flex gap-2 items-center w-full">
      <select
        id="guiderCamSelect"
        class="w-full default-select min-w-0"
        v-model="selectedCam"
        @change="setGuiderCam"
      >
        <option value="" disabled>{{ selectedCam || $t('common.select') }}</option>
        <option v-for="cam in cameras" :key="cam.name" :value="cam.name">
          {{ cam.name }}
        </option>
      </select>
      <div class="flex shrink-0 gap-1">
        <button
          @click="loadCameras"
          :disabled="isLoading"
          class="flex justify-center items-center w-10 h-10 border border-cyan-500/20 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-70"
        >
          <ArrowPathIcon
            class="w-6 h-6"
            :class="{ 'text-green-500 spin': isLoading, 'text-white': !isLoading }"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import apiPinsService from '@/services/apiPinsService';
import { ArrowPathIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  deviceName: { type: String, default: 'Guide Camera' },
});

const store = apiStore();

const cameras = ref([]);
const selectedCam = ref('');
const isLoading = ref(false);
const borderClass = ref('border-gray-500');

async function loadCameras() {
  isLoading.value = true;
  try {
    await apiService.connectPHD2();
    const response = await apiPinsService.getGuideCam();
    if (response.Success && response.Response) {
      cameras.value = Object.entries(response.Response).map(([name, ids]) => ({
        name,
        id: ids[0] || '',
      }));
    }
  } catch (error) {
    console.error('Error loading guide cameras:', error);
    borderClass.value = 'border-red-500 error-glow';
  } finally {
    isLoading.value = false;
  }
}

async function setGuiderCam() {
  const cam = cameras.value.find((c) => c.name === selectedCam.value);
  if (!cam) return;

  try {
    await apiService.profileChangeValue('GuiderSettings-PHD2Camera', cam.name);
    await apiService.profileChangeValue('GuiderSettings-PHD2CameraId', cam.id);
    borderClass.value = 'border-green-500 connected-glow';
  } catch (error) {
    console.error('Error setting guide camera:', error);
    borderClass.value = 'border-red-500 error-glow';
  } finally {
    setTimeout(() => {
      borderClass.value = 'border-gray-500';
    }, 2000);
  }
}

onMounted(async () => {
  //only if is PINS and Guider ist PHD2
  if (store.profileInfo?.GuiderSettings?.GuiderName !== 'PHD2_Single' || !store.isPINS){
    return
  } 
  if (store.profileInfo?.GuiderSettings?.PHD2Camera) {
    selectedCam.value = store.profileInfo.GuiderSettings.PHD2Camera;
  }
  loadCameras();
});
</script>

<style scoped>
@keyframes error-glow {
  0% {
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
  }
  100% {
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
  }
}

.error-glow {
  animation: error-glow 1.5s infinite alternate;
}

.connected-glow {
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
