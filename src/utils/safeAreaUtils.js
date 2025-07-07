/**
 * Safe Area utilities for handling iOS curved screens and notches
 * This ensures proper layout on devices with safe area insets
 */

/**
 * Get the safe area inset values
 * @returns {Object} Object containing safe area inset values
 */
export function getSafeAreaInsets() {
  const root = document.documentElement;
  const style = getComputedStyle(root);

  return {
    top: style.getPropertyValue('--safe-area-inset-top') || '0px',
    right: style.getPropertyValue('--safe-area-inset-right') || '0px',
    bottom: style.getPropertyValue('--safe-area-inset-bottom') || '0px',
    left: style.getPropertyValue('--safe-area-inset-left') || '0px',
  };
}

/**
 * Check if the device supports safe area insets
 * @returns {boolean} True if safe area is supported
 */
export function supportsSafeArea() {
  return CSS.supports('padding-top: env(safe-area-inset-top)');
}

/**
 * Check if we're running on iOS
 * @returns {boolean} True if running on iOS
 */
export function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Check if we're running in a Capacitor app
 * @returns {boolean} True if running in Capacitor
 */
export function isCapacitorApp() {
  return window.Capacitor !== undefined;
}

/**
 * Get the recommended bottom padding for status bars
 * @returns {string} CSS value for bottom padding
 */
export function getStatusBarBottomPadding() {
  if (supportsSafeArea()) {
    return 'calc(env(safe-area-inset-bottom) + 0.5rem)';
  } else if (isIOS()) {
    return '0.75rem'; // Fallback for older iOS devices
  }
  return '0.5rem'; // Default padding for other platforms
}

/**
 * Apply safe area classes to an element
 * @param {HTMLElement} element - The element to apply safe area to
 * @param {Object} options - Configuration options
 */
export function applySafeArea(element, options = {}) {
  const { top = false, right = false, bottom = true, left = false } = options;

  if (!element) return;

  const styles = [];

  if (top) styles.push('padding-top: env(safe-area-inset-top)');
  if (right) styles.push('padding-right: env(safe-area-inset-right)');
  if (bottom) styles.push('padding-bottom: env(safe-area-inset-bottom)');
  if (left) styles.push('padding-left: env(safe-area-inset-left)');

  if (styles.length > 0) {
    const existingStyle = element.style.cssText;
    element.style.cssText = existingStyle + '; ' + styles.join('; ');
  }
}
