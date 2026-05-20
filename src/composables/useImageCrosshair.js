import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { calculateContainedImageBounds } from '@/utils/imageGeometry';

const CROSSHAIR_STORAGE_KEY = 'tns:image-crosshair-visible';

function getStoredCrosshairVisibility() {
  if (typeof window === 'undefined') return false;

  return window.localStorage.getItem(CROSSHAIR_STORAGE_KEY) === 'true';
}

function setStoredCrosshairVisibility(visible) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(CROSSHAIR_STORAGE_KEY, String(visible));
}

export function useImageCrosshair({ containerRef, imageRef, imageRotationRef, imageDataRef }) {
  const isCrosshairVisible = ref(getStoredCrosshairVisibility());
  const crosshairBounds = ref(null);

  let crosshairFrame = null;
  let resizeObserver = null;
  let observedContainer = null;
  let observedImage = null;

  const clearCrosshairBounds = () => {
    crosshairBounds.value = null;
  };

  const updateCrosshairBounds = () => {
    crosshairBounds.value = calculateContainedImageBounds(
      imageRef.value,
      containerRef.value,
      imageRotationRef.value
    );
  };

  const scheduleCrosshairUpdate = () => {
    if (typeof window === 'undefined') return;

    if (crosshairFrame !== null) {
      window.cancelAnimationFrame(crosshairFrame);
    }

    crosshairFrame = window.requestAnimationFrame(() => {
      crosshairFrame = null;
      updateCrosshairBounds();
    });
  };

  const syncObservedElements = () => {
    if (!resizeObserver) return;

    if (observedContainer && observedContainer !== containerRef.value) {
      resizeObserver.unobserve(observedContainer);
      observedContainer = null;
    }

    if (observedImage && observedImage !== imageRef.value) {
      resizeObserver.unobserve(observedImage);
      observedImage = null;
    }

    if (containerRef.value && observedContainer !== containerRef.value) {
      resizeObserver.observe(containerRef.value);
      observedContainer = containerRef.value;
    }

    if (imageRef.value && observedImage !== imageRef.value) {
      resizeObserver.observe(imageRef.value);
      observedImage = imageRef.value;
    }
  };

  const setCrosshairVisibility = (visible) => {
    isCrosshairVisible.value = visible;
    setStoredCrosshairVisibility(visible);

    if (visible) {
      nextTick(() => {
        scheduleCrosshairUpdate();
      });
    }
  };

  const toggleCrosshair = () => {
    setCrosshairVisibility(!isCrosshairVisible.value);
  };

  watch([containerRef, imageRef], () => {
    syncObservedElements();
  });

  watch(imageRotationRef, () => {
    if (isCrosshairVisible.value) {
      nextTick(() => {
        scheduleCrosshairUpdate();
      });
    }
  });

  watch(imageDataRef, (newValue, oldValue) => {
    if (!newValue && oldValue) {
      clearCrosshairBounds();
    }
  });

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', scheduleCrosshairUpdate);
    }

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (isCrosshairVisible.value) {
          scheduleCrosshairUpdate();
        }
      });

      syncObservedElements();
    }
  });

  onBeforeUnmount(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (crosshairFrame !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(crosshairFrame);
      crosshairFrame = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', scheduleCrosshairUpdate);
    }
  });

  return {
    isCrosshairVisible,
    crosshairBounds,
    clearCrosshairBounds,
    scheduleCrosshairUpdate,
    toggleCrosshair,
  };
}
