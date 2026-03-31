<template>
  <div class="image-crosshair-overlay" :style="overlayStyle" aria-hidden="true">
    <svg class="image-crosshair-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
      <path :d="NINA_CROSSHAIR_PATH" class="image-crosshair-path" />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const NINA_CROSSHAIR_PATH = `
  M500,0 L500,400
  M500,600 L500,1000
  M0,500 L400,500
  M600,500 L1000,500
  M350,500 A150,150 1 1 1 350,500.01
  M400,500 A100,100 1 1 1 400,500.01
  M450,500 A50,50 1 1 1 450,500.01
  M480,500 A20,20 1 1 1 480,500.01
  M490,500 A10,10 1 1 1 490,500.01
  M495,500 A5,5 1 1 1 495,500.01
`;

const props = defineProps({
  bounds: {
    type: Object,
    default: null,
  },
});

const overlayStyle = computed(() => {
  if (!props.bounds) return {};

  return {
    left: `${Math.round(props.bounds.left)}px`,
    top: `${Math.round(props.bounds.top)}px`,
    width: `${Math.round(props.bounds.width)}px`,
    height: `${Math.round(props.bounds.height)}px`,
  };
});
</script>

<style scoped>
.image-crosshair-overlay {
  --crosshair-color: rgba(34, 211, 214, 0.88);
  position: absolute;
  display: block;
  overflow: visible;
  pointer-events: none;
  z-index: 20;
  isolation: isolate;
  transform: translateZ(0);
}

.image-crosshair-svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.image-crosshair-path {
  fill: none;
  stroke: var(--crosshair-color);
  stroke-width: 1;
  stroke-linecap: square;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  shape-rendering: geometricPrecision;
}
</style>
