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

function getColorForDataSource(source) {
  const colorMap = {
    Stars: '#3B82F6',      // blue
    HFR: '#EF4444',        // red
    Median: '#22C55E',     // green
    Mean: '#FBBF24',       // amber
    StDev: '#A78BFA',      // purple
    Min: '#06B6D4',        // cyan
    Max: '#F97316',        // orange
    Temperature: '#EC4899', // pink
    Gain: '#10B981',       // emerald
    Offset: '#8B5CF6',     // violet
    ExposureTime: '#6366F1', // indigo
  };
  return colorMap[source] || '#CCCCCC';
}

function getDataForSource(data, source) {
  return data.map((item) => item[source]);
}

function initGraph() {
  if (!store.imageHistoryInfo) {
    console.log('No data available');
    return;
  }

  const responseData = getFilteredData(store.imageHistoryInfo);

  // X-Achse (Labels)
  const labels = responseData.map((item) => new Date(item.Date).toLocaleTimeString());

  // Get selected data sources
  const source1 = settingsStore.monitorViewSetting.graphDataSource1;
  const source2 = settingsStore.monitorViewSetting.graphDataSource2;

  // Get data for selected sources
  const data1 = getDataForSource(responseData, source1);
  const data2 = getDataForSource(responseData, source2);

  // Chart.js-Instanz erzeugen
  chart = new Chart(hfrGraph.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: source1,
          data: data1,
          borderColor: getColorForDataSource(source1),
          fill: false,
          yAxisID: 'y1',
        },
        {
          label: source2,
          data: data2,
          borderColor: getColorForDataSource(source2),
          fill: false,
          yAxisID: 'y2',
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
        y1: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: source1,
            color: '#CCCCCC',
          },
          ticks: {
            color: '#CCCCCC',
          },
        },
        // Rechte Y-Achse
        y2: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: source2,
            color: '#CCCCCC',
          },
          ticks: {
            color: '#CCCCCC',
          },
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

  const source1 = settingsStore.monitorViewSetting.graphDataSource1;
  const source2 = settingsStore.monitorViewSetting.graphDataSource2;

  const newLabels = responseData.map((item) => new Date(item.Date).toLocaleTimeString());
  const newData1 = getDataForSource(responseData, source1);
  const newData2 = getDataForSource(responseData, source2);

  chart.data.labels = newLabels;
  chart.data.datasets[0].data = newData1;
  chart.data.datasets[1].data = newData2;
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

watch(
  () => [
    settingsStore.monitorViewSetting.graphDataSource1,
    settingsStore.monitorViewSetting.graphDataSource2,
  ],
  () => {
    console.log('[SequenceGraph] Data sources changed, rebuilding graph...');
    if (chart) {
      chart.destroy();
    }
    initGraph();
  }
);
</script>

<style scoped></style>
