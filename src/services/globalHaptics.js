import { HAPTIC_SELECTOR, describeElement, pickHapticStyle } from '@/utils/hapticTargets';

// App-wide haptic feedback. One delegated listener replaces the per-button
// useHaptics() calls that used to be sprinkled through individual components,
// so every screen - including lazily registered plugins, which mount after the
// app is created - behaves the same without touching ~900 buttons.
//
// Capture phase, because some handlers call stopPropagation() and would
// otherwise swallow the event before it bubbles back up to the document.

/**
 * @param {EventTarget} target usually `document`
 * @param {{ tapLight: Function, tapMedium: Function }} haptics
 * @returns {Function} unsubscribe
 */
export function installGlobalHaptics(target, haptics) {
  const handler = (event) => {
    // Programmatic el.click() - hidden file inputs in the file picker and the
    // file browser use it - is not a press and must not vibrate.
    if (!event.isTrusted) return;

    const element = event.target?.closest?.(HAPTIC_SELECTOR);
    if (!element) return;

    const style = pickHapticStyle(describeElement(element));
    if (style === 'medium') haptics.tapMedium();
    else if (style === 'light') haptics.tapLight();
  };

  target.addEventListener('click', handler, true);
  return () => target.removeEventListener('click', handler, true);
}
