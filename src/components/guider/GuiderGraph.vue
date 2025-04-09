<template>
  <div>
    <div>
      <canvas ref="rmsGraph"></canvas>
    </div>
    <div class="note">
      {{ $t('components.guider.notes') }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';
import { apiStore } from '@/store/store';
const store = apiStore();

const rmsGraph = ref(null);
let chart = null; // Nicht reaktiv

const initGraph = () => {
  const ctx = rmsGraph.value.getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array(store.guiderChartInfo.HistorySize).fill(''),
      datasets: [
        {
          label: 'RA "',
          borderColor: 'rgba(70, 130, 180, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.5,
          pointRadius: 0,
          data: [0],
        },
        {
          label: 'Dec "',
          borderColor: 'rgba(220, 20, 60, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.5,
          pointRadius: 0,
          data: [0],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0,
      },
      scales: {
        y: {
          suggestedMin: -3,
          suggestedMax: 3,
          grid: {
            color: 'rgba(248, 248, 255, 0.1)',
          },
        },
      },
    },
  });
};

// Überwachung der Store-Daten
watch(
  () => store.RADistanceRaw, // Beobachte RADistanceRaw im Store
  (newValues) => {
    if (chart) {
      chart.data.datasets[0].data = newValues; // Aktualisiere die RA-Daten
      chart.update(); // Aktualisiere den Chart
    }
  },
  { immediate: true } // Damit der Watcher direkt beim Mounten ausgeführt wird
);

watch(
  () => store.DECDistanceRaw, // Beobachte DECDistanceRaw im Store
  (newValues) => {
    if (chart) {
      chart.data.datasets[1].data = newValues; // Aktualisiere die Dec-Daten
      chart.update(); // Aktualisiere den Chart
    }
  },
  { immediate: true }
);

onMounted(() => {
  initGraph();
});

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy(); 
  }
});
</script>

<style scoped>
canvas {
  max-width: 100%;
  height: 200px;
}

.note {
  font-size: 0.8em;
  color: #666;
  margin-top: 8px;
  font-style: italic;
}
</style>
