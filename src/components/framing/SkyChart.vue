<template>
  <div class="bg-gray-800/50 rounded-lg p-2 relative h-40">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
  target: {
    type: Object, // { RA: in degrees, Dec: in degrees }
    required: true,
  },
  coordinates: {
    type: Object, // { latitude, longitude }
    required: true,
  },
});

const canvasRef = ref(null);
let chartInstance = null;

function toJulian(date) {
  return date / 86400000 - date.getTimezoneOffset() / 1440 + 2440587.5;
}

function calculateAltitude(raDeg, decDeg, observerLat, observerLon, date) {
  const latRad = (observerLat * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;
  const JD = toJulian(date);
  const GMST = 18.697374558 + 24.06570982441908 * (JD - 2451545.0);
  const LMST = (GMST + observerLon / 15) % 24;
  const hourAngle = LMST * 15 - raDeg;
  const haRad = (hourAngle * Math.PI) / 180;

  const altRad = Math.asin(
    Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad)
  );

  return (altRad * 180) / Math.PI;
}

const altitudeData = computed(() => {
  if (!props.target?.RA || !props.target?.Dec) return [];

  const now = new Date();
  const currentHour = now.getHours();

  const points = [];
  for (let i = -12; i <= 12; i++) {
    const time = new Date(now);
    time.setHours(currentHour + i, 0, 0, 0);
    const alt = calculateAltitude(
      props.target.RA,
      props.target.Dec,
      props.coordinates.latitude,
      props.coordinates.longitude,
      time
    );
    points.push({
      label: `${(currentHour + i + 24) % 24}h`,
      altitude: alt,
    });
  }
  return points;
});

function createChart() {
  if (!canvasRef.value || altitudeData.value.length === 0) return;

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: altitudeData.value.map((p) => p.label),
      datasets: [
        {
          label: 'Altitude (°)',
          data: altitudeData.value.map((p) => p.altitude),
          borderColor: 'rgb(6, 182, 212)',
          backgroundColor: 'rgba(6, 182, 212, 0.2)',
          pointRadius: 0,
          tension: 0.3,
        },
        {
          type: 'bar',
          data: altitudeData.value.map((_, i) => {
            const mid = Math.floor(altitudeData.value.length / 2);
            return i === mid ? 90 : 0;
          }),
          backgroundColor: 'rgba(6, 182, 212,0.5)',
          borderWidth: 0,
          barPercentage: 0.1,
          categoryPercentage: 1.0,
          order: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 90,
          title: {
            display: false,
            text: 'Altitude (°)',
          },
          ticks: {
            color: '#ccc',
          },
          grid: {
            color: 'rgba(255,255,255,0.1)',
          },
        },
        x: {
          title: {
            display: false,
            text: 'Time (h)',
          },
          ticks: {
            color: '#ccc',
          },
          grid: {
            display: false,
            color: 'rgba(255,255,255,0.05)',
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

onMounted(createChart);
watch(altitudeData, createChart);
</script>
