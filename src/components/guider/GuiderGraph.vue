<template>
  <div>
    <div v-show="isLoading" class="flex items-center justify-center">
      <span
        class="w-12 h-12 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"
      ></span>
    </div>
    <div v-show="!isLoading" class="w-full h-[25vh] min-h-40">
      <canvas ref="rmsGraph"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';
import { useGuiderStore } from '@/store/guiderStore';
const guiderStore = useGuiderStore();
const isLoading = ref(true);
const rmsGraph = ref(null);
let chart = null;

const initGraph = () => {
  const size = guiderStore.chartInfo.HistorySize;
  const ctx = rmsGraph.value.getContext('2d');

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Array(size).fill(''),
      datasets: [
        {
          type: 'line',
          label: 'RA "',
          borderColor: 'rgba(70, 130, 180, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0,
          pointRadius: 0,
          data: Array(size).fill(null),
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line',
          label: 'Dec "',
          borderColor: 'rgba(220, 20, 60, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0,
          pointRadius: 0,
          data: Array(size).fill(null),
          yAxisID: 'y',
          order: 3,
        },
        {
          type: 'bar',
          label: 'RA Duration',
          backgroundColor: 'rgba(70, 130, 180, 0.4)',
          data: Array(size).fill(null),
          yAxisID: 'y1',
          order: 4,
        },
        {
          type: 'bar',
          label: 'Dec Duration',
          backgroundColor: 'rgba(220, 20, 60, 0.4)',
          data: Array(size).fill(null),
          yAxisID: 'y1',
          order: 5,
        },
        {
          type: 'scatter',
          label: 'Dither',
          data: Array(size).fill(null),
          yAxisID: 'y',
          showLine: false,
          pointRadius: 6,
          pointStyle: 'triangle',
          backgroundColor: 'rgba(255, 165, 0, 1)',
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#CCCCCC',
          },
        },
        tooltip: {
          enabled: false,
        },
      },
      animation: {
        duration: 0,
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          position: 'left',
          min: guiderStore.chartInfo.MinY,
          max: guiderStore.chartInfo.MaxY,
          grid: {
            color: 'rgba(248, 248, 255, 0.1)',
          },
          title: {
            display: true,
            color: '#CCCCCC',
            text: 'RA/Dec',
          },
          ticks: {
            color: '#e5e7eb', // <- Zahlen-Beschriftung auf Y-Achse
          },
        },
        y1: {
          position: 'right',
          stacked: false,
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            color: '#CCCCCC',
            text: 'Duration (ms)',
          },
          ticks: {
            color: '#e5e7eb', // <- Zahlen-Beschriftung auf Y-Achse
          },
        },
      },
    },
  });
};

// Überwachung der Store-Daten
watch(
  () => guiderStore.chartInfo.GuideSteps,
  (steps) => {
    if (!chart) return;

    const size = guiderStore.chartInfo.HistorySize;
    const raDist = Array(size).fill(null);
    const decDist = Array(size).fill(null);
    const raDur = Array(size).fill(null);
    const decDur = Array(size).fill(null);
    const dither = [];
    const labels = Array(size).fill('');

    let maxDuration = 0;

    steps.slice(-size).forEach((step, i) => {
      const ra = step.RADuration ?? 0;
      const dec = step.DECDuration ?? 0;

      raDist[i] = step.RADistanceRawDisplay ?? null;
      decDist[i] = step.DECDistanceRawDisplay ?? null;
      raDur[i] = ra;
      decDur[i] = dec;

      labels[i] = step.Id.toString();

      if (step.Dither && step.Dither !== 'NaN') {
        dither.push({ x: step.Id.toString(), y: 0 });
      }

      maxDuration = Math.max(maxDuration, Math.abs(ra), Math.abs(dec));
    });

    // Dynamische Skalierung der Y1-Achse (symmetrisch)
    const maxAbs = Math.max(maxDuration, 100); // fallback auf 100 falls alles null

    chart.options.scales.y1.suggestedMin = -maxAbs;
    chart.options.scales.y1.suggestedMax = maxAbs;

    chart.data.datasets[0].data = raDist;
    chart.data.datasets[1].data = decDist;
    chart.data.datasets[2].data = raDur;
    chart.data.datasets[3].data = decDur;
    chart.data.datasets[4].data = dither;
    chart.data.labels = labels;

    chart.update();
    isLoading.value = false;
  },
  { immediate: true }
);

onMounted(async () => {
  await guiderStore.fetchGraphInfos();
  guiderStore.startFetching();
  initGraph();
});

onBeforeUnmount(() => {
  guiderStore.stopFetching();
  if (chart) {
    chart.destroy();
  }
});
</script>

<style scoped></style>
