<template>
  <div class="status-icon" :title="label">
    <span
      class="dot"
      :class="{
        green: value === true,
        red: value === false,
        yellow: busy,
      }"
    />
    <span class="label">{{ label }}</span>
  </div>
</template>

<script>
export default {
  name: 'StatusIcon',
  props: {
    label: { type: String, required: true },
    value: { type: Boolean, default: null },
    busy: { type: Boolean, default: false },
  },
};
</script>

<style scoped>
.status-icon {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #666;
}

.dot.green {
  background: #3cb371;
}

.dot.red {
  background: #d9534f;
}

.dot.yellow {
  background: #f0ad4e;
  animation: pulse 1.2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.4;
  }
}
</style>
