/**
 * Helpers for the sequence image history.
 *
 * The thumbnail endpoint (`GET /image/thumbnail/{index}?imageType=...`) indexes
 * per image type, while `store.imageHistoryInfo` is a flat list. Everything here
 * translates between the two and keeps the loading of many thumbnails bounded.
 */

/**
 * Maps every absolute index of the history to its type-relative index. Entries
 * without an ImageType keep their absolute index and query the endpoint without the
 * imageType parameter, which is how the endpoint was always addressed for them.
 *
 * @param {Array<{ImageType?: string}>} historyArray
 * @returns {Array<{typeIdx: number, imageType: string|null}>}
 */
export function buildTypeIndexMap(historyArray) {
  const counters = new Map();

  return (historyArray ?? []).map((img, absIdx) => {
    const imageType = img?.ImageType ?? null;
    if (!imageType) {
      return { typeIdx: absIdx, imageType: null };
    }

    const typeIdx = counters.get(imageType) ?? 0;
    counters.set(imageType, typeIdx + 1);
    return { typeIdx, imageType };
  });
}

export function thumbnailCacheKey(typeIdx, imageType) {
  return `${imageType ?? 'ANY'}:${typeIdx}`;
}

/**
 * Picks the visible indices that still need a download.
 *
 * `failed` is excluded on purpose: the watcher that drives loading re-runs on every
 * newly saved image, so without this an index whose thumbnail never materialises
 * would be re-queued — retry delays and all — for the rest of the session. Failures
 * are cleared deliberately instead (filter change, or remounting the tab).
 */
export function selectIndicesToLoad(visibleIndices, { loaded, failed, inFlight }) {
  return (visibleIndices ?? []).filter(
    (index) => !loaded.has(index) && !failed.has(index) && !inFlight.has(index)
  );
}

/**
 * Works through `items` with a bounded number of parallel workers. Items are
 * started in order, so the first entries — the ones on screen — win the race for
 * a free slot. Stops picking up new items as soon as `shouldStop()` turns true.
 */
export async function runWithConcurrency(items, worker, { limit = 4, shouldStop } = {}) {
  const queue = items ?? [];
  if (queue.length === 0) return;

  let cursor = 0;
  const workerCount = Math.max(1, Math.min(limit, queue.length));

  const runners = Array.from({ length: workerCount }, async () => {
    while (cursor < queue.length) {
      if (shouldStop?.()) return;
      const item = queue[cursor++];
      await worker(item);
    }
  });

  await Promise.all(runners);
}
