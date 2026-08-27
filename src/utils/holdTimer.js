/**
 * Long-press ("hold to confirm") timer.
 *
 * Progress is derived from wall-clock timestamps, not from the number of ticks:
 * a throttled or dropped interval tick (routine on Android once the WebView is
 * busy) would otherwise stretch the hold far beyond the configured duration.
 *
 * Deliberately free of Vue and DOM dependencies, with injectable timer/clock
 * functions, so the timing rules are unit testable without mounting anything.
 */
export function createHoldTimer({
  durationMs,
  tickMs = 50,
  onProgress,
  onComplete,
  now = () => Date.now(),
  setIntervalFn = (fn, ms) => setInterval(fn, ms),
  clearIntervalFn = (id) => clearInterval(id),
} = {}) {
  if (!(durationMs > 0)) {
    throw new Error('createHoldTimer: durationMs must be a positive number');
  }

  let intervalId = null;
  let startedAt = 0;
  let disposed = false;

  function clear() {
    if (intervalId !== null) {
      clearIntervalFn(intervalId);
      intervalId = null;
    }
  }

  function finish() {
    clear();
    startedAt = 0;
    onProgress?.(1);
    onComplete?.();
  }

  function tick() {
    const elapsed = now() - startedAt;
    if (elapsed >= durationMs) {
      finish();
      return;
    }
    onProgress?.(elapsed / durationMs);
  }

  return {
    /** Begin a hold. Restarts from zero if one is already running. */
    start() {
      if (disposed) return;
      clear();
      startedAt = now();
      onProgress?.(0);
      intervalId = setIntervalFn(tick, tickMs);
    },

    /** Abort the current hold: progress resets to zero, onComplete never fires. */
    cancel() {
      if (intervalId === null) return;
      clear();
      startedAt = 0;
      onProgress?.(0);
    },

    isRunning() {
      return intervalId !== null;
    },

    /** Tear down for good - used on component unmount. */
    dispose() {
      disposed = true;
      clear();
      startedAt = 0;
    },
  };
}
