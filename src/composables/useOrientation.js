import { ref, computed, onMounted, onUnmounted } from 'vue';

const orientation = ref({
  width: window.innerWidth,
  height: window.innerHeight,
});

const isLandscape = computed(() => orientation.value.width > orientation.value.height);

let listeners = [];

const updateOrientation = () => {
  const newOrientation = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  if (
    newOrientation.width !== orientation.value.width ||
    newOrientation.height !== orientation.value.height
  ) {
    orientation.value = newOrientation;
  }
};

const addResizeListener = () => {
  window.addEventListener('resize', updateOrientation);
  window.addEventListener('orientationchange', updateOrientation);
};

const removeResizeListener = () => {
  window.removeEventListener('resize', updateOrientation);
  window.removeEventListener('orientationchange', updateOrientation);
};

export function useOrientation() {
  onMounted(() => {
    if (listeners.length === 0) {
      addResizeListener();
    }
    listeners.push(true);
    updateOrientation();
  });

  onUnmounted(() => {
    listeners.pop();
    if (listeners.length === 0) {
      removeResizeListener();
    }
  });

  return {
    isLandscape,
    orientation: computed(() => orientation.value),
  };
}
