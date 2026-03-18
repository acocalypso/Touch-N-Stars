<template>
  <section
    class="rounded-2xl border border-gray-700/70 bg-gray-900/50 p-6 shadow-inner backdrop-blur"
  >
    <h2 class="text-lg font-semibold text-white flex items-center gap-2 mb-6">
      <svg class="h-5 w-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      {{ $t('plugins.narrowband.sections.chart') }}
    </h2>

    <div class="relative h-80 w-full">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import Chart from 'chart.js/auto';
import { normalPdf } from '../utils/filterCalculations.js';

const { t } = useI18n();

const props = defineProps({
  bandpassCenter: Number,
  fwhm: Number,
  flatTop: Number,
  peakTransmittance: Number,
  targetWavelength: Number,
  loadedCurveData: Array,
  aperture: Number,
  focalLength: Number,
  effectiveRefractiveIndex: Number,
  calculatedTransmission: {
    type: Number,
    default: 0,
  },
});

const chartCanvas = ref(null);
let chart = null;

/**
 * Get color for target wavelength
 */
function getTargetWavelengthColor() {
  if (!props.targetWavelength) return '#ef4444'; // default red

  const wl = props.targetWavelength;
  // Ha (656.3) - red
  if (Math.abs(wl - 656.3) < 5) {
    return '#ef4444'; // red
  }
  // OIII (500.7) - cyan
  if (Math.abs(wl - 500.7) < 5) {
    return '#06b6d4'; // cyan
  }
  // SII (672.4) - yellow
  if (Math.abs(wl - 672.4) < 5) {
    return '#eab308'; // yellow
  }

  // Default to red for unknown wavelengths
  return '#ef4444';
}

/**
 * Generate bandpass curve data
 */
function generateCurveData() {
  let start, end;

  // Use loaded curve data if available
  if (props.loadedCurveData && props.loadedCurveData.length > 0) {
    // Find the wavelength range where transmission is >= 10%
    const sortedData = [...props.loadedCurveData].sort((a, b) => a.wavelength - b.wavelength);
    const threshold = 0.1;
    let leftEdge = sortedData[0].wavelength;
    let rightEdge = sortedData[sortedData.length - 1].wavelength;

    for (let i = 0; i < sortedData.length; i++) {
      if (sortedData[i].transmission >= threshold) {
        leftEdge = sortedData[i].wavelength;
        break;
      }
    }

    for (let i = sortedData.length - 1; i >= 0; i--) {
      if (sortedData[i].transmission >= threshold) {
        rightEdge = sortedData[i].wavelength;
        break;
      }
    }

    // Expand by 3nm on each side
    start = leftEdge - 3;
    end = rightEdge + 3;

    const filtered = props.loadedCurveData.filter(
      (d) => d.wavelength >= start && d.wavelength <= end
    );

    const labels = filtered.map((d) => d.wavelength.toFixed(1));
    const transmissionData = filtered.map((d) => Math.max(0, Math.min(1, d.transmission)));
    return { labels, transmissionData };
  }

  // Otherwise calculate from parameters using FWHM
  // Estimate where transmission drops below 10%
  const stddev = (props.fwhm - props.flatTop) / 2.355;
  const normalDistributionMax = normalPdf(props.bandpassCenter, props.bandpassCenter, stddev);

  // Expand by 3nm on each side
  start = props.bandpassCenter - 3 - props.fwhm / 2.0;
  end = props.bandpassCenter + 3 + props.fwhm / 2.0;
  const step = (end - start) / 200;

  const labels = [];
  const transmissionData = [];

  for (let wavelength = start; wavelength <= end; wavelength += step) {
    labels.push(wavelength.toFixed(1));

    let transmission;
    if (wavelength < props.bandpassCenter - props.flatTop / 2) {
      const mean = props.bandpassCenter - props.flatTop / 2;
      transmission =
        (normalPdf(wavelength, mean, stddev) / normalDistributionMax) * props.peakTransmittance;
    } else if (wavelength > props.bandpassCenter + props.flatTop / 2) {
      const mean = props.bandpassCenter + props.flatTop / 2;
      transmission =
        (normalPdf(wavelength, mean, stddev) / normalDistributionMax) * props.peakTransmittance;
    } else {
      transmission = props.peakTransmittance;
    }

    transmissionData.push(Math.max(0, transmission));
  }

  return { labels, transmissionData };
}

function initChart() {
  if (!chartCanvas.value) return;

  const { labels, transmissionData } = generateCurveData();

  const ctx = chartCanvas.value.getContext('2d');

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('plugins.narrowband.filterTransmission'),
          data: transmissionData,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          titleColor: '#fff',
          bodyColor: '#d1d5db',
          borderColor: '#4b5563',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            label: function (context) {
              const value = context.parsed.y;
              if (value !== null && value !== undefined) {
                return t('plugins.narrowband.transmissionPercent', {
                  percent: (value * 100).toFixed(2),
                });
              }
              return '';
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: t('plugins.narrowband.wavelengthLabel'),
            color: '#9ca3af',
            font: {
              size: 12,
              weight: '500',
            },
          },
          ticks: {
            color: '#9ca3af',
            maxTicksLimit: 8,
          },
          grid: {
            color: 'rgba(75, 85, 99, 0.1)',
            drawBorder: false,
          },
        },
        y: {
          title: {
            display: true,
            text: t('plugins.narrowband.transmissionLabel'),
            color: '#9ca3af',
            font: {
              size: 12,
              weight: '500',
            },
          },
          ticks: {
            color: '#9ca3af',
            callback: function (value) {
              return (value * 100).toFixed(0) + '%';
            },
          },
          grid: {
            color: 'rgba(75, 85, 99, 0.1)',
            drawBorder: false,
          },
          min: 0,
          max: 1,
        },
      },
    },
    plugins: [
      {
        id: 'targetWavelengthPlugin',
        afterDatasetsDraw(c) {
          const xScale = c.scales.x;
          const yScale = c.scales.y;
          const ctx = c.ctx;

          if (!xScale || !yScale || !ctx) return;

          // Find the index closest to target wavelength
          const targetIndex = labels.reduce((closest, label, index) => {
            const diff = Math.abs(parseFloat(label) - props.targetWavelength);
            const closestDiff = Math.abs(parseFloat(labels[closest]) - props.targetWavelength);
            return diff < closestDiff ? index : closest;
          }, 0);

          // Get pixel position at target wavelength
          const xPixel = xScale.getPixelForValue(targetIndex);

          if (isNaN(xPixel)) return;

          // Get color based on target wavelength
          const lineColor = getTargetWavelengthColor();

          // Draw dashed vertical line at target wavelength
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]); // dashed line
          ctx.beginPath();
          ctx.moveTo(xPixel, c.chartArea.top);
          ctx.lineTo(xPixel, c.chartArea.bottom);
          ctx.stroke();
          ctx.setLineDash([]); // reset
        },
      },
    ],
  });
}

watch(
  [
    () => props.bandpassCenter,
    () => props.fwhm,
    () => props.flatTop,
    () => props.peakTransmittance,
    () => props.targetWavelength,
    () => props.loadedCurveData,
    () => props.aperture,
    () => props.focalLength,
    () => props.effectiveRefractiveIndex,
    () => props.calculatedTransmission,
  ],
  () => {
    // Always redraw chart when props change
    if (chart && chartCanvas.value) {
      initChart();
    }
  },
  { immediate: false }
);

onMounted(() => {
  nextTick(() => {
    initChart();
  });
});
</script>
