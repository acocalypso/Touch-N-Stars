<template>
  <!-- Chart -->
  <div class="h-72 w-full">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useLogStore } from '@/store/logStore';
import { Chart, registerables } from 'chart.js';
import { apiStore } from '@/store/store';

const store = apiStore();

Chart.register(...registerables);

const chartRef = ref(null);
let chartInstance = null;

const logStore = useLogStore();
let lastProcessedTimestamp = null;
let lastKnownPosition = null; // Hier merken wir uns die letzte gesetzte Position
let lastPositionTimestamp = null;

// Funktion zum Zeichnen/Updaten des Charts
function updateChart() {
  const hfrData = store.afCurveData
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

      const positionMatch = entry.message.match(/Moving Focuser to position (\d+)/);
      const hfrMatch = entry.message.match(/Average HFR: ([\d.]+), HFR σ: ([\d.]+)/);

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
          store.afCurveData.push({
            timestamp: entry.timestamp,
            position: lastKnownPosition, // letzte bekannte Position anhängen
            hfr,
            hfrMad,
          });
          lastKnownPosition = null;
          lastPositionTimestamp = null;
        }
      }
      console.log('store.focuserAfInfo.autofocus_running', store.focuserAfInfo.autofocus_running);
      // Optional: Liste kürzen
      if (store.afCurveData.length > 50) {
        store.afCurveData.shift();
      }
      lastProcessedTimestamp = entry.timestamp;
    }
    updateChart(); // immer aktualisieren, wenn neue Logs da sind
  },
  { deep: true }
);

onMounted(() => {
  lastProcessedTimestamp = store.afTimestampLastStart;
});
</script>

<style scoped></style>
