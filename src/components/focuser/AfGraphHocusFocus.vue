<template>
  <!-- Chart -->
  <div>
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
const processedEntries = new Set(); // Duplikate verhindern
let pendingPositions = []; // Warteschlange für Positionen

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

watch(
  () => logStore.LogsInfo.logs,
  (newLogs) => {
    if (!newLogs || newLogs.length === 0) return;

    const sortedLogs = [...newLogs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const entry of sortedLogs) {
      const entryKey = `${entry.timestamp}|${entry.message}`;
      if (processedEntries.has(entryKey)) continue;
      processedEntries.add(entryKey);

      const startMatch = entry.message.match(/Starting AutoFocus with initial position (\d+)/);
      const moveMatch = entry.message.match(/Moving Focuser to position (\d+)/);
      const hfrMatch = entry.message.match(/Average HFR: ([\d.]+), HFR MAD: ([\d.]+)/);

      if (startMatch) {
        pendingPositions = []; // Nur hier zurücksetzen
        lastMessages.value = [];
        const position = parseInt(startMatch[1], 10);
        pendingPositions.push({ position, timestamp: entry.timestamp });
        console.log('Position start:', position);
      }

      if (moveMatch) {
        const position = parseInt(moveMatch[1], 10);
        pendingPositions.push({ position, timestamp: entry.timestamp });
        console.log('Position vorgemerkt:', position);
      }

      if (hfrMatch) {
        if (pendingPositions.length === 0) {
          console.warn('HFR erkannt, aber keine freie Position verfügbar:', entry.message);
          continue;
        }

        const hfr = parseFloat(hfrMatch[1]);
        const hfrMad = parseFloat(hfrMatch[2]);

        pendingPositions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const posObj = pendingPositions.shift();

        lastMessages.value.push({
          timestamp: entry.timestamp,
          position: posObj.position,
          hfr,
          hfrMad,
        });

        console.log('HFR', hfr, 'zu Position', posObj.position, 'zugewiesen');
      }

      if (lastMessages.value.length > 50) {
        lastMessages.value.shift();
      }

      lastProcessedTimestamp = entry.timestamp;
    }

    lastMessages.value.sort((a, b) => a.position - b.position);
    updateChart();
  },
  { deep: true }
);

onMounted(() => {
  const logs = logStore.LogsInfo.logs;

  if (logs && logs.length > 0) {
    const matchingLogs = logs
      .filter((entry) => entry.message.includes('Starting AutoFocus with initial position'))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (matchingLogs.length > 0) {
      lastProcessedTimestamp = new Date(matchingLogs[0].timestamp);
      console.log('Initial lastProcessedTimestamp:', lastProcessedTimestamp);
    }
  }
});
</script>

