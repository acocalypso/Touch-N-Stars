<template>
  <div>
    <canvas class="w-full h-[25vh] min-h-40" ref="hfrGraph"></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Chart } from 'chart.js/auto';
import { apiStore } from '@/store/store';

const store = apiStore();
const hfrGraph = ref(null);
let chart = null;

onMounted(() => {
  nextTick(() => {
    initGraph();
  });
});

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
  }
});

function initGraph() {
  if (!store.imageHistoryInfo) {
    console.log('Keine Daten vorhanden');
    return;
  }

  const responseData = store.imageHistoryInfo;

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
            display: true,
            text: 'Time',
          },
          ticks: {
            color: '#e5e7eb', // <- Zahlen-Beschriftung auf Y-Achse
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
        legend: {
          display: true,
          labels: {
            color: '#CCCCCC',
          },
        },
      },
    },
  });
}

watch(
  () => store.imageHistoryInfo,
  (newVal, oldVal) => {
    //Prüfen, ob es mehr Elemente als vorher gibt
    if (!oldVal || newVal.length > oldVal.length) {
      console.log('Neuer Datensatz hinzugekommen!');
      if (chart && newVal) {
        console.log('Daten aktualisieren');
        const newLabels = newVal.map((item) => new Date(item.Date).toLocaleTimeString());
        const newStarsData = newVal.map((item) => item.Stars);
        const newHfrData = newVal.map((item) => item.HFR);
        const newMedianData = newVal.map((item) => item.Median);

        chart.data.labels = newLabels;
        chart.data.datasets[0].data = newStarsData; // Stars
        chart.data.datasets[1].data = newHfrData; // HFR
        chart.data.datasets[2].data = newMedianData; // Median
        chart.update();
      }
    }
  },
);


</script>

<style scoped></style>
