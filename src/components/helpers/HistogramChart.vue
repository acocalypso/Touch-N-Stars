<template>
  <div v-if="data && data.length > 0" class="histogram-container p-4 bg-gray-900 rounded-lg">
    <div class="histogram-header mb-2 flex justify-between items-center">
      <h3 class="text-sm font-semibold text-gray-300">Brightness Histogram</h3>
      <div class="text-xs text-gray-400 space-x-3">
        <span>Black: <span class="text-gray-300 font-mono">{{ localBlackPoint }}</span></span>
        <span>White: <span class="text-gray-300 font-mono">{{ localWhitePoint }}</span></span>
      </div>
    </div>

    <!-- Range Slider with Visual Indicators -->
    <div class="mb-2 space-y-1">
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="text-xs text-gray-400">Black</label>
          <input
            v-model.number="localBlackPoint"
            type="range"
            min="0"
            max="255"
            class="w-full h-2 bg-gray-700 rounded-full cursor-pointer appearance-none accent-red-500"
            @input="onBlackPointChange"
          />
          <div class="text-xs text-gray-400 text-right">{{ localBlackPoint }}</div>
        </div>
        <div class="flex-1">
          <label class="text-xs text-gray-400">White</label>
          <input
            v-model.number="localWhitePoint"
            type="range"
            min="0"
            max="255"
            class="w-full h-2 bg-gray-700 rounded-full cursor-pointer appearance-none accent-gray-300"
            @input="onWhitePointChange"
          />
          <div class="text-xs text-gray-400 text-right">{{ localWhitePoint }}</div>
        </div>
      </div>
    </div>

    <div class="histogram-canvas-wrapper" :style="{ height: height, width: width }">
      <canvas ref="canvasElement" class="histogram-canvas w-full h-full"></canvas>
    </div>

    <div v-if="showStats" class="histogram-stats mt-3 grid grid-cols-4 gap-2 text-xs text-gray-400">
      <div>
        <span class="text-gray-500">Min:</span>
        <span class="text-gray-300 font-mono">{{ stats.min }}</span>
      </div>
      <div>
        <span class="text-gray-500">Max:</span>
        <span class="text-gray-300 font-mono">{{ stats.max }}</span>
      </div>
      <div>
        <span class="text-gray-500">Mean:</span>
        <span class="text-gray-300 font-mono">{{ stats.mean.toFixed(0) }}</span>
      </div>
      <div>
        <span class="text-gray-500">Median:</span>
        <span class="text-gray-300 font-mono">{{ stats.median.toFixed(0) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { getHistogramStats } from '@/utils/histogramUtils';

const props = defineProps({
  data: {
    type: Array,
    default: null,
  },
  height: {
    type: String,
    default: '120px',
  },
  width: {
    type: String,
    default: '100%',
  },
  showStats: {
    type: Boolean,
    default: true,
  },
  blackPoint: {
    type: Number,
    default: 0,
  },
  whitePoint: {
    type: Number,
    default: 255,
  },
});

const emit = defineEmits(['levels-changed']);

const canvasElement = ref(null);
const stats = ref({ min: 0, max: 0, mean: 0, median: 0 });
const localBlackPoint = ref(props.blackPoint);
const localWhitePoint = ref(props.whitePoint);

const drawHistogram = () => {
  if (!canvasElement.value || !props.data || props.data.length === 0) {
    return;
  }

  const canvas = canvasElement.value;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return;
  }

  // Set canvas size
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  const width = canvas.width;
  const height = canvas.height;
  const padding = 10;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Find max value for scaling
  const maxValue = Math.max(...props.data);

  // Clear canvas
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  // Draw grid lines
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding + (graphHeight / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  // Draw histogram bars
  const barWidth = graphWidth / props.data.length;
  const hue = 200; // Cyan/blue color

  props.data.forEach((value, index) => {
    const barHeight = (value / maxValue) * graphHeight;
    const x = padding + index * barWidth;
    const y = padding + graphHeight - barHeight;

    // Create gradient for bars
    const gradient = ctx.createLinearGradient(0, y, 0, padding + graphHeight);
    gradient.addColorStop(0, `hsl(${hue}, 80%, 50%)`);
    gradient.addColorStop(1, `hsl(${hue}, 60%, 40%)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth - 0.5, barHeight);
  });

  // Draw axes
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + graphHeight);
  ctx.lineTo(width - padding, padding + graphHeight);
  ctx.stroke();

  // Draw axis labels
  ctx.fillStyle = '#999999';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';

  // X-axis labels (brightness levels)
  const xLabelCount = 5;
  for (let i = 0; i <= xLabelCount; i++) {
    const x = padding + (graphWidth / xLabelCount) * i;
    const label = Math.round((i / xLabelCount) * 255);
    ctx.fillText(label, x, height - 2);
  }

  // Y-axis label
  ctx.textAlign = 'right';
  ctx.fillText('%', padding - 5, padding + 5);

  // Calculate and update stats
  stats.value = getHistogramStats(props.data);
};

const onBlackPointChange = () => {
  // Prevent blackPoint from being >= whitePoint
  if (localBlackPoint.value >= localWhitePoint.value) {
    localBlackPoint.value = localWhitePoint.value - 1;
  }
  emit('levels-changed', {
    blackPoint: localBlackPoint.value,
    whitePoint: localWhitePoint.value,
  });
};

const onWhitePointChange = () => {
  // Prevent whitePoint from being <= blackPoint
  if (localWhitePoint.value <= localBlackPoint.value) {
    localWhitePoint.value = localBlackPoint.value + 1;
  }
  emit('levels-changed', {
    blackPoint: localBlackPoint.value,
    whitePoint: localWhitePoint.value,
  });
};

watch(
  () => props.data,
  () => {
    drawHistogram();
  },
  { deep: true }
);

watch(
  () => props.blackPoint,
  (newVal) => {
    localBlackPoint.value = newVal;
  }
);

watch(
  () => props.whitePoint,
  (newVal) => {
    localWhitePoint.value = newVal;
  }
);

onMounted(() => {
  drawHistogram();

  // Redraw on window resize
  window.addEventListener('resize', drawHistogram);
});
</script>

<style scoped>
.histogram-container {
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.histogram-canvas-wrapper {
  position: relative;
  background: linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%);
  border-radius: 4px;
  border: 1px solid #333333;
}

.histogram-canvas {
  display: block;
}

.histogram-stats {
  border-top: 1px solid #333333;
  padding-top: 8px;
}
</style>
