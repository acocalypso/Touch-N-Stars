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
let lastKnownPosition = null; // Hier merken wir uns die letzte gesetzte Position
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
            segment: {
              borderDash: (ctx) => {
                const totalPoints = ctx.chart.data.datasets[0].data.length;
                if (ctx.p0DataIndex === totalPoints - 2 && ctx.p1DataIndex === totalPoints - 1) {
                  return [5, 5]; // gestrichelte Linie
                }
                return undefined;
              },
            },
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

    const sortedLogs = [...newLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (const entry of sortedLogs) {
      if (lastProcessedTimestamp && new Date(entry.timestamp) <= new Date(lastProcessedTimestamp)) {
        continue;
      }

      const processedTimestampMatch = entry.message.match(
        /Starting AutoFocus with initial position (\d+)/
      );
      const positionMatch = entry.message.match(/Moving Focuser to position (\d+)/);
      const hfrMatch = entry.message.match(/Average HFR: ([\d.]+), HFR MAD: ([\d.]+)/);

      if (processedTimestampMatch) {
        lastPositionTimestamp = new Date(entry.timestamp);
        lastMessages.value = []; // Liste zurücksetzen, wenn ein neuer Autofokus gestartet wird
        console.log('lastPositionTimestamp gesetzt auf:', lastPositionTimestamp);
      }

      // Focuser wurde bewegt → Position merken
      if (positionMatch && !lastKnownPosition) {
        lastKnownPosition = parseInt(positionMatch[1], 10);
        console.log('lastKnownPosition', lastKnownPosition, entry.timestamp);
        lastPositionTimestamp = new Date(entry.timestamp);
      }

      // HFR erkannt → letzte bekannte Position mit speichern
      if (hfrMatch && lastPositionTimestamp) {
        const hfr = parseFloat(hfrMatch[1]);
        const hfrMad = parseFloat(hfrMatch[2]);
        const entryTimestamp = new Date(entry.timestamp);
        const timeDiff = (entryTimestamp - lastPositionTimestamp) / 1000;
        if (timeDiff > 2) {
          console.log('timeDiff', timeDiff);
          console.log('hfr', hfr, entry.timestamp);
          lastMessages.value.push({
            timestamp: entry.timestamp,
            position: lastKnownPosition, // letzte bekannte Position anhängen
            hfr,
            hfrMad,
          });
          lastKnownPosition = null;
          lastPositionTimestamp = null;
        }
      }

      // Optional: Liste kürzen
      if (lastMessages.value.length > 50) {
        lastMessages.value.shift();
      }
      //console.log(lastMessages.value);
      lastProcessedTimestamp = entry.timestamp;
    }
    updateChart(); // immer aktualisieren, wenn neue Logs da sind
  },
  { deep: true }
);

onMounted(() => {
  const logs = logStore.LogsInfo.logs;

  if (logs && logs.length > 0) {
    const matchingLogs = logs
      .filter((entry) => entry.message.includes('Starting AutoFocus with initial position'))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // nach Datum absteigend

    if (matchingLogs.length > 0) {
      lastProcessedTimestamp = new Date(matchingLogs[0].timestamp);
      console.log('Initial lastPositionTimestamp gesetzt auf:', lastProcessedTimestamp);
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
