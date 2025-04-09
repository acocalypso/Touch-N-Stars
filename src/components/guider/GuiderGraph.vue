<template>
  <div>
    <div v-show="isLoading" class="flex items-center justify-center">
      <span class="w-12 h-12 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin" ></span>
    </div>
    <div v-show="!isLoading" >
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
import { useGuiderStore } from '@/store/guiderStore';
const guiderStore = useGuiderStore();
const isLoading = ref(true);
const rmsGraph = ref(null);
let chart = null; 

const initGraph = () => {
  const ctx = rmsGraph.value.getContext('2d');
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Array(guiderStore.chartInfo.HistorySize).fill(''),
      datasets: [
        {
          type: 'line',
          label: 'RA "',
          borderColor: 'rgba(70, 130, 180, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.5,
          pointRadius: 0,
          data: [0],
          yAxisID: 'y', // linke Achse
          order: 2,
        },
        {
          type: 'line',
          label: 'Dec "',
          borderColor: 'rgba(220, 20, 60, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.5,
          pointRadius: 0,
          data: [0],
          yAxisID: 'y', // linke Achse
          order: 3,
        },
        {
          type: 'bar',
          label: 'RA Duration',
          backgroundColor: 'rgba(70, 130, 180, 0.4)',
          data: [0],
          yAxisID: 'y1',
          order: 4,
        },
        {
          type: 'bar',
          label: 'Dec Duration',
          backgroundColor: 'rgba(220, 20, 60, 0.4)',
          data: [0],
          yAxisID: 'y1',
          order: 5,
        },
        {
          type: 'scatter',
          label: 'Dither',
          data: [null], 
          yAxisID: 'y', 
          showLine: false,
          pointRadius: 6,
          pointStyle: 'triangle', 
          backgroundColor: 'rgba(255, 165, 0, 1)', // orange Marker
          order: 1,
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
          position: 'left',
          suggestedMin: -3,
          suggestedMax: 3,
          grid: {
            color: 'rgba(248, 248, 255, 0.1)',
          },
          title: {
            display: true,
            text: 'RA/Dec (")',
          },
        },
        y1: {
          position: 'right',
          stacked: false,
          suggestedMin: guiderStore.chartInfo.MinDurationY || -1000,
          suggestedMax: guiderStore.chartInfo.MaxDurationY || 1000,
          grid: {
            drawOnChartArea: false, 
          },
          title: {
            display: true,
            text: 'Duration (ms)',
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

    const raDist = [];
    const decDist = [];
    const raDur = [];
    const decDur = [];
    const ditherMarkers = steps
        .filter(step => step.Dither && step.Dither !== "NaN")
        .map(step => ({ x: step.Id.toString(), y: 0 }));
    //console.log('steps', steps);
    steps.forEach((step) => {
      raDist.push(step.RADistanceRaw ?? 0);
      decDist.push(step.DECDistanceRaw ?? 0);
      raDur.push(step.RADuration ?? 0);
      decDur.push(step.DECDuration ?? 0);

    });

    chart.data.datasets[0].data = raDist; // RA line
    chart.data.datasets[1].data = decDist; // Dec line
    chart.data.datasets[2].data = raDur; // RA Duration bar
    chart.data.datasets[3].data = decDur; // Dec Duration bar
    chart.data.datasets[4].data = ditherMarkers; // Dither scatter

    chart.data.labels = steps.map((s) => s.Id.toString()); // für bessere Achsen-Beschriftung (optional)

    chart.update();
    isLoading.value = false;
  },
  { immediate: true }
);


onMounted(async() => {
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
