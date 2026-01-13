<template>
  <div class="gap-2 grid grid-cols-2 landscape:grid-cols-3">
    <div
      v-for="progress in progressItems"
      :key="progress.source"
      class="bg-white dark:bg-gray-800 rounded-lg shadow p-2"
    >
      <div class="text-sm font-semibold">{{ progress.source }}</div>
      <div class="text-xs text-gray-600 dark:text-gray-400">{{ progress.status }}</div>

      <!-- Progress Level 1 -->
      <div v-if="progress.progress >= 0" class="mt-2">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(progress.progress / progress.maxProgress) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Progress Level 2 -->
      <div v-if="progress.progress2 >= 0" class="mt-2">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-green-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(progress.progress2 / progress.maxProgress2) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Progress Level 3 -->
      <div v-if="progress.progress3 >= 0" class="mt-2">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-purple-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(progress.progress3 / progress.maxProgress3) * 100}%` }"
          ></div>
        </div>
      </div>

      <div
        v-if="progress.progress >= 0 || progress.progress2 >= 0 || progress.progress3 >= 0"
        class="text-xs text-gray-500 dark:text-gray-400 mt-2"
      >
        {{ new Date(progress.timestamp).toLocaleTimeString() }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import signalRProgressService from '@/services/signalRprogressService';

const progressItems = ref([]);

const handleProgress = (progressObj) => {
  const existingIndex = progressItems.value.findIndex((p) => p.source === progressObj.source);

  // Wenn status null oder undefined ist, entferne das Item sofort
  if (progressObj.status === null || progressObj.status === undefined || progressObj.status === '') {
    if (existingIndex >= 0) {
      progressItems.value.splice(existingIndex, 1);
    }
    return;
  }

  // Aktualisiere oder füge Items hinzu (wenn status gültig)
  if (existingIndex >= 0) {
    progressItems.value[existingIndex] = progressObj;
  } else {
    progressItems.value.push(progressObj);
  }
};

onMounted(() => {
  signalRProgressService.setProgressCallback(handleProgress);

  if (!signalRProgressService.isSignalRConnected()) {
    signalRProgressService.connect().catch((err) => {
      console.error('Failed to connect to progress service:', err);
    });
  }
});

onUnmounted(() => {
  signalRProgressService.setProgressCallback(null);
});
</script>
