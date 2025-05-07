<template>
  <div class="bg-gray-800/50 rounded-lg p-2 relative h-40">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const horizonData = ref([]);

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
          label: 'Horizontprofil',
          data: horizonAltitudes.value,
          borderColor: 'rgba(255, 99, 132, 1)', // oder ersetze durch 'gray'
          backgroundColor: 'rgba(100, 100, 100, 0.4)', // grauer Bereich unter der Kurve
          pointRadius: 0,
          tension: 0,
          fill: 'start', // wichtig: füllt unterhalb der Linie bis zur x-Achse
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

async function loadCustomHorizont() {
  try {
    const response = await fetch('/Horizont.hrz');
    console.log(response);

    if (!response.ok) {
      console.log('Custom horizon not found:', response.status);
      return;
    }
    const hrzData = await response.text();

    console.log(hrzData);
    const lines = hrzData.trim().split('\n');
    horizonData.value = lines.map((line) => {
      const [azimuth, altitude] = line.trim().split('\t').map(Number);
      return { azimuth, altitude };
    });
    console.log(horizonData.value);
  } catch (error) {
    console.error('Error loading star data:', error);
  }
}

function calculateAzimuth(raDeg, decDeg, observerLat, observerLon, date) {
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

  const cosA =
    (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) /
    (Math.cos(altRad) * Math.cos(latRad));
  const sinA = (-Math.cos(decRad) * Math.sin(haRad)) / Math.cos(altRad);

  let azRad = Math.atan2(sinA, cosA);
  if (azRad < 0) azRad += 2 * Math.PI;

  return (azRad * 180) / Math.PI;
}

const horizonAltitudes = computed(() => {
  if (!props.target?.RA || !props.target?.Dec || horizonData.value.length === 0) return [];

  const now = new Date();
  const currentHour = now.getHours();

  const points = [];
  for (let i = -12; i <= 12; i++) {
    const time = new Date(now);
    time.setHours(currentHour + i, 0, 0, 0);
    const az = calculateAzimuth(
      props.target.RA,
      props.target.Dec,
      props.coordinates.latitude,
      props.coordinates.longitude,
      time
    );
    points.push(interpolateHorizon(az));
  }
  return points;
});

function interpolateHorizon(azimuth) {
  const sorted = [...horizonData.value].sort((a, b) => a.azimuth - b.azimuth);

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];

    if (azimuth >= a.azimuth && azimuth <= b.azimuth) {
      const t = (azimuth - a.azimuth) / (b.azimuth - a.azimuth);
      return a.altitude + t * (b.altitude - a.altitude);
    }
  }

  // Wrap-around von z.B. 359° auf 0°
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (azimuth >= last.azimuth || azimuth <= first.azimuth) {
    const span = first.azimuth + 360 - last.azimuth;
    const t = ((azimuth - last.azimuth + 360) % 360) / span;
    return last.altitude + t * (first.altitude - last.altitude);
  }

  return 0;
}

onMounted(async () => {
  await loadCustomHorizont();
  createChart();
});
watch(altitudeData, createChart);
</script>
