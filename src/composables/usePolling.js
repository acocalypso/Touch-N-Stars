import { onMounted, onBeforeUnmount } from 'vue';
import { createPoller } from '@/utils/poller';

/**
 * Component-lifecycle wrapper around createPoller: starts polling on mount and
 * always stops on unmount, so callers cannot leak intervals. Ticks are guarded
 * against overlap by createPoller (a slow fetch never stacks with the next tick).
 *
 * @param {() => Promise<void>|void} fetchFn - function to invoke on every tick
 * @param {number} intervalMs - polling interval in milliseconds
 * @param {{ immediate?: boolean, autoStart?: boolean }} [options]
 *   immediate: run fetchFn once right away when starting (default true)
 *   autoStart: start polling on mount (default true); pass false to control
 *              start/stop manually via the returned poller
 * @returns {{ start: () => void, stop: () => void, isRunning: () => boolean }}
 */
export function usePolling(fetchFn, intervalMs, options = {}) {
  const { immediate = true, autoStart = true } = options;
  const poller = createPoller(fetchFn, intervalMs, { immediate });

  onMounted(() => {
    if (autoStart) poller.start();
  });
  onBeforeUnmount(() => poller.stop());

  return poller;
}
