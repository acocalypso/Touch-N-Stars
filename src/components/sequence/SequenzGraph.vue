<template>
  <div class="flex flex-col gap-3 px-2">
  <div class="w-full h-[15vh] min-h-20">
    <canvas ref="hfrGraph"></canvas>
  </div>
   <TimeRangeControls />
</div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Chart } from 'chart.js/auto';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import TimeRangeControls from './TimeRangeControls.vue';

const store = apiStore();
const settingsStore = useSettingsStore();
const hfrGraph = ref(null);
let chart = null;

onMounted(() => {
  nextTick(() => {
    initGraph();
  });
});

function getFilteredData(allData) {
  if (!allData || allData.length === 0) return allData;

  const { startIndex, endIndex } = settingsStore.monitorViewSetting.historyTimeRange;

  if (endIndex === null) {
    return allData.slice(startIndex);
  }
  return allData.slice(startIndex, endIndex + 1);
}

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
  }
});

function initGraph() {
  if (!store.imageHistoryInfo) {
    console.log('No data available');
    return;
  }

  const responseData = getFilteredData(store.imageHistoryInfo);

  // X-Achse (Labels)
  const labels = responseData.map((item) => new Date(item.Date).toLocaleTimeString());

  // Y-Achse (Daten) für Stars
  const starsData = responseData.map((item) => item.Stars);

  // Y-Achse (Daten) für HFR
  const hfrData = responseData.map((item) => item.HFR);

  // Y-Achse (Daten) für Median
  const medinaData = responseData.map((item) => item.Median);

  // Chart.js-Instanz erzeugen
  chart = new Chart(hfrGraph.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Stars',
          data: starsData,
          borderColor: 'blue',
          fill: false,
          yAxisID: 'yStars',
        },
        {
          label: 'HFR',
          data: hfrData,
          borderColor: 'red',
          fill: false,
          yAxisID: 'yHfr', // <--- Wichtig: ID der rechten Y-Achse
        },
        {
          label: 'Median',
          data: medinaData,
          borderColor: 'green',
          fill: false,
          yAxisID: 'yMedian', // <--- Wichtig: ID der linken Y-Achse
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: false,
            text: 'Time',
          },
          ticks: {
            display: false,
          },
        },
        // Linke Y-Achse
        yStars: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Stars',
            color: '#CCCCCC',
          },
          ticks: {
            color: '#CCCCCC', // <- Zahlen-Beschriftung auf Y-Achse
          },
        },
        // Rechte Y-Achse
        yHfr: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'HFR',
            color: '#CCCCCC',
          },
          ticks: {
            color: '#CCCCCC', // <- Zahlen-Beschriftung auf Y-Achse
          },
        },
        // Rechte Y-Achse
        yMedian: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Median',
            color: '#CCCCCC',
          },
          ticks: {
            color: '#CCCCCC', // <- Zahlen-Beschriftung auf Y-Achse
          },

          // Verhindert Überlagerung der Gitterlinien
          grid: {
            drawOnChartArea: false,
          },
        },
      },
      plugins: {
        tooltip: {
          enabled: false,
        },
        legend: {
          display: true,
          labels: {
            color: '#CCCCCC',
            usePointStyle: false,
            boxWidth: 20,
            boxHeight: 2,
          },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    },
  });
}

function updateChartData() {
  if (!chart || !store.imageHistoryInfo) return;

  const responseData = getFilteredData(store.imageHistoryInfo);

  const newLabels = responseData.map((item) => new Date(item.Date).toLocaleTimeString());
  const newStarsData = responseData.map((item) => item.Stars);
  const newHfrData = responseData.map((item) => item.HFR);
  const newMedianData = responseData.map((item) => item.Median);

  chart.data.labels = newLabels;
  chart.data.datasets[0].data = newStarsData; // Stars
  chart.data.datasets[1].data = newHfrData; // HFR
  chart.data.datasets[2].data = newMedianData; // Median
  chart.update();
}

watch(
  () => store.imageHistoryInfo,
  (newVal, oldVal) => {
    //Check if new data is added
    if (!oldVal || newVal.length > oldVal.length) {
      console.log('[SequenceGraph] New data available, updating graph...');
      updateChartData();
    }
  }
);

watch(
  () => settingsStore.monitorViewSetting.historyTimeRange,
  () => {
    console.log('[SequenceGraph] Time range changed, updating graph...');
    updateChartData();
  },
  { deep: true }
);
</script>

<style scoped></style>
