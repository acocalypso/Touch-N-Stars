/**
 * Full page reload when the active NINA instance changes.
 *
 * Switching instances used to run a hand-maintained teardown
 * (apiStore.switchBackend -> clearAllStates) that had to enumerate every
 * instance-scoped store. With ~26 core stores plus 17 plugin stores that list
 * was permanently incomplete, so the previous instance's data leaked into the
 * new one and the sockets did not always re-establish. A reload rebuilds
 * everything through the cold-start path (main.js -> App.vue onMounted ->
 * fetchAllInfos), which is the only connection path exercised on every launch.
 *
 * The overlay is plain DOM on purpose: it must survive the re-render that the
 * endpoint mutation triggers, it must not depend on the route (App.vue's splash
 * is gated off on /settings and /setup), and the Vue app is about to be
 * destroyed anyway. Inline styles instead of Tailwind classes so it cannot be
 * dropped by the Tailwind content globs.
 */
import i18n from '@/i18n';

const OVERLAY_ID = 'tns-instance-switch-overlay';
// requestAnimationFrame is throttled to zero in a backgrounded WebView; without
// this net a switch followed by an immediate background would never reload.
const RELOAD_FALLBACK_MS = 400;

let alreadyScheduled = false;

function mountOverlay(message) {
  if (typeof document === 'undefined' || !document.body) return;
  if (document.getElementById(OVERLAY_ID)) return;

  const style = document.createElement('style');
  style.textContent = '@keyframes tns-switch-spin{to{transform:rotate(360deg)}}';

  const root = document.createElement('div');
  root.id = OVERLAY_ID;
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  root.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;' +
    // Same ground as index.html and --color-ground, so the overlay, the blank
    // frame during the reload and the fresh app are one uninterrupted surface.
    'align-items:center;justify-content:center;gap:1rem;background:#0a0f1c;color:#e2e8f0;' +
    'font:500 1rem/1.4 system-ui,-apple-system,sans-serif;padding:1rem;text-align:center';

  const spinner = document.createElement('div');
  spinner.style.cssText =
    'width:2rem;height:2rem;border:4px solid #22d3ee;border-top-color:transparent;' +
    'border-radius:9999px;animation:tns-switch-spin 1s linear infinite';

  const label = document.createElement('p');
  label.style.cssText = 'margin:0;max-width:22rem';
  label.textContent = message;

  root.append(style, spinner, label);
  // Appended to body, not #app: nothing Vue does can unmount it.
  document.body.appendChild(root);
}

export function reloadForInstanceSwitch(instanceName) {
  if (alreadyScheduled) return;
  alreadyScheduled = true;

  try {
    mountOverlay(
      i18n.global.t('components.instanceSwitcher.switchingTo', { name: instanceName || '' })
    );
  } catch (error) {
    // The overlay is cosmetic and must never be able to block the reload.
    console.warn('[InstanceSwitch] Failed to show switching overlay:', error);
  }

  let fired = false;
  const go = () => {
    if (fired) return;
    fired = true;
    window.location.reload();
  };

  const fallback = setTimeout(go, RELOAD_FALLBACK_MS);

  if (typeof requestAnimationFrame !== 'function') return;

  // rAF #1 runs before the frame that paints the overlay, rAF #2 after it has
  // been committed. The old document stays on screen until the new one paints,
  // so the overlay covers the whole reload instead of a frozen page.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      clearTimeout(fallback);
      go();
    })
  );
}
