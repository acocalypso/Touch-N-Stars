<template>
<ul>
  <li
    v-for="(msg, index) in lastMessages.slice().reverse()"
    :key="index"
    :style="{ color: msg.color || '#ccc' }"
  >

    <template> {{ formatTime(msg.timestamp) }} - </template>

    <div>
      <span v-if="msg.position !== null">Position: {{ msg.position }}</span>
      <span v-if="msg.hfr !== null"> | HFR: {{ msg.hfr.toFixed(2) }}</span>
      <span v-if="msg.hfrMad !== null"> | MAD: {{ msg.hfrMad.toFixed(2) }}</span>
    </div>
  </li>
</ul>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useLogStore } from '@/store/logStore';
import { useI18n } from 'vue-i18n';
import { formatTime } from '@/utils/utils';

const { t } = useI18n();
const logStore = useLogStore();
let lastProcessedTimestamp = null;
const lastMessages = ref([]);
let lastKnownPosition = null; // Hier merken wir uns die letzte gesetzte Position
let lastPositionTimestamp = null;

// Beobachte Log-Änderungen:
watch(
  () => logStore.LogsInfo.logs,
  (newLogs) => {
    if (!newLogs || newLogs.length === 0) return;

    const sortedLogs = [...newLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (const entry of sortedLogs) {
      if (lastProcessedTimestamp && new Date(entry.timestamp) <= new Date(lastProcessedTimestamp)) {
        continue;
      }

      const positionMatch = entry.message.match(/Moving Focuser to position (\d+)/);
      const hfrMatch = entry.message.match(/Average HFR: ([\d.]+), HFR MAD: ([\d.]+)/);

      // Focuser wurde bewegt → Position merken
      if (positionMatch && !lastKnownPosition) {
        lastKnownPosition = parseInt(positionMatch[1], 10);
        console.log('lastKnownPosition', lastKnownPosition ,  entry.timestamp)
        lastPositionTimestamp = new Date(entry.timestamp);
      }

      // HFR erkannt → letzte bekannte Position mit speichern
      if (hfrMatch && lastPositionTimestamp) {
        const hfr = parseFloat(hfrMatch[1]);
        const hfrMad = parseFloat(hfrMatch[2]);
        const entryTimestamp = new Date(entry.timestamp);
        const timeDiff= (entryTimestamp - lastPositionTimestamp) / 1000;
        if (timeDiff > 2){
        console.log('timeDiff' , timeDiff)
        console.log('hfr', hfr ,  entry.timestamp)
        lastMessages.value.push({
          timestamp: entry.timestamp,
          position: lastKnownPosition, // letzte bekannte Position anhängen
          hfr,
          hfrMad
        });
        lastKnownPosition = null;
        lastPositionTimestamp = null;
      }
      }

      // Optional: Liste kürzen
      if (lastMessages.value.length > 10) {
        lastMessages.value.shift();
      }
      //console.log(lastMessages.value);
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
