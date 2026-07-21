import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Haptic feedback for native platforms. Every call is a silent no-op on the web
// build, so callers can fire these unconditionally without platform checks.
const isNative = () => Capacitor.isNativePlatform();

// The Haptics plugin rejects when the device has no vibration motor or the user
// disabled system haptics. That must never surface as an error in the UI.
async function run(action) {
  if (!isNative()) return;
  try {
    await action();
  } catch {
    // Ignore: haptics are a non-essential enhancement.
  }
}

// Light tap when an action starts (nav taps, status chips, primary buttons).
function tapLight() {
  return run(() => Haptics.impact({ style: ImpactStyle.Light }));
}

// Stronger tap for destructive or state-changing actions (park, stop, abort).
function tapMedium() {
  return run(() => Haptics.impact({ style: ImpactStyle.Medium }));
}

function notifySuccess() {
  return run(() => Haptics.notification({ type: NotificationType.Success }));
}

function notifyWarning() {
  return run(() => Haptics.notification({ type: NotificationType.Warning }));
}

function notifyError() {
  return run(() => Haptics.notification({ type: NotificationType.Error }));
}

export function useHaptics() {
  return {
    tapLight,
    tapMedium,
    notifySuccess,
    notifyWarning,
    notifyError,
  };
}
