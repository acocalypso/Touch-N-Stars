import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useSettingsStore } from '@/store/settingsStore';

// Haptic feedback for native platforms. Every call is a silent no-op on the web
// build, so callers can fire these unconditionally without platform checks.
const isNative = () => Capacitor.isNativePlatform();

// The Haptics plugin rejects when the device has no vibration motor or the user
// disabled system haptics. That must never surface as an error in the UI.
// The settings store is read lazily inside the call: Pinia is only created in
// main.js, while consumers import this module long before that.
async function run(action) {
  if (!isNative()) return;
  try {
    if (useSettingsStore().hapticsEnabled === false) return;
    await action();
  } catch {
    // Ignore: haptics are a non-essential enhancement.
  }
}

// Light tap when an action starts (nav taps, status chips, primary buttons).
// This is the softest tap the plugin offers: on Android it is a 50 ms waveform at
// amplitude 110/255, whereas Haptics.vibrate() would run at full amplitude.
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
