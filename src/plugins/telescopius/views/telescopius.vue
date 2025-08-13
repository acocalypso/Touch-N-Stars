<template>
  <div class="container py-16 flex items-center justify-center">
    <div class="container max-w-4xl">
      <h5 class="text-2xl text-center font-bold text-white mb-4">
        {{ $t('plugins.telescopius.title') }}
      </h5>

      <div class="flex flex-col space-y-4">
        <div
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <p class="text-white text-center">{{ $t('plugins.telescopius.welcome') }}</p>
          <p class="text-gray-400 text-center mt-2">{{ $t('plugins.telescopius.description') }}</p>

          <!-- API Key Status -->
          <div
            v-if="telescopiusStore.hasApiKey"
            class="mt-4 p-3 bg-green-900/30 border border-green-600 rounded-lg"
          >
            <div class="flex items-center justify-center text-green-400 text-sm">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ $t('plugins.telescopius.apiKey.configured') }}
            </div>
          </div>

          <div v-else class="mt-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
            <div class="flex items-center justify-center text-yellow-400 text-sm">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ $t('plugins.telescopius.apiKey.required') }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
            <button
              @click="showApiKeyModal = true"
              class="default-button-blue flex items-center gap-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              {{ $t('plugins.telescopius.apiKey.configure') }}
            </button>

            <button
              v-if="telescopiusStore.hasApiKey"
              @click="fetchQuoteOfTheDay"
              :disabled="isLoadingQuote"
              class="default-button-green flex items-center gap-2"
            >
              <svg
                v-if="isLoadingQuote"
                class="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                ></path>
              </svg>
              Quote of the Day
            </button>

            <button
              v-if="telescopiusStore.hasApiKey"
              @click="loadTargetLists"
              :disabled="telescopiusStore.isLoadingLists"
              class="default-button-purple flex items-center gap-2"
            >
              <svg
                v-if="telescopiusStore.isLoadingLists"
                class="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h7"
                ></path>
              </svg>
              Load Target Lists
            </button>

            <button
              v-if="telescopiusStore.hasApiKey && telescopiusStore.hasTargetLists"
              @click="refreshTargetLists"
              :disabled="telescopiusStore.isLoadingLists"
              class="default-button-blue flex items-center gap-2"
              title="Refresh from API and update cache"
            >
              <svg
                v-if="telescopiusStore.isLoadingLists"
                class="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <!-- Quote of the Day Display -->
        <div
          v-if="quoteData"
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-6"
        >
          <h6 class="text-lg font-semibold text-white mb-4 text-center">Quote of the Day</h6>
          <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
            <blockquote class="text-gray-200 text-center italic mb-3">
              "{{
                quoteData.quote ||
                quoteData.text ||
                quoteData.content ||
                'Quote text not available'
              }}"
            </blockquote>
            <div class="text-gray-400 text-center text-sm">
              <span v-if="quoteData.author">— {{ quoteData.author }}</span>
              <span v-if="quoteData.date" class="block mt-1">{{ formatDate(quoteData.date) }}</span>
            </div>

            <!-- Debug info (remove later) -->
            <div class="mt-4 p-2 bg-gray-900 rounded text-xs text-gray-400">
              <details>
                <summary>Debug Info</summary>
                <pre>{{ JSON.stringify(quoteData, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div
          v-if="quoteError"
          class="border border-red-700 rounded-lg bg-gradient-to-br from-red-900/30 to-red-800/30 shadow-lg p-4"
        >
          <div class="flex items-center text-red-400 text-sm">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ quoteError }}
          </div>
        </div>

        <!-- Target Lists Display -->
        <div
          v-if="telescopiusStore.hasTargetLists"
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-6"
        >
          <h6 class="text-lg font-semibold text-white mb-4 text-center">My Target Lists</h6>
          <div class="space-y-4">
            <div
              v-for="list in telescopiusStore.targetLists"
              :key="list.id"
              class="bg-gray-800/50 rounded-lg p-4 border border-gray-600"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex-1">
                  <h7 class="text-white font-medium">{{ list.name || 'Unnamed List' }}</h7>
                  <p class="text-gray-400 text-sm mt-1">{{ list.username }} • ID: {{ list.id }}</p>
                </div>
                <div class="text-right">
                  <button
                    @click="toggleListDetails(list.id)"
                    :class="expandedLists.includes(list.id) ? 'text-yellow-400' : 'text-blue-400'"
                    class="hover:text-blue-300 text-sm underline"
                  >
                    {{ expandedLists.includes(list.id) ? 'Hide Objects' : 'Show Objects' }}
                  </button>
                </div>
              </div>

              <!-- Objects List -->
              <div v-if="expandedLists.includes(list.id) && list.objects" class="mt-4 space-y-3">
                <div
                  v-for="(obj, index) in list.objects"
                  :key="index"
                  class="bg-gray-900/30 rounded-lg p-3 border border-gray-700"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h8 class="text-white font-medium text-sm">{{ obj.name }}</h8>
                      <div class="text-gray-400 text-xs mt-1 space-y-1">
                        <div>RA: {{ formatRA(obj.coordinates.ra) }}</div>
                        <div>Dec: {{ formatDec(obj.coordinates.dec) }}</div>
                        <div v-if="obj.size_deg">Size: {{ obj.size_deg.toFixed(2) }}°</div>
                        <div v-if="obj.notes" class="text-gray-500">{{ obj.notes }}</div>
                      </div>
                    </div>

                    <!-- Action Buttons -->
                    <div
                      v-if="store.mountInfo.Connected && !store.sequenceRunning"
                      class="flex flex-col gap-1 ml-4"
                    >
                      <button
                        @click="setFramingForTarget(obj)"
                        class="default-button-cyan text-xs px-2 py-1 min-w-0"
                        title="Add to Framing"
                      >
                        Frame
                      </button>
                      <ButtonSlewCenterRotate
                        :raAngle="obj.coordinates.ra * 15"
                        :decAngle="obj.coordinates.dec"
                        class="text-xs"
                        size="small"
                      />
                      <SaveFavTargets
                        class="w-4 h-4 self-center"
                        :name="obj.name"
                        :ra="obj.coordinates.ra * 15"
                        :dec="obj.coordinates.dec"
                        :ra-string="formatRA(obj.coordinates.ra)"
                        :dec-string="formatDec(obj.coordinates.dec)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Target Lists Error Display -->
        <div
          v-if="telescopiusStore.listsError"
          class="border border-red-700 rounded-lg bg-gradient-to-br from-red-900/30 to-red-800/30 shadow-lg p-4"
        >
          <div class="flex items-center text-red-400 text-sm">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ telescopiusStore.listsError }}
          </div>
        </div>
      </div>
    </div>

    <!-- API Key Modal -->
    <ApiKeyModal :show="showApiKeyModal" @close="showApiKeyModal = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ApiKeyModal from '../components/ApiKeyModal.vue';
import { useTelescopisStore } from '../store/telescopiusStore';
import telescopiusApiService from '../services/telescopiusApiService';
import { apiStore } from '@/store/store';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';
import { latitude, longitude, useLocationStore } from '@/utils/location';
import ButtonSlewCenterRotate from '@/components/mount/ButtonSlewCenterRotate.vue';
import SaveFavTargets from '@/components/favTargets/SaveFavTargets.vue';

const showApiKeyModal = ref(false);
const telescopiusStore = useTelescopisStore();
const store = apiStore();
const locationStore = useLocationStore();
const isLoadingQuote = ref(false);
const quoteData = ref(null);
const quoteError = ref(null);
const expandedLists = ref([]);

const fetchQuoteOfTheDay = async () => {
  if (!telescopiusStore.hasApiKey) {
    quoteError.value = 'API Key required';
    return;
  }

  isLoadingQuote.value = true;
  quoteError.value = null;

  try {
    const response = await telescopiusApiService.getQuoteOfTheDay();
    console.log('Quote API Response:', response);
    quoteData.value = response;
  } catch (error) {
    console.error('Failed to fetch quote:', error);
    quoteError.value = error.message || 'Failed to fetch quote of the day';
    quoteData.value = null;
  } finally {
    isLoadingQuote.value = false;
  }
};

const loadTargetLists = async () => {
  console.log('[Telescopius] loadTargetLists() - Starting to load user target lists');

  if (!telescopiusStore.hasApiKey) {
    console.log('[Telescopius] No API key configured');
    telescopiusStore.setListsError('API Key required');
    return;
  }

  telescopiusStore.setLoadingLists(true);
  telescopiusStore.setListsError(null);

  try {
    // First try to load from cache
    console.log('[Telescopius] Checking cache for target lists...');
    const cacheLoaded = await telescopiusStore.loadTargetListsFromCache();

    if (cacheLoaded) {
      console.log('[Telescopius] Target lists loaded from cache');
      telescopiusStore.setLoadingLists(false);
      return;
    }

    // Cache miss or expired, fetch from API
    console.log('[Telescopius] Cache miss, fetching from API...');
    const response = await telescopiusApiService.getUserLists();
    console.log('[Telescopius] getUserLists() response:', response);
    console.log('[Telescopius] Found', response?.length || 0, 'target lists');

    if (!response || response.length === 0) {
      telescopiusStore.setTargetLists([]);
      telescopiusStore.setLoadingLists(false);
      return;
    }

    // Load all target list details in parallel
    console.log('[Telescopius] Loading details for all lists...');
    const params = {};
    if (latitude.value && longitude.value) {
      params.lat = parseFloat(latitude.value);
      params.lon = parseFloat(longitude.value);
      console.log('[Telescopius] Using location parameters for all lists:', params);
    }

    const detailPromises = response.map(async (list) => {
      try {
        console.log(`[Telescopius] Loading details for list ${list.id}...`);
        const details = await telescopiusApiService.getTargetList(list.id, params);
        return { ...list, ...details };
      } catch (error) {
        console.error(`[Telescopius] Failed to load details for list ${list.id}:`, error);
        return list; // Return original list without details on error
      }
    });

    const listsWithDetails = await Promise.all(detailPromises);
    console.log('[Telescopius] All target lists with details loaded:', listsWithDetails);

    telescopiusStore.setTargetLists(listsWithDetails);

    // Save to cache
    await telescopiusStore.saveTargetListsToCache();
    console.log('[Telescopius] Target lists cached for future use');
  } catch (error) {
    console.error('[Telescopius] Failed to load target lists:', error);
    telescopiusStore.setListsError(error.message || 'Failed to load target lists');
    telescopiusStore.setTargetLists([]);
  } finally {
    telescopiusStore.setLoadingLists(false);
    console.log('[Telescopius] loadTargetLists() completed');
  }
};

const refreshTargetLists = async () => {
  console.log('[Telescopius] refreshTargetLists() - Force refresh from API');

  // Clear cache first
  await telescopiusStore.clearTargetListsCache();

  // Clear current lists
  telescopiusStore.clearTargetLists();

  // Load fresh data from API
  await loadTargetLists();
};

const toggleListDetails = (listId) => {
  console.log(`[Telescopius] toggleListDetails(${listId}) - Toggle list details`);

  if (expandedLists.value.includes(listId)) {
    console.log(`[Telescopius] Collapsing list ${listId}`);
    expandedLists.value = expandedLists.value.filter((id) => id !== listId);
    return;
  }

  const list = telescopiusStore.targetLists.find((l) => l.id === listId);
  console.log(`[Telescopius] Found list with ${list?.objects?.length || 0} objects`);

  expandedLists.value.push(listId);
  console.log(`[Telescopius] Expanded lists:`, expandedLists.value);
};

const formatRA = (raHours) => {
  // Telescopius API returns RA in hours, so convert to degrees first
  const raDegrees = raHours * 15;
  return degreesToHMS(raDegrees);
};

const formatDec = (decDegrees) => {
  return degreesToDMS(decDegrees);
};

const setFramingForTarget = (target) => {
  const framingData = {
    name: target.name,
    raString: formatRA(target.coordinates.ra),
    decString: formatDec(target.coordinates.dec),
    ra: target.coordinates.ra * 15, // Convert hours to degrees for framing
    dec: target.coordinates.dec,
    item: [target.name],
  };

  console.log('Setting framing for target:', framingData);

  // Emit the framing event - assuming parent component handles this
  // This follows the same pattern as SelectedObject.vue
  store.setFramingCoordinates && store.setFramingCoordinates(framingData);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

onMounted(async () => {
  if (!telescopiusStore.isLoaded) {
    await telescopiusStore.loadApiKey();
  }

  // Try to load location from profile if not set
  if (!latitude.value && !longitude.value) {
    console.log('[Telescopius] No location data found, trying to load from profile');
    await locationStore.loadFromAstrometrySettings();
    console.log(
      `[Telescopius] After loading from profile: lat=${latitude.value}, lon=${longitude.value}`
    );
  }
});
</script>
