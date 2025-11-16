<template>
  <div class="target-search">
    <div class="relative">
      <input
        type="text"
        v-model="searchQuery"
        ref="searchInput"
        @input="fetchTargetSearch"
        @focus="showResults = true"
        @blur="handleBlur"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
        :placeholder="$t('plugins.sequenceCreator.targetSearch.placeholder')"
      />

      <!-- Search icon -->
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <!-- Search Results Dropdown -->
      <div
        v-if="showResults && Array.isArray(targetSearchResult) && targetSearchResult.length > 0"
        class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
      >
        <ul class="py-1">
          <li
            v-for="(item, index) in targetSearchResult"
            :key="index"
            class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-900 dark:text-white transition-colors duration-150"
            @click="selectTarget(item)"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="font-medium">{{ item.Name }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  <span v-if="item['Common names']">({{ item['Common names'] }})</span>
                  <span v-if="item['M']">(M {{ item['M'] }})</span>
                </div>
              </div>
              <div class="ml-2">
                <span
                  v-if="item.Type === 'Comet'"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                >
                  {{ $t('plugins.sequenceCreator.targetSearch.objectTypes.Comet') }}
                </span>
                <span
                  v-else-if="item.Type === 'Planet'"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                >
                  {{ $t('plugins.sequenceCreator.targetSearch.objectTypes.Planet') }}
                </span>
                <span
                  v-else-if="item.Type === 'Star'"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                >
                  {{ $t('plugins.sequenceCreator.targetSearch.objectTypes.Star') }}
                </span>
                <span
                  v-else-if="item.Type === 'Moon'"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                >
                  {{ $t('plugins.sequenceCreator.targetSearch.objectTypes.Moon') }}
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                >
                  {{ $t('plugins.sequenceCreator.targetSearch.objectTypes.DSO') }}
                </span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import apiService from '@/services/apiService';

const emit = defineEmits(['target-selected']);

const searchQuery = ref('');
const targetSearchResult = ref([]);
const searchInput = ref(null);
const showResults = ref(false);

const celestialBodies = [
  { Name: 'Sun', Type: 'Star' },
  { Name: 'Mercury', Type: 'Planet' },
  { Name: 'Venus', Type: 'Planet' },
  { Name: 'Moon', Type: 'Moon' },
  { Name: 'Mars', Type: 'Planet' },
  { Name: 'Jupiter', Type: 'Planet' },
  { Name: 'Saturn', Type: 'Planet' },
  { Name: 'Uranus', Type: 'Planet' },
  { Name: 'Neptune', Type: 'Planet' },
  { Name: 'Pluto', Type: 'Planet' },
];

async function fetchTargetSearch() {
  if (searchQuery.value.trim() === '') {
    targetSearchResult.value = [];
    return;
  }

  try {
    const data = await apiService.searchNGC(searchQuery.value, 10);
    let results = Array.isArray(data) ? data : [];

    // Filter celestial bodies that match the search query
    const celestialBodiesResults = celestialBodies.filter((body) =>
      body.Name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );

    targetSearchResult.value = [...results, ...celestialBodiesResults];
  } catch (error) {
    console.error('Error fetching target search results:', error);
    targetSearchResult.value = [];
  }
}

function selectTarget(item) {
  console.log('Selected target:', item);

  // Format coordinates
  let raFormatted = '';
  let decFormatted = '';

  if (item.RA !== undefined && item.Dec !== undefined) {
    // Convert decimal degrees to HMS/DMS format
    raFormatted = formatRAToHMS(item.RA);
    decFormatted = formatDecToDMS(item.Dec);
  }

  // Create target object with formatted coordinates
  const targetData = {
    name: item.Name || item['Common names'] || '',
    ra: raFormatted,
    dec: decFormatted,
    positionAngle: 0,
    type: item.Type || 'DSO',
    originalData: item,
  };

  // Clear search
  searchQuery.value = item.Name || item['Common names'] || '';
  targetSearchResult.value = [];
  showResults.value = false;

  // Emit the selected target
  emit('target-selected', targetData);
}

function formatRAToHMS(raDegrees) {
  const hours = raDegrees / 15; // Convert degrees to hours
  const h = Math.floor(hours);
  const minutes = (hours - h) * 60;
  const m = Math.floor(minutes);
  const seconds = (minutes - m) * 60;
  const s = Math.round(seconds);

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDecToDMS(decDegrees) {
  const sign = decDegrees >= 0 ? '+' : '-';
  const absDec = Math.abs(decDegrees);
  const d = Math.floor(absDec);
  const minutes = (absDec - d) * 60;
  const m = Math.floor(minutes);
  const seconds = (minutes - m) * 60;
  const s = Math.round(seconds);

  return `${sign}${d.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function handleBlur() {
  // Delay hiding results to allow click events to fire
  setTimeout(() => {
    showResults.value = false;
  }, 200);
}

// Focus the search input
async function focus() {
  await nextTick();
  searchInput.value?.focus();
}

// Clear the search
function clear() {
  searchQuery.value = '';
  targetSearchResult.value = [];
  showResults.value = false;
}

defineExpose({ focus, clear });
</script>

<style scoped>
.target-search {
  position: relative;
}
</style>
