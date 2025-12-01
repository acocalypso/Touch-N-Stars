<template>
  <div
    v-if="imageSrc"
    class="relative w-full overflow-hidden rounded-xl border border-gray-700 bg-gray-950/80"
    :style="containerStyle"
  >
    <img
      :src="imageSrc"
      alt="Bahtinov analysis frame"
      class="absolute inset-0 h-full w-full object-contain"
      :class="{ 'opacity-90': hasOverlay }"
      ref="imageElement"
      @load="handleImageLoad"
    />
    <svg
      v-if="hasOverlay"
      class="absolute inset-0 h-full w-full"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#f97316" />
        </marker>
      </defs>

      <g stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <line
          v-for="(line, index) in lineSegments"
          :key="`line-${index}`"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          :stroke="line.color"
          :stroke-dasharray="line.dashed ? '6 6' : null"
        />
      </g>

      <g v-if="errorLine" stroke="#f97316" stroke-width="2" stroke-dasharray="4 6">
        <line
          :x1="errorLine.x1"
          :y1="errorLine.y1"
          :x2="errorLine.x2"
          :y2="errorLine.y2"
          marker-end="url(#arrowhead)"
        />
      </g>

      <g v-if="cropRect" fill="none" stroke="#6366f1" stroke-width="1.4" stroke-dasharray="5 4">
        <rect :x="cropRect.x" :y="cropRect.y" :width="cropRect.width" :height="cropRect.height" />
      </g>

      <g v-if="intersectionMarker">
        <rect
          :x="intersectionMarker.x"
          :y="intersectionMarker.y"
          :width="intersectionMarker.width"
          :height="intersectionMarker.height"
          fill="none"
          stroke="#22c55e"
          stroke-width="1.6"
        />
      </g>

      <g v-if="errorMarker">
        <rect
          :x="errorMarker.x"
          :y="errorMarker.y"
          :width="errorMarker.width"
          :height="errorMarker.height"
          fill="none"
          stroke="#ef4444"
          stroke-width="1.6"
        />
      </g>

      <g v-if="hasRings" fill="none" stroke="#38bdf8" stroke-width="1.2">
        <circle
          v-for="(ring, index) in focusRings"
          :key="`ring-${index}`"
          :cx="ring.cx"
          :cy="ring.cy"
          :r="ring.r"
          :stroke-dasharray="ring.dashed ? '6 6' : null"
        />
      </g>
    </svg>

    <div
      v-if="overlay && overlay.referenceErrorScale"
      class="absolute bottom-2 right-2 rounded-md bg-gray-900/80 px-3 py-1 text-xs text-gray-200"
    >
      {{ scaleLabel }}
    </div>
  </div>
  <div
    v-else
    class="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-600"
  >
    <p class="px-6 text-center text-sm text-gray-400">{{ fallbackLabel }}</p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  imageSrc: {
    type: String,
    default: '',
  },
  overlay: {
    type: Object,
    default: null,
  },
  fallbackLabel: {
    type: String,
    default: 'Preview not available.',
  },
});

const imageElement = ref(null);
const naturalSize = ref({ width: 0, height: 0 });
const fallbackMinHeight = '16rem';

const processedWidth = computed(() => props.overlay?.processedWidth ?? null);
const processedHeight = computed(() => props.overlay?.processedHeight ?? null);

const hasOverlay = computed(() =>
  Boolean(props.overlay && processedWidth.value && processedHeight.value)
);

const containerStyle = computed(() => {
  if (processedWidth.value && processedHeight.value) {
    return {
      aspectRatio: `${processedWidth.value} / ${processedHeight.value}`,
    };
  }
  if (naturalSize.value.width && naturalSize.value.height) {
    return {
      aspectRatio: `${naturalSize.value.width} / ${naturalSize.value.height}`,
    };
  }
  return {
    minHeight: fallbackMinHeight,
  };
});

const viewBox = computed(() => {
  if (processedWidth.value && processedHeight.value) {
    return `0 0 ${processedWidth.value} ${processedHeight.value}`;
  }
  return '0 0 1 1';
});

const cropRect = computed(() => props.overlay?.processedCrop ?? null);
const intersectionMarker = computed(() => props.overlay?.intersectionMarker ?? null);
const errorMarker = computed(() => props.overlay?.errorMarker ?? null);
const errorLine = computed(() => props.overlay?.errorLine ?? null);

const focusRings = computed(() => {
  if (!Array.isArray(props.overlay?.criticalFocusRings)) return [];
  return props.overlay.criticalFocusRings
    .map((ring) => {
      if (ring == null) return null;
      const radius = Number(ring.radius ?? ring.r ?? ring.width ?? ring.height ?? null);
      const x = Number(ring.x ?? ring.cx ?? ring.centerX ?? ring.left ?? null);
      const y = Number(ring.y ?? ring.cy ?? ring.centerY ?? ring.top ?? null);
      if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
      }
      return {
        cx: x,
        cy: y,
        r: radius,
        dashed: Boolean(ring.dashed),
      };
    })
    .filter(Boolean);
});

const hasRings = computed(() => focusRings.value.length > 0);

const lineSegments = computed(() => {
  if (!props.overlay) return [];
  const entries = [props.overlay.lineLeft, props.overlay.lineMiddle, props.overlay.lineRight];

  return entries
    .map((line, index) => {
      if (!line) return null;
      const x1 = Number(line.x1 ?? line.startX ?? line.x ?? null);
      const y1 = Number(line.y1 ?? line.startY ?? line.y ?? null);
      const x2 = Number(line.x2 ?? line.endX ?? null);
      const y2 = Number(line.y2 ?? line.endY ?? null);
      if ([x1, y1, x2, y2].some((value) => !Number.isFinite(value))) {
        return null;
      }
      const palette = ['#38bdf8', '#22c55e', '#ef4444'];
      return {
        x1,
        y1,
        x2,
        y2,
        color: palette[index % palette.length],
        dashed: Boolean(line.dashed),
      };
    })
    .filter(Boolean);
});

const scaleLabel = computed(() => {
  if (!props.overlay?.referenceErrorScale) return '';
  return `Reference scale: ${props.overlay.referenceErrorScale.toFixed(2)} px`; // px to align with backend units
});

const handleImageLoad = () => {
  const element = imageElement.value;
  if (!element) {
    return;
  }
  const width = Number(element.naturalWidth);
  const height = Number(element.naturalHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return;
  }
  naturalSize.value = { width, height };
};

watch(
  () => props.imageSrc,
  () => {
    naturalSize.value = { width: 0, height: 0 };
  }
);
</script>
