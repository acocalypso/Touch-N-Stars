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

// Android's ImpactStyle.Light is a 50 ms buzz, which reads as mushy on a button
// press. A short one-shot at the device's default amplitude gives a crisp tick
// instead. Tune here - this is the only place the press duration is defined.
const ANDROID_TAP_MS = 20;

// Light tap when an action starts (nav taps, status chips, primary buttons).
// iOS keeps the impact generator: its .light taptic is already short, and
// Haptics.vibrate() maps to the long system alert buzz there, ignoring duration.
function tapLight() {
  if (Capacitor.getPlatform() === 'android') {
    return run(() => Haptics.vibrate({ duration: ANDROID_TAP_MS }));
  }
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
