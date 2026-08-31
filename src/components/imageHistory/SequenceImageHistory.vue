<template>
  <div>
    <div class="mb-4 flex items-center gap-3 px-4 sm:px-0">
      <button
        @click="toggleSortOrder"
        class="flex items-center gap-2 text-sm sm:text-base text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-150 ease-in-out focus:outline-none group bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2"
        role="button"
        aria-label="Sort images"
      >
        <div class="flex flex-col items-center text-[0.65rem] leading-3 opacity-50 mr-1">
          <ChevronUpIcon class="w-3 h-3 mb-0.5" />
          <ChevronDownIcon class="w-3 h-3" />
        </div>
        <ChevronUpIcon
          v-if="sortAscending"
          class="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5"
        />
        <ChevronDownIcon
          v-else
          class="w-5 h-5 transition-transform duration-200 group-hover:translate-y-0.5"
        />
        <span class="border-b-2 border-transparent group-hover:border-current">
          {{ t('components.sequence.sort.sort') }}:
          {{
            sortAscending
              ? t('components.sequence.sort.oldest')
              : t('components.sequence.sort.newest')
          }}
        </span>
      </button>
      <button
        @click="toggleShowHistoryStats"
        class="flex items-center gap-2 text-sm sm:text-base transition-all duration-150 ease-in-out focus:outline-none group bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2"
        :class="
          settingsStore.monitorViewSetting.showHistoryImageStats
            ? 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
            : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400'
        "
        role="button"
        aria-label="Toggle image statistics"
      >
        <ChartBarIcon class="w-5 h-5" />
        <span class="border-b-2 border-transparent group-hover:border-current">
          {{ t('components.sequence.stats') }}
        </span>
      </button>
    </div>
    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 xl:gap-4 pt-4 pb-20"
    >
      <div v-for="item in visibleImages" :key="item.index" class="relative">
        <SequenceImage
          v-if="item.data"
          :index="item.index"
          :image="item.data"
          :stats="item.stats"
          :showStats="settingsStore.monitorViewSetting.showHistoryImageStats"
        />
        <div
          v-else
          class="flex items-center justify-center min-h-55 bg-gray-800 shadow-lg shadow-cyan-700/40 rounded-xl border border-cyan-700"
        >
          <!-- Once the retries are used up the tile must stop pretending to load. -->
          <PhotoIcon v-if="item.failed" class="w-8 h-8 text-gray-600" />
          <div
            v-else
            class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin opacity-50"
          ></div>
        </div>
      </div>
      <div
        v-if="hasMore"
        ref="sentinel"
        class="col-span-full flex items-center justify-center p-5 min-h-20"
      >
        <div
          class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { ref, watch, onUnmounted, computed } from 'vue';
import { ChevronUpIcon, ChevronDownIcon, ChartBarIcon, PhotoIcon } from '@heroicons/vue/24/outline';
import SequenceImage from '@/components/imageHistory/SequenceImage.vue';
import { apiStore } from '@/store/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useSequenceStore } from '@/store/sequenceStore';
import { useImagetStore } from '@/store/imageStore';
import { useImageFilter, passesImageFilter } from '@/composables/useImageFilter';
import {
  buildTypeIndexMap,
  runWithConcurrency,
  selectIndicesToLoad,
} from '@/utils/imageHistoryUtils';

const { t } = useI18n();
const sequenceStore = useSequenceStore();
const imageStore = useImagetStore();
const store = apiStore();
const settingsStore = useSettingsStore();
const { filter } = useImageFilter();

// How many thumbnails are added per batch, and how many downloads run at once.
const BATCH_SIZE = 40;
const CONCURRENCY = 4;
// A thumbnail of a just-saved image may not exist on the backend yet.
const MISS_RETRIES = 2;
const MISS_RETRY_DELAY = 3000;

const sortAscending = ref(false);
const visibleCount = ref(BATCH_SIZE);
// Vue instruments Map operations, so a plain .set() below is picked up by visibleImages.
const thumbnails = ref(new Map()); // absolute history index -> object URL
const sentinel = ref(null);
const failed = ref(new Set()); // history indices whose thumbnail never showed up
const inFlight = new Set(); // history indices currently downloading

// store.imageHistoryInfo is the source of truth for the list; the thumbnails are a
// side lookup. That keeps filtering and sorting independent of the download progress.
const enrichedStats = ref([]); // absolute history index -> stats incl. TargetName
const typeIndexMap = ref([]);

let loadGeneration = 0;

const observer = new IntersectionObserver(
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting) && hasMore.value) {
      visibleCount.value += BATCH_SIZE;
    }
  },
  { rootMargin: '400px' }
);

function toggleShowHistoryStats() {
  settingsStore.monitorViewSetting.showHistoryImageStats =
    !settingsStore.monitorViewSetting.showHistoryImageStats;
}

function toggleSortOrder() {
  sortAscending.value = !sortAscending.value;
}

const sortedIndices = computed(() => {
  const indices = [];
  for (let i = 0; i < enrichedStats.value.length; i++) {
    if (passesImageFilter(enrichedStats.value[i], filter.value)) indices.push(i);
  }
  return sortAscending.value ? indices : indices.reverse();
});

const visibleIndices = computed(() => sortedIndices.value.slice(0, visibleCount.value));

const hasMore = computed(() => sortedIndices.value.length > visibleCount.value);

const visibleImages = computed(() =>
  visibleIndices.value.map((index) => ({
    index,
    stats: enrichedStats.value[index],
    data: thumbnails.value.get(index),
    failed: failed.value.has(index),
  }))
);

function enrichStatsWithTargetName(stats, imageIndex) {
  const resolvedTargetName = resolveTargetName(stats, imageIndex);

  if (!stats) {
    if (!resolvedTargetName) {
      return {};
    }

    return {
      TargetName: resolvedTargetName,
    };
  }

  if (!resolvedTargetName) {
    return stats;
  }

  if (stats.TargetName === resolvedTargetName) {
    return stats;
  }

  return {
    ...stats,
    TargetName: resolvedTargetName,
  };
}

function resolveTargetName(stats, imageIndex) {
  const persistedName = sequenceStore.getImageTargetName(imageIndex);
  if (persistedName) {
    return persistedName;
  }

  const derivedName = extractTargetName(stats);
  if (derivedName) {
    sequenceStore.setImageTargetName(imageIndex, derivedName);
    return derivedName;
  }

  const fallback = sequenceStore.targetName?.trim() || sequenceStore.lastTargetName?.trim() || '';
  if (fallback) {
    sequenceStore.setImageTargetName(imageIndex, fallback);
    return fallback;
  }

  return '';
}

function extractTargetName(stats) {
  if (!stats) return '';

  const candidateValues = [
    stats.TargetName,
    stats.Target?.TargetName,
    stats.Target?.Name,
    stats.Target,
    stats.SequenceTargetName,
    stats.Name,
  ];

  for (const candidate of candidateValues) {
    const normalized = normalizePossibleRef(candidate);
    if (typeof normalized === 'string' && normalized.trim().length > 0) {
      return normalized.trim();
    }
  }

  return '';
}

function normalizePossibleRef(value) {
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value;
  }

  return value;
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadThumbnail(absIdx, isCurrent) {
  const { typeIdx, imageType } = typeIndexMap.value[absIdx] ?? {};
  if (typeIdx === null || typeIdx === undefined) return;

  inFlight.add(absIdx);
  try {
    for (let attempt = 0; attempt <= MISS_RETRIES; attempt++) {
      const image = await imageStore.getCachedThumbnail(typeIdx, imageType);
      // A finished download is kept even if the filter moved on in the meantime —
      // the map is keyed by history index and stays valid.
      if (image) {
        thumbnails.value.set(absIdx, image);
        failed.value.delete(absIdx);
        return;
      }

      // Only a miss is worth abandoning: no point sitting out the retry delay for an
      // image that is no longer on screen.
      if (attempt < MISS_RETRIES && isCurrent()) {
        await wait(MISS_RETRY_DELAY);
      } else {
        // Out of attempts, or given up: stop showing a spinner that will never resolve.
        if (attempt === MISS_RETRIES) failed.value.add(absIdx);
        return;
      }
    }
  } finally {
    inFlight.delete(absIdx);
  }
}

// A single loader driven by visibleIndices covers mount, filter change, sort change,
// "load more" and newly arriving images alike.
async function loadVisibleThumbnails() {
  const todo = selectIndicesToLoad(visibleIndices.value, {
    loaded: thumbnails.value,
    failed: failed.value,
    inFlight,
  });
  // Bumping the generation only when there is work to do keeps an unrelated history
  // update from cancelling a batch that is still downloading.
  if (todo.length === 0) return;

  const generation = ++loadGeneration;
  const isCurrent = () => generation === loadGeneration;

  await runWithConcurrency(todo, (absIdx) => loadThumbnail(absIdx, isCurrent), {
    limit: CONCURRENCY,
    shouldStop: () => !isCurrent(),
  });
}

watch(
  () => store.imageHistoryInfo,
  (history) => {
    const entries = history ?? [];
    typeIndexMap.value = buildTypeIndexMap(entries);
    enrichedStats.value = entries.map((stats, index) => enrichStatsWithTargetName(stats, index));
  },
  { immediate: true }
);

// Changing the filter starts a new list — do not keep a window grown by earlier
// scrolling, and take it as the cue to retry thumbnails that failed before (a network
// blip should not leave tiles broken until the tab is reopened).
// Registered before the loading watcher on purpose: pre-flush watchers run in creation
// order, so this resets the window in the same tick, before anything is fetched.
watch(
  filter,
  () => {
    visibleCount.value = BATCH_SIZE;
    failed.value.clear();
  },
  { deep: true }
);

watch(visibleIndices, loadVisibleThumbnails, { immediate: true });

// The sentinel is behind v-if="hasMore", so it comes and goes — re-observe whenever
// the template ref changes. flush 'post' guarantees the element is in the DOM.
watch(
  sentinel,
  (el) => {
    observer.disconnect();
    if (el) observer.observe(el);
  },
  { immediate: true, flush: 'post' }
);

onUnmounted(() => {
  // The object URLs are owned by the thumbnail cache in imageStore and must not be
  // revoked here — that is what makes a tab switch free.
  loadGeneration++;
  observer.disconnect();
});
</script>
