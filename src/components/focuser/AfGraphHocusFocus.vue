<template>
  <!-- Chart -->
  <div style="height: 300px">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useLogStore } from '@/store/logStore';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const chartRef = ref(null);
let chartInstance = null;

const logStore = useLogStore();
let lastProcessedTimestamp = null;
const lastMessages = ref([]);
let lastKnownPosition = null; 
let lastPositionTimestamp = null;

// Funktion zum Zeichnen/Updaten des Charts
function updateChart() {
  const hfrData = lastMessages.value
    .filter((entry) => entry.hfr !== null && entry.position !== null)
    .map((entry) => ({
      x: entry.position,
      y: entry.hfr,
    }));

  if (!chartInstance) {
    chartInstance = new Chart(chartRef.value, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'AF-Graph',
            data: hfrData,
            tension: 0.3,
            cubicInterpolationMode: 'default',
            pointRadius: 4,
            pointStyle: 'circle',
 
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Position',
            },
          },
          y: {
            title: {
              display: true,
              text: 'HFR',
            },
          },
        },
      },
    });
  } else {
    chartInstance.data.datasets[0].data = hfrData;
    chartInstance.update();
  }
}

// Beobachte Log-Änderungen:
watch(
  () => logStore.LogsInfo.logs,
  (newLogs) => {
    if (!newLogs || newLogs.length === 0) return;

    // Logs zuerst nach Timestamp sortieren, damit wir sie chronologisch durchgehen
    const sortedLogs = [...newLogs].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    for (const entry of sortedLogs) {
      if (lastProcessedTimestamp && new Date(entry.timestamp) <= new Date(lastProcessedTimestamp)) {
        continue;
      }

      const processedTimestampMatch = entry.message.match(
        /Starting AutoFocus with initial position (\d+)/
      );
      const positionMatch = entry.message.match(/Moving Focuser to position (\d+)/);
      const hfrMatch = entry.message.match(/Average HFR: ([\d.]+), HFR MAD: ([\d.]+)/);

      // Neuer Autofokus-Start → Array zurücksetzen
      if (processedTimestampMatch) {
        lastPositionTimestamp = new Date(entry.timestamp);
        lastKnownPosition = parseInt(processedTimestampMatch[1], 10);
        lastMessages.value = []; 

        console.log('Neuer Autofokus-Start, lastPositionTimestamp:', lastPositionTimestamp, 'lastKnownPosition' ,lastKnownPosition);
      }

      // Focuser wurde bewegt → Position merken
      if (positionMatch && !lastKnownPosition) {
        lastKnownPosition = parseInt(positionMatch[1], 10);
        lastPositionTimestamp = new Date(entry.timestamp);
        console.log('lastKnownPosition', lastKnownPosition, entry.timestamp);
      }

      // HFR erkannt → letzte bekannte Position mit speichern
      if (hfrMatch && lastPositionTimestamp) {
        const hfr = parseFloat(hfrMatch[1]);
        const hfrMad = parseFloat(hfrMatch[2]);
        const entryTimestamp = new Date(entry.timestamp);
        const timeDiff = (entryTimestamp - lastPositionTimestamp) ;
        if (timeDiff > 1000) {
          console.log('timeDiff:', timeDiff);
          console.log('HFR:', hfr, 'Zeitpunkt:', entry.timestamp);
          lastMessages.value.push({
            timestamp: entry.timestamp,
            position: lastKnownPosition,
            hfr,
            hfrMad,
          });
          // Reset
          lastKnownPosition = null;
          lastPositionTimestamp = null;
        }
      }

      // Optional: Liste kürzen
      if (lastMessages.value.length > 50) {
        lastMessages.value.shift();
      }

      lastProcessedTimestamp = entry.timestamp;
    }
    lastMessages.value.sort((a, b) => a.position - b.position);
   

    // Anschließend aktualisieren wir den Chart:
    updateChart();
  },
  { deep: true }
);

onMounted(() => {
  const logs = logStore.LogsInfo.logs;

  if (logs && logs.length > 0) {
    const matchingLogs = logs
      .filter((entry) => entry.message.includes('Starting AutoFocus with initial position'))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Datum absteigend

    if (matchingLogs.length > 0) {
      lastProcessedTimestamp = new Date(matchingLogs[0].timestamp);
      console.log('Initial lastProcessedTimestamp:', lastProcessedTimestamp);
    }
  }
});
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
