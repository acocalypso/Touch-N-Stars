<template>
  <div class="image-loupe-preview" :style="wrapperStyle" aria-hidden="true">
    <img v-if="imageData" :src="imageData" :style="imageStyle" draggable="false" alt="" />
    <div class="image-loupe-crosshair">
      <span class="image-loupe-crosshair-h" />
      <span class="image-loupe-crosshair-v" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const SIZE = 160;
const FINGER_OFFSET = 56;
const EDGE_PADDING = 8;

const props = defineProps({
  imageData: { type: String, default: null },
  naturalX: { type: Number, default: 0 },
  naturalY: { type: Number, default: 0 },
  naturalWidth: { type: Number, default: 0 },
  naturalHeight: { type: Number, default: 0 },
  anchorX: { type: Number, default: 0 },
  anchorY: { type: Number, default: 0 },
  containerWidth: { type: Number, default: 0 },
  containerHeight: { type: Number, default: 0 },
  imageRotation: { type: Number, default: 0 },
  zoomFactor: { type: Number, default: 1 },
});

const wrapperStyle = computed(() => {
  const half = SIZE / 2;
  let left = props.anchorX - half;
  let top = props.anchorY - FINGER_OFFSET - SIZE;

  if (top < EDGE_PADDING) {
    top = props.anchorY + FINGER_OFFSET;
  }

  const maxLeft = Math.max(EDGE_PADDING, props.containerWidth - SIZE - EDGE_PADDING);
  const maxTop = Math.max(EDGE_PADDING, props.containerHeight - SIZE - EDGE_PADDING);
  left = Math.min(Math.max(left, EDGE_PADDING), maxLeft);
  top = Math.min(Math.max(top, EDGE_PADDING), maxTop);

  return {
    width: `${SIZE}px`,
    height: `${SIZE}px`,
    transform: `translate(${Math.round(left)}px, ${Math.round(top)}px)`,
  };
});

const imageStyle = computed(() => {
  const half = SIZE / 2;
  const factor = props.zoomFactor || 1;
  return {
    position: 'absolute',
    left: '0',
    top: '0',
    width: `${props.naturalWidth}px`,
    height: `${props.naturalHeight}px`,
    maxWidth: 'none',
    maxHeight: 'none',
    transformOrigin: '0 0',
    transform: `translate(${half}px, ${half}px) scale(${factor}) rotate(${props.imageRotation}deg) translate(${-props.naturalX}px, ${-props.naturalY}px)`,
    userSelect: 'none',
    pointerEvents: 'none',
  };
});
</script>

<style scoped>
.image-loupe-preview {
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  border-radius: 12px;
  background: #000;
  box-shadow:
    0 0 0 2px rgba(34, 211, 214, 0.85),
    0 8px 24px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  z-index: 25;
  will-change: transform;
}

.image-loupe-crosshair {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.image-loupe-crosshair-h,
.image-loupe-crosshair-v {
  position: absolute;
  background: rgba(34, 211, 214, 0.9);
}

.image-loupe-crosshair-h {
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  transform: translateY(-0.5px);
}

.image-loupe-crosshair-v {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  transform: translateX(-0.5px);
}
</style>
