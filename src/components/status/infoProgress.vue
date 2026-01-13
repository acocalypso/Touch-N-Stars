<template>
  <div class="gap-2 grid grid-cols-2 landscape:grid-cols-3">
    <div
      v-for="progress in progressItems"
      :key="progress.source"
      class="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
    >
      <div class="text-sm font-semibold mb-2">{{ progress.source }}</div>
      <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">{{ progress.status }}</div>

      <!-- Progress Level 1 -->
      <div v-if="progress.progress >= 0" class="mb-2">
        <div class="flex justify-between text-xs mb-1">
          <span>{{ Math.round((progress.progress / progress.maxProgress) * 100) }}%</span>
          <span>{{ progress.progress }} / {{ progress.maxProgress }}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(progress.progress / progress.maxProgress) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Progress Level 2 -->
      <div v-if="progress.progress2 >= 0" class="mb-2">
        <div class="flex justify-between text-xs mb-1">
          <span>{{ Math.round((progress.progress2 / progress.maxProgress2) * 100) }}%</span>
          <span>{{ progress.progress2 }} / {{ progress.maxProgress2 }}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-green-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(progress.progress2 / progress.maxProgress2) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Progress Level 3 -->
      <div v-if="progress.progress3 >= 0" class="mb-2">
        <div class="flex justify-between text-xs mb-1">
          <span>{{ Math.round((progress.progress3 / progress.maxProgress3) * 100) }}%</span>
          <span>{{ progress.progress3 }} / {{ progress.maxProgress3 }}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-purple-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(progress.progress3 / progress.maxProgress3) * 100}%` }"
          ></div>
        </div>
      </div>

      <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {{ new Date(progress.timestamp).toLocaleTimeString() }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { apiStore } from '@/store/store';
import signalRProgressService from '@/services/signalRprogressService';

const progressItems = ref([]);
const removeTimeouts = ref(new Map());

const handleProgress = (progressObj) => {
  const existingIndex = progressItems.value.findIndex((p) => p.source === progressObj.source);

  // Clear existing timeout for this source
  if (removeTimeouts.value.has(progressObj.source)) {
    clearTimeout(removeTimeouts.value.get(progressObj.source));
    removeTimeouts.value.delete(progressObj.source);
  }

  // Wenn status null ist, entferne das Item
  if (progressObj.status === null) {
    if (existingIndex >= 0) {
      progressItems.value.splice(existingIndex, 1);
    }
    return;
  }

  // Aktualisiere oder füge Items hinzu (wenn status nicht null)
  if (existingIndex >= 0) {
    progressItems.value[existingIndex] = progressObj;
  } else {
    progressItems.value.push(progressObj);
  }

  // Prüfe ob mindestens ein Progress läuft (>= 0 und < maxProgress)
  const isRunning =
    (progressObj.progress >= 0 && progressObj.progress < progressObj.maxProgress) ||
    (progressObj.progress2 >= 0 && progressObj.progress2 < progressObj.maxProgress2) ||
    (progressObj.progress3 >= 0 && progressObj.progress3 < progressObj.maxProgress3);

  // Wenn nicht mehr laufend, setze Timeout zum Entfernen nach 30 Sekunden
  if (!isRunning) {
    const timeoutId = setTimeout(() => {
      const idx = progressItems.value.findIndex((p) => p.source === progressObj.source);
      if (idx >= 0) {
        progressItems.value.splice(idx, 1);
      }
      removeTimeouts.value.delete(progressObj.source);
    }, 30000);

    removeTimeouts.value.set(progressObj.source, timeoutId);
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

  // Clear all timeouts
  removeTimeouts.value.forEach((timeoutId) => clearTimeout(timeoutId));
  removeTimeouts.value.clear();
});
</script>
