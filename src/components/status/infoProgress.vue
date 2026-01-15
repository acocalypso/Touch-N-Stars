<template>
  <div class="gap-2 grid grid-cols-2 landscape:grid-cols-3">
    <div
      v-for="item in displayItems"
      :key="item.id"
      class="bg-white dark:bg-gray-800 rounded-lg shadow p-2"
    >
      <div class="text-sm font-semibold">{{ item.source }}</div>
      <div class="text-xs text-gray-600 dark:text-gray-400">{{ item.status }}</div>

      <div v-if="item.showProgress" class="mt-2">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            :class="item.color"
            class="h-2 rounded-full transition-all duration-300"
            :style="{ width: `${item.percentage}%` }"
          ></div>
        </div>
      </div>

      <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {{ new Date(item.timestamp).toLocaleTimeString() }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import signalRProgressService from '@/services/signalRprogressService';

// Speichere nur die letzten 3 Status-Slots (nicht nach Source, sondern nach Status-Position)
const statusSlot1 = ref(null); // Für alle status1 (blau)
const statusSlot2 = ref(null); // Für alle status2 (grün)
const statusSlot3 = ref(null); // Für alle status3 (lila)
let inactivityTimer = null;

// Computed property um die Status-Slots in Display-Items zu transformieren
const displayItems = computed(() => {
  const items = [];

  // Slot 1 (blau)
  if (statusSlot1.value) {
    const progress = statusSlot1.value;
    if (progress.status && progress.status !== '') {
      const percentage =
        progress.maxProgress > 0 ? (progress.progress / progress.maxProgress) * 100 : 0;
      const showProgress = progress.progress >= 0;
      items.push({
        id: `slot1-${progress.timestamp.getTime()}`,
        source: progress.source,
        status: progress.status,
        percentage: percentage,
        showProgress: showProgress,
        color: 'bg-blue-600',
        timestamp: progress.timestamp,
        progressType: progress.progressType,
      });
    }
  }

  // Slot 2 (grün)
  if (statusSlot2.value) {
    const progress = statusSlot2.value;
    if (progress.status2 && progress.status2 !== '') {
      const percentage =
        progress.maxProgress2 > 0 ? (progress.progress2 / progress.maxProgress2) * 100 : 0;
      const showProgress = progress.progress2 >= 0;
      items.push({
        id: `slot2-${progress.timestamp.getTime()}`,
        source: progress.source,
        status: progress.status2,
        percentage: percentage,
        showProgress: showProgress,
        color: 'bg-green-600',
        timestamp: progress.timestamp,
        progressType: progress.progressType2,
      });
    }
  }

  // Slot 3 (lila)
  if (statusSlot3.value) {
    const progress = statusSlot3.value;
    if (progress.status3 && progress.status3 !== '') {
      const percentage =
        progress.maxProgress3 > 0 ? (progress.progress3 / progress.maxProgress3) * 100 : 0;
      const showProgress = progress.progress3 >= 0;
      items.push({
        id: `slot3-${progress.timestamp.getTime()}`,
        source: progress.source,
        status: progress.status3,
        percentage: percentage,
        showProgress: showProgress,
        color: 'bg-purple-600',
        timestamp: progress.timestamp,
        progressType: progress.progressType3,
      });
    }
  }

  return items;
});

const clearAllItems = () => {
  console.log('[infoProgress] Clearing all progress items due to inactivity');
  statusSlot1.value = null;
  statusSlot2.value = null;
  statusSlot3.value = null;
};

const resetInactivityTimer = () => {
  // Clear existing timer
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }

  // Set new timer for 60 seconds
  inactivityTimer = setTimeout(() => {
    clearAllItems();
  }, 60000);
};

const handleProgress = (progressObj) => {
  // Reset inactivity timer on every message
  resetInactivityTimer();

  // Prüfe ob Status leer/null sind
  const status1Empty =
    progressObj.status === null || progressObj.status === undefined || progressObj.status === '';
  const status2Empty =
    progressObj.status2 === null || progressObj.status2 === undefined || progressObj.status2 === '';
  const status3Empty =
    progressObj.status3 === null || progressObj.status3 === undefined || progressObj.status3 === '';

  // Update Slot 1 wenn status1 gesetzt ist, sonst lösche es
  if (!status1Empty) {
    statusSlot1.value = progressObj;
  } else {
    statusSlot1.value = null;
  }

  // Update Slot 2 wenn status2 gesetzt ist, sonst lösche es
  if (!status2Empty) {
    statusSlot2.value = progressObj;
  } else {
    statusSlot2.value = null;
  }

  // Update Slot 3 wenn status3 gesetzt ist, sonst lösche es
  if (!status3Empty) {
    statusSlot3.value = progressObj;
  } else {
    statusSlot3.value = null;
  }
};

const handleReconnect = () => {
  console.log('[infoProgress] Clearing progress items on reconnect');
  statusSlot1.value = null;
  statusSlot2.value = null;
  statusSlot3.value = null;
  resetInactivityTimer();
};

onMounted(() => {
  signalRProgressService.setProgressCallback(handleProgress);
  signalRProgressService.setReconnectCallback(handleReconnect);

  if (!signalRProgressService.isSignalRConnected()) {
    signalRProgressService.connect().catch((err) => {
      console.error('Failed to connect to progress service:', err);
    });
  }
});

onUnmounted(() => {
  signalRProgressService.setProgressCallback(null);
  signalRProgressService.setReconnectCallback(null);

  // Clear inactivity timer on unmount
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
});
</script>
