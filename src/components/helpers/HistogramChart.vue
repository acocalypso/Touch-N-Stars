<template>
  <div v-if="data && data.length > 0" class="relative p-4 bg-gray-900/20 rounded-lg shadow-md">
    <button
      v-if="showReset"
      type="button"
      class="absolute right-5 top-5 z-20 text-xs px-2 py-1 rounded bg-gray-800 text-gray-100 hover:bg-gray-700 border border-gray-700 shadow"
      @click="emitReset"
    >
      Reset
    </button>
    <!-- Histogram with integrated range sliders -->
    <div
      class="relative bg-gradient-to-b from-gray-950 to-gray-900 rounded border border-gray-700 opacity-80"
      :style="{ height: height, width: width }"
      ref="wrapperElement"
      @mousedown="onMouseDown"
      @touchstart="onTouchStart"
    >
      <canvas ref="canvasElement" class="block w-full h-full absolute inset-0"></canvas>

      <!-- Black Point Thumb (visual only) -->
      <div
        class="absolute top-0 h-full w-0.5 bg-transparent pointer-events-none"
        :style="{
          left: `${(localBlackPoint / 255) * 100}%`,
          zIndex: localBlackPoint > 127 ? 4 : 5,
        }"
      >
        <div
          class="absolute top-0 left-0 w-4 h-full bg-transparent flex flex-col items-center justify-between -translate-x-2 py-1"
        >
          <div class="w-1 flex-1 border-l-2 border-red-500"></div>
          <span class="text-red-400 text-[9px] font-bold leading-none mt-0.5 select-none">S</span>
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
          class="absolute top-0 left-0 w-4 h-full bg-transparent flex flex-col items-center justify-between -translate-x-2 py-1"
        >
          <div class="w-1 flex-1 border-l-2 border-gray-200"></div>
          <span class="text-gray-200 text-[9px] font-bold leading-none mt-0.5 select-none">W</span>
        </div>
      </div>

      <!-- Mid Point Thumb (nur sichtbar wenn Gamma aktiv) -->
      <div
        v-if="showGamma"
        class="absolute top-0 h-full w-0.5 bg-transparent pointer-events-none"
        :style="{ left: `${(localMidPoint / 255) * 100}%`, zIndex: 6 }"
      >
        <div
          class="absolute top-0 left-0 w-4 h-full bg-transparent flex flex-col items-center justify-between -translate-x-2 py-1"
        >
          <div class="w-1 flex-1 border-l-2 border-green-400"></div>
          <span class="text-green-400 text-[9px] font-bold leading-none mt-0.5 select-none">G</span>
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

      <div
        v-if="showGamma"
        class="absolute top-0 h-full pointer-events-auto cursor-grab active:cursor-grabbing"
        :style="{
          left: `calc(${(localMidPoint / 255) * 100}% - 12px)`,
          width: '24px',
          zIndex: 8,
        }"
        @mousedown="onMidPointMouseDown"
        @touchstart="onMidPointTouchStart"
      ></div>
    </div>

    <!-- Slider legend + Gamma toggle -->
    <div class="mt-1 flex items-center gap-4 text-[10px] font-mono text-gray-400 select-none">
      <span>
        <span class="text-red-400 font-bold">S</span>
        {{ t('components.helpers.histogram.blackPoint') }}</span
      >
      <span>
        <span class="text-gray-200 font-bold">W</span>
        {{ t('components.helpers.histogram.whitePoint') }}</span
      >
      <button
        type="button"
        class="ml-auto text-[10px] px-2 py-0.5 rounded border transition-colors"
        :class="
          showGamma
            ? 'border-green-500 text-green-400 bg-green-900/20'
            : 'border-gray-600 text-gray-500 bg-transparent hover:border-gray-400'
        "
        @click="showGamma = !showGamma"
      >
        G {{ t('components.helpers.histogram.gamma') }}
      </button>
    </div>

    <!-- No-save hint -->
    <div v-if="!saveEnabled" class="mt-2 flex items-center justify-between gap-2">
      <span class="text-xs text-gray-500 italic">
        {{ t('components.helpers.histogram.noSaveHint') }}
      </span>
      <button
        type="button"
        class="shrink-0 text-xs px-2 py-0.5 rounded border border-gray-600 text-gray-400 bg-transparent hover:border-gray-400 transition-colors"
        @click="emit('toggle-save')"
      >
        {{ t('components.helpers.histogram.enableSave') }}
      </button>
    </div>

    <!-- Real statistics from NINA API -->
    <div
      v-if="statistics && saveEnabled"
      class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs font-mono"
    >
      <div class="flex gap-2">
        <span class="text-gray-500">{{ t('components.helpers.histogram.mean') }}</span>
        <span class="text-yellow-400">{{ Math.round(statistics.Mean) }}</span>
        <span class="text-gray-500 ml-1">{{ t('components.helpers.histogram.median') }}</span>
        <span class="text-cyan-400">{{ Math.round(statistics.Median) }}</span>
      </div>
      <div class="flex gap-2">
        <span class="text-gray-500">{{ t('components.helpers.histogram.stdDev') }}</span>
        <span class="text-gray-300">{{ Math.round(statistics.StDev) }}</span>
        <span v-if="statistics.Stars" class="text-gray-500 ml-1">{{
          t('components.helpers.histogram.stars')
        }}</span>
        <span v-if="statistics.Stars" class="text-gray-300">{{ statistics.Stars }}</span>
        <span v-if="statistics.HFR" class="text-gray-500 ml-1">{{
          t('components.helpers.histogram.hfr')
        }}</span>
        <span v-if="statistics.HFR" class="text-gray-300">{{ statistics.HFR.toFixed(2) }}</span>
      </div>
      <div class="flex gap-2">
        <span class="text-gray-500">{{ t('components.helpers.histogram.min') }}</span>
        <span class="text-gray-300">{{ Math.round(statistics.Min) }}</span>
      </div>
      <div class="flex gap-2">
        <span class="text-gray-500">{{ t('components.helpers.histogram.max') }}</span>
        <span class="text-gray-300">{{ Math.round(statistics.Max) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getHistogramStats } from '@/utils/histogramUtils';

const { t } = useI18n();

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
  midPoint: {
    type: Number,
    default: 127,
  },
  showReset: {
    type: Boolean,
    default: true,
  },
  statistics: {
    type: Object,
    default: null,
    // Expected: { Mean, Median, Min, Max, StDev, MedianAbsoluteDeviation, Stars, HFR }
  },
  stretchParams: {
    type: Object,
    default: null,
    // Expected: { blackClipping: Number, autoStretchFactor: Number }
    // NINA profile: ImageSettings.BlackClipping + ImageSettings.AutoStretchFactor
  },
  saveEnabled: {
    type: Boolean,
    default: true,
  },
  useJpegHistogram: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['levels-changed', 'levels-reset', 'toggle-save']);

const canvasElement = ref(null);
const wrapperElement = ref(null);
const stats = ref({ min: 0, max: 0, mean: 0, median: 0 });
const localBlackPoint = ref(props.blackPoint);
const localWhitePoint = ref(props.whitePoint);
const localMidPoint = ref(props.midPoint);

// Gamma toggle
const showGamma = ref(false);

// Dragging state
const isDraggingBlack = ref(false);
const isDraggingWhite = ref(false);

// Throttle updates to reduce performance impact
let lastEmitTime = 0;
const EMIT_THROTTLE_MS = 300;
const throttledEmit = () => {
  const now = Date.now();
  if (now - lastEmitTime >= EMIT_THROTTLE_MS) {
    emitLevelsChanged();
    lastEmitTime = now;
  }
};

/**
 * Approximate histogram from API statistics using a Gaussian distribution.
 * Bins span Min…Max in 16-bit ADU space.
 */
const generateSyntheticHistogram = (mean, stdDev, min, max, bins = 256) => {
  const histogram = new Array(bins).fill(0);
  if (stdDev <= 0 || min >= max) return histogram;
  for (let i = 0; i < bins; i++) {
    const val = min + (i / (bins - 1)) * (max - min);
    histogram[i] = Math.exp(-0.5 * ((val - mean) / stdDev) ** 2);
  }
  return histogram;
};

/**
 * Invert NINA's auto-stretch MTF for a JPEG bucket index → 16-bit ADU value.
 *
 * NINA stretch:
 *   shadowsClip = (Median + BlackClipping * MAD) / 65535
 *   MTF midtone m is chosen so that MTF(Median/65535 - shadowsClip, m) = AutoStretchFactor
 *   Each pixel p_norm → MTF(max(0, p_norm - shadowsClip), m) → JPEG value
 *
 * Inverse: JPEG j → ADU via InvMTF + un-shift
 */
const ninaJpegBucketToAdu = (jpegBucket, median, mad, blackClipping, autoStretchFactor) => {
  const shadowsClip = Math.max(0, (median + blackClipping * mad) / 65535);
  const x_bg = median / 65535 - shadowsClip;

  // Solve MTF(x_bg, m) = autoStretchFactor for m
  // MTF(x, m) = (m-1)*x / ((2m-1)*x - m)
  // => m = x*(t-1) / (x*(2t-1) - t)  where t = autoStretchFactor
  const t = autoStretchFactor;
  const m = (x_bg * (t - 1)) / (x_bg * (2 * t - 1) - t);

  // Inverse MTF: InvMTF(y, m) = m*y / ((2m-1)*y - (m-1))
  const j_norm = jpegBucket / 255;
  if (j_norm <= 0) return shadowsClip * 65535;
  const denom = (2 * m - 1) * j_norm - (m - 1);
  if (Math.abs(denom) < 1e-9) return shadowsClip * 65535;
  const v_shifted = (m * j_norm) / denom;

  return Math.max(0, (v_shifted + shadowsClip) * 65535);
};

const drawHistogram = () => {
  if (!canvasElement.value) return;

  const s = props.statistics;
  const sp = props.stretchParams;
  const hasStats = !!(s?.Mean != null);

  // Decide rendering mode:
  // "stretch" = JPEG shape + inverse-stretch X mapping (best accuracy)
  // "synth"   = Gaussian from API stats (no stretch params available)
  // "jpeg"    = raw JPEG histogram with 0-255 axis (fallback)
  // MAD may be missing from image-history; approximate from StDev (Gaussian: MAD ≈ 0.6745 * σ)
  const mad = s?.MedianAbsoluteDeviation ?? (s?.StDev != null ? s.StDev * 0.6745 : null);

  const canInvertStretch =
    hasStats &&
    mad != null &&
    sp?.blackClipping != null &&
    sp?.autoStretchFactor != null &&
    props.data?.length > 0;
  const mode = props.useJpegHistogram
    ? 'jpeg'
    : canInvertStretch
      ? 'stretch'
      : hasStats
        ? 'synth'
        : 'jpeg';

  const histData =
    mode === 'synth' ? generateSyntheticHistogram(s.Mean, s.StDev, s.Min, s.Max) : props.data;

  if (!histData || histData.length === 0) return;

  const canvas = canvasElement.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

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
  const maxValue = Math.max(...histData);

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
  const hue = 200;

  if (mode === 'stretch') {
    // Map each JPEG bucket to its true ADU position via inverse NINA stretch
    histData.forEach((value, index) => {
      const adu = ninaJpegBucketToAdu(index, s.Median, mad, sp.blackClipping, sp.autoStretchFactor);
      const barHeight = (value / maxValue) * graphHeight;
      const xPos = padding + ((adu - s.Min) / (s.Max - s.Min)) * graphWidth;
      const y = padding + graphHeight - barHeight;
      const gradient = ctx.createLinearGradient(0, y, 0, padding + graphHeight);
      gradient.addColorStop(0, `hsl(${hue}, 80%, 50%)`);
      gradient.addColorStop(1, `hsl(${hue}, 60%, 40%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(xPos, y, 1.5, barHeight);
    });
  } else {
    const barWidth = graphWidth / histData.length;
    histData.forEach((value, index) => {
      const barHeight = (value / maxValue) * graphHeight;
      const xPos = padding + index * barWidth;
      const y = padding + graphHeight - barHeight;
      const gradient = ctx.createLinearGradient(0, y, 0, padding + graphHeight);
      gradient.addColorStop(0, `hsl(${hue}, 80%, 50%)`);
      gradient.addColorStop(1, `hsl(${hue}, 60%, 40%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(xPos, y, barWidth - 0.5, barHeight);
    });
  }

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

  const xLabelCount = 5;
  if (hasStats) {
    // X-axis spans Min…Max in 16-bit ADU
    const range = s.Max - s.Min;
    for (let i = 0; i <= xLabelCount; i++) {
      const xPos = padding + (graphWidth / xLabelCount) * i;
      const label = Math.round(s.Min + (i / xLabelCount) * range);
      ctx.fillText(label, xPos, height - 2);
    }
  } else {
    // X-axis 0–255 for JPEG-based histogram
    for (let i = 0; i <= xLabelCount; i++) {
      const xPos = padding + (graphWidth / xLabelCount) * i;
      ctx.fillText(Math.round((i / xLabelCount) * 255), xPos, height - 2);
    }
  }

  // Y-axis label
  ctx.textAlign = 'right';
  ctx.fillText('%', padding - 5, padding + 5);

  // Draw marker lines aligned with the ADU axis
  if (hasStats) {
    const range = s.Max - s.Min;
    const toX = (val) => padding + ((val - s.Min) / range) * graphWidth;

    // Min / Max lines (dashed gray)
    for (const val of [s.Min, s.Max]) {
      if (val != null) {
        ctx.save();
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(toX(val), padding);
        ctx.lineTo(toX(val), padding + graphHeight);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Median line (cyan)
    if (s.Median != null) {
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(toX(s.Median), padding);
      ctx.lineTo(toX(s.Median), padding + graphHeight);
      ctx.stroke();
      ctx.restore();
    }

    // Mean line (yellow)
    if (s.Mean != null) {
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(toX(s.Mean), padding);
      ctx.lineTo(toX(s.Mean), padding + graphHeight);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Calculate local stats only for JPEG-based histogram (no API stats)
  if (!hasStats) {
    stats.value = getHistogramStats(histData);
  }
};

const emitLevelsChanged = () => {
  emit('levels-changed', {
    blackPoint: localBlackPoint.value,
    midPoint: localMidPoint.value,
    whitePoint: localWhitePoint.value,
  });
};

const emitReset = () => {
  localBlackPoint.value = 0;
  localWhitePoint.value = 255;
  localMidPoint.value = 127;
  emit('levels-reset');
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

// Mid point drag handlers
const onMidPointMouseDown = (event) => {
  event.preventDefault();

  const handleMouseMove = (moveEvent) => {
    const newValue = calculateValueFromPosition(moveEvent.clientX);
    localMidPoint.value = Math.min(
      Math.max(newValue, localBlackPoint.value + 1),
      localWhitePoint.value - 1
    );
    throttledEmit();
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    emitLevelsChanged();
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const onMidPointTouchStart = (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (event.touches.length > 1) return;

  const handleTouchMove = (moveEvent) => {
    if (moveEvent.touches.length > 1) return;
    moveEvent.preventDefault();
    const touch = moveEvent.touches[0];
    const newValue = calculateValueFromPosition(touch.clientX);
    localMidPoint.value = Math.min(
      Math.max(newValue, localBlackPoint.value + 1),
      localWhitePoint.value - 1
    );
    throttledEmit();
  };

  const handleTouchEnd = () => {
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
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
    localMidPoint.value = Math.max(localMidPoint.value, newVal + 1);
  }
);

watch(
  () => props.whitePoint,
  (newVal) => {
    localWhitePoint.value = newVal;
    localMidPoint.value = Math.min(localMidPoint.value, newVal - 1);
  }
);

watch(
  () => props.midPoint,
  (newVal) => {
    localMidPoint.value = newVal;
  }
);

watch(
  () => props.statistics,
  () => {
    drawHistogram();
  },
  { deep: true }
);

onMounted(() => {
  drawHistogram();

  // Redraw on window resize
  window.addEventListener('resize', drawHistogram);
});
</script>
