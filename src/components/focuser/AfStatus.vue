<template>
  <div class="text-md text-gray-400 pb-2">{{ $t('components.tppa.last_messages') }}:</div>
  <ul>
    <li
      v-for="(msg, index) in lastMessages.slice().reverse()"
      :key="index"
      :style="{ color: msg.color }"
    >
      <template v-if="index === 0">
        <span class="spinner"></span>
      </template>
      <template v-else> {{ formatTime(msg.timestamp) }} - </template>
      {{ msg.message }}
    </li>
  </ul>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useLogStore } from '@/store/logStore';
import { useI18n } from 'vue-i18n';
import { formatTime } from '@/utils/utils';

const { t } = useI18n();
const logStore = useLogStore();
let lastProcessedTimestamp = new Date();
const lastMessages = ref([]);

// Beobachte Log-Änderungen:
watch(
  () => logStore.LogsInfo.logs,
  (newLogs) => {
    if (!newLogs || newLogs.length === 0) return;

    // Sortiere aufsteigend nach Timestamp:
    const sortedLogs = [...newLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (const entry of sortedLogs) {
      // Nur neue Einträge
      if (lastProcessedTimestamp && new Date(entry.timestamp) <= new Date(lastProcessedTimestamp)) {
        continue;
      }
      let message;
      let color = 'inherit';

      if (entry.message.includes('Moving Focuser to position')) {
        message = entry.message;
      } else if (entry.message.includes('Starting Exposure')) {
        message = t('components.tppa.capture_running');
      } else if (entry.message.includes('AutoFocus complete')) {
        message = entry.message;
        color = 'green';
      } else if (entry.message.includes('AutoFocus did not complete successfully')) {
        message = entry.message;
        color = 'orange';
      } else {
        // Nicht relevante Logs überspringen
        continue;
      }
      // Speichere Einträge (max. 3)
      lastMessages.value.push({
        timestamp: entry.timestamp,
        message,
        line: entry.line,
        color,
      });

      if (lastMessages.value.length > 3) {
        lastMessages.value.shift();
      }
      lastProcessedTimestamp = entry.timestamp;
    }
  },
  { deep: true }
);
</script>

<style scoped>
.spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid #bbb;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
