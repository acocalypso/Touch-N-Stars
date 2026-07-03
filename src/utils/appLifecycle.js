/**
 * App-wide background/foreground flag, set by App.vue's pauseApp()/resumeApp().
 *
 * Components/stores that own their own setInterval-based polling (rather than
 * being started/stopped explicitly by App.vue) can use useBackgroundAwarePolling()
 * below to automatically pause while the app is backgrounded, instead of every
 * new poller needing to be wired into App.vue's pause/resume lists by hand.
 */
import { ref, watch, onUnmounted } from 'vue';
import { createPoller } from '@/utils/poller';

export const isAppBackgrounded = ref(false);

export function setAppBackgrounded(value) {
  isAppBackgrounded.value = value;
}

/**
 * Creates a poller that starts/stops with `activeRef` (e.g. a `show` prop or
 * `v-if` condition) and additionally pauses/resumes with app background state,
 * without the caller having to hook into App.vue directly.
 * @param {() => Promise<void>|void} fetchFn
 * @param {number} intervalMs
 * @param {import('vue').Ref<boolean>} activeRef - poll only while this is true
 * @param {{ immediate?: boolean }} [options]
 */
export function useBackgroundAwarePolling(fetchFn, intervalMs, activeRef, options = {}) {
  const poller = createPoller(fetchFn, intervalMs, options);

  const sync = () => {
    if (activeRef.value && !isAppBackgrounded.value) {
      poller.start();
    } else {
      poller.stop();
    }
  };

  const stopWatchActive = watch(activeRef, sync, { immediate: true });
  const stopWatchBackground = watch(isAppBackgrounded, sync);

  onUnmounted(() => {
    poller.stop();
    stopWatchActive();
    stopWatchBackground();
  });

  return poller;
}
