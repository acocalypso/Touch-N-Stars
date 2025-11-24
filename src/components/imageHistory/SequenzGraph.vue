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
import { useSequenceStore } from '@/store/sequenceStore';
import TimeRangeControls from './TimeRangeControls.vue';

const store = apiStore();
const settingsStore = useSettingsStore();
const sequenceStore = useSequenceStore();
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

  // Auto-reset if startIndex is beyond current data length (new session with different data)
  if (startIndex >= allData.length) {
    console.log('[SequenzGraph] startIndex exceeds data length, resetting time range');
    settingsStore.resetHistoryTimeRange();
    return allData;
  }

  if (endIndex === null) {
    return allData.slice(startIndex);
  }
  return allData.slice(startIndex, endIndex + 1);
}

function destroyChart() {
  if (hfrGraph.value) {
    hfrGraph.value.removeEventListener('click', handleCanvasClick);
  }
  if (chart) {
    chart.destroy();
    chart = null;
  }
}

onBeforeUnmount(() => {
  destroyChart();
});

function getColorForDataSource(source) {
  const colorMap = {
    Stars: '#3B82F6', // blue
    HFR: '#EF4444', // red
    Median: '#22C55E', // green
    Mean: '#FBBF24', // amber
    StDev: '#A78BFA', // purple
    Min: '#06B6D4', // cyan
    Max: '#F97316', // orange
    Temperature: '#EC4899', // pink
    HFRStDev: '#6366F1', // indigo
    RmsText: '#6366F1', // indigo
  };
  return colorMap[source] || '#CCCCCC';
}

function getDataForSource(data, source) {
  return data.map((item) => {
    const value = item[source] ?? item['RmsText'];
    // Extract first number from RMS format "Tot: 0.00 (0.00")"
    if (source === 'RMS' && typeof value === 'string') {
      const match = value.match(/(-?\d+\.?\d*)\s*\(/);
      const num = match ? parseFloat(match[1]) : NaN;
      return num;
    }
    return value;
  });
}

function handleCanvasClick(event) {
  if (!chart) return;

  const canvasRect = hfrGraph.value.getBoundingClientRect();
  const clickX = event.clientX - canvasRect.left;

  // Get the x-axis scale
  const xScale = chart.scales.x;
  if (!xScale) return;

  // Calculate the data index from pixel position
  const dataIndex = Math.round(xScale.getValueForPixel(clickX));

  if (typeof dataIndex === 'number' && dataIndex >= 0 && dataIndex < chart.data.labels.length) {
    // Get the actual index in the full dataset (considering the time range)
    const { startIndex } = settingsStore.monitorViewSetting.historyTimeRange;
    const actualIndex = startIndex + dataIndex;

    console.log('[SequenzGraph] Clicked on data point index:', actualIndex);
    sequenceStore.setSelectedImageIndex(actualIndex);
  }
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

  // Add click handler to canvas
  hfrGraph.value.addEventListener('click', handleCanvasClick);
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
    destroyChart();
    initGraph();
  }
);
</script>

<style scoped></style>
