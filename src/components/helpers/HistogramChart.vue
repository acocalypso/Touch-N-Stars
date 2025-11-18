<template>
  <div v-if="data && data.length > 0" class="histogram-container p-4 bg-gray-900/20 rounded-lg">
    <div class="histogram-header mb-2 flex justify-between items-center">
      <h3 class="text-sm font-semibold text-gray-300">Brightness Histogram</h3>
      <div class="text-xs text-gray-400 space-x-3">
        <span
          >Black: <span class="text-gray-300 font-mono">{{ localBlackPoint }}</span></span
        >
        <span
          >White: <span class="text-gray-300 font-mono">{{ localWhitePoint }}</span></span
        >
      </div>
    </div>

    <!-- Histogram with integrated range sliders -->
    <div
      class="histogram-canvas-wrapper relative"
      :style="{ height: height, width: width }"
      ref="wrapperElement"
      @mousedown="onMouseDown"
      @touchstart="onTouchStart"
    >
      <canvas ref="canvasElement" class="histogram-canvas w-full h-full absolute inset-0"></canvas>

      <!-- Black Point Thumb (visual only) -->
      <div
        class="absolute top-0 h-full w-0.5 bg-transparent pointer-events-none"
        :style="{
          left: `${(localBlackPoint / 255) * 100}%`,
          zIndex: localBlackPoint > 127 ? 4 : 5,
        }"
      >
        <div
          class="absolute top-0 left-0 w-4 h-full bg-transparent flex items-center justify-center -translate-x-2"
        >
          <div class="w-1 h-full border-l-2 border-red-500"></div>
        </div>
      </div>

      <!-- White Point Thumb (visual only) -->
      <div
        class="absolute top-0 h-full w-0.5 bg-transparent pointer-events-none"
        :style="{
          left: `${(localWhitePoint / 255) * 100}%`,
          zIndex: localWhitePoint <= 127 ? 4 : 5,
        }"
      >
        <div
          class="absolute top-0 left-0 w-4 h-full bg-transparent flex items-center justify-center -translate-x-2"
        >
          <div class="w-1 h-full border-l-2 border-gray-200"></div>
        </div>
      </div>

      <!-- Interactive hit zones for dragging -->
      <div
        class="absolute top-0 h-full pointer-events-auto cursor-grab active:cursor-grabbing"
        :style="{
          left: `calc(${(localBlackPoint / 255) * 100}% - 12px)`,
          width: '24px',
          zIndex: 10,
        }"
        @mousedown="onBlackPointMouseDown"
        @touchstart="onBlackPointTouchStart"
      ></div>

      <div
        class="absolute top-0 h-full pointer-events-auto cursor-grab active:cursor-grabbing"
        :style="{
          left: `calc(${(localWhitePoint / 255) * 100}% - 12px)`,
          width: '24px',
          zIndex: 9,
        }"
        @mousedown="onWhitePointMouseDown"
        @touchstart="onWhitePointTouchStart"
      ></div>
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
import { ref, watch, onMounted, onUnmounted } from 'vue';
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
const wrapperElement = ref(null);
const stats = ref({ min: 0, max: 0, mean: 0, median: 0 });
const localBlackPoint = ref(props.blackPoint);
const localWhitePoint = ref(props.whitePoint);

// Dragging state
const isDraggingBlack = ref(false);
const isDraggingWhite = ref(false);

// Throttle updates to reduce performance impact
let lastEmitTime = 0;
const EMIT_THROTTLE_MS = 1000; // Emit max every 300ms

const throttledEmit = () => {
  const now = Date.now();
  if (now - lastEmitTime >= EMIT_THROTTLE_MS) {
    emitLevelsChanged();
    lastEmitTime = now;
  }
};

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

const emitLevelsChanged = () => {
  emit('levels-changed', {
    blackPoint: localBlackPoint.value,
    whitePoint: localWhitePoint.value,
  });
};

const calculateValueFromPosition = (clientX) => {
  if (!wrapperElement.value) return 0;

  const rect = wrapperElement.value.getBoundingClientRect();
  const relativeX = clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
  return Math.round(percentage * 255);
};

// Black point drag handlers
const onBlackPointMouseDown = (event) => {
  event.preventDefault();
  isDraggingBlack.value = true;

  const handleMouseMove = (moveEvent) => {
    const newValue = calculateValueFromPosition(moveEvent.clientX);
    localBlackPoint.value = Math.min(newValue, localWhitePoint.value - 1);
    throttledEmit();
  };

  const handleMouseUp = () => {
    isDraggingBlack.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    // Final emit after drag ends
    emitLevelsChanged();
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const onBlackPointTouchStart = (event) => {
  event.preventDefault();
  event.stopPropagation();

  // Ignore multi-touch
  if (event.touches.length > 1) return;

  isDraggingBlack.value = true;

  const handleTouchMove = (moveEvent) => {
    // Ignore multi-touch during drag
    if (moveEvent.touches.length > 1) return;

    moveEvent.preventDefault();
    const touch = moveEvent.touches[0];
    const newValue = calculateValueFromPosition(touch.clientX);
    localBlackPoint.value = Math.min(newValue, localWhitePoint.value - 1);
    throttledEmit();
  };

  const handleTouchEnd = () => {
    isDraggingBlack.value = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    // Final emit after drag ends
    emitLevelsChanged();
  };

  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);
};

// White point drag handlers
const onWhitePointMouseDown = (event) => {
  event.preventDefault();
  isDraggingWhite.value = true;

  const handleMouseMove = (moveEvent) => {
    const newValue = calculateValueFromPosition(moveEvent.clientX);
    localWhitePoint.value = Math.max(newValue, localBlackPoint.value + 1);
    throttledEmit();
  };

  const handleMouseUp = () => {
    isDraggingWhite.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    // Final emit after drag ends
    emitLevelsChanged();
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const onWhitePointTouchStart = (event) => {
  event.preventDefault();
  event.stopPropagation();

  // Ignore multi-touch
  if (event.touches.length > 1) return;

  isDraggingWhite.value = true;

  const handleTouchMove = (moveEvent) => {
    // Ignore multi-touch during drag
    if (moveEvent.touches.length > 1) return;

    moveEvent.preventDefault();
    const touch = moveEvent.touches[0];
    const newValue = calculateValueFromPosition(touch.clientX);
    localWhitePoint.value = Math.max(newValue, localBlackPoint.value + 1);
    throttledEmit();
  };

  const handleTouchEnd = () => {
    isDraggingWhite.value = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    // Final emit after drag ends
    emitLevelsChanged();
  };

  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);
};

// Dummy handlers to prevent event propagation
const onMouseDown = () => {};
const onTouchStart = () => {};

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
