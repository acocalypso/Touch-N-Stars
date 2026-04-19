import { onBeforeUnmount, ref } from 'vue';
import { clientPointToNaturalPoint } from '@/utils/imageGeometry';

const LOUPE_STORAGE_KEY = 'tns:image-loupe-active';

function getStoredLoupeActive() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(LOUPE_STORAGE_KEY) === 'true';
}

function setStoredLoupeActive(active) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOUPE_STORAGE_KEY, String(active));
}

export function useImageLoupe({ containerRef, imageRef, imageRotationRef }) {
  const isLoupeActive = ref(getStoredLoupeActive());
  const loupePreview = ref(null);

  let attachedElement = null;
  let activePointerId = null;

  const updateFromPointer = (event) => {
    if (!containerRef.value || !imageRef.value) return;

    const point = clientPointToNaturalPoint({
      clientX: event.clientX,
      clientY: event.clientY,
      imageElement: imageRef.value,
      containerElement: containerRef.value,
      imageRotation: imageRotationRef.value,
    });

    if (!point) {
      loupePreview.value = null;
      return;
    }

    loupePreview.value = {
      clientX: event.clientX,
      clientY: event.clientY,
      naturalX: point.naturalX,
      naturalY: point.naturalY,
      naturalWidth: point.naturalWidth,
      naturalHeight: point.naturalHeight,
    };
  };

  const handlePointerDown = (event) => {
    if (!isLoupeActive.value) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    activePointerId = event.pointerId;
    event.preventDefault();
    event.stopPropagation();

    if (event.target && typeof event.target.setPointerCapture === 'function') {
      try {
        event.target.setPointerCapture(event.pointerId);
      } catch {
        // ignore capture failures (e.g., not supported in some contexts)
      }
    }

    updateFromPointer(event);
  };

  const handlePointerMove = (event) => {
    if (!isLoupeActive.value) return;
    if (activePointerId !== null && event.pointerId !== activePointerId) return;
    if (activePointerId === null) return;

    event.preventDefault();
    updateFromPointer(event);
  };

  const endPointer = (event) => {
    if (activePointerId !== null && event.pointerId !== activePointerId) return;

    if (event.target && typeof event.target.releasePointerCapture === 'function') {
      try {
        event.target.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }

    activePointerId = null;
    loupePreview.value = null;
  };

  const attachLoupePointerHandlers = (element) => {
    if (!element || attachedElement === element) return;
    detachLoupePointerHandlers();

    element.addEventListener('pointerdown', handlePointerDown, { passive: false });
    element.addEventListener('pointermove', handlePointerMove, { passive: false });
    element.addEventListener('pointerup', endPointer);
    element.addEventListener('pointercancel', endPointer);
    element.addEventListener('pointerleave', endPointer);
    attachedElement = element;
  };

  const detachLoupePointerHandlers = () => {
    if (!attachedElement) return;

    attachedElement.removeEventListener('pointerdown', handlePointerDown);
    attachedElement.removeEventListener('pointermove', handlePointerMove);
    attachedElement.removeEventListener('pointerup', endPointer);
    attachedElement.removeEventListener('pointercancel', endPointer);
    attachedElement.removeEventListener('pointerleave', endPointer);
    attachedElement = null;
    activePointerId = null;
    loupePreview.value = null;
  };

  const setLoupeActive = (active) => {
    isLoupeActive.value = active;
    setStoredLoupeActive(active);
    if (!active) {
      loupePreview.value = null;
      activePointerId = null;
    }
  };

  const toggleLoupe = () => {
    setLoupeActive(!isLoupeActive.value);
  };

  onBeforeUnmount(() => {
    detachLoupePointerHandlers();
  });

  return {
    isLoupeActive,
    loupePreview,
    toggleLoupe,
    setLoupeActive,
    attachLoupePointerHandlers,
    detachLoupePointerHandlers,
  };
}
