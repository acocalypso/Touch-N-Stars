<template>
  <div class="container py-16 flex items-center justify-center">
    <div class="container max-w-4xl">
      <!-- Loading Spinner during initialization -->
      <div v-if="isInitializing" class="flex flex-col items-center justify-center py-20">
        <svg class="w-12 h-12 animate-spin text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
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
            d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p class="text-gray-400 text-center">{{ $t('plugins.telescopius.initializing') }}</p>
      </div>

      <!-- Landing Page - zeige wenn kein API Key gesetzt ist -->
      <TelescopiusLandingPage
        v-else-if="!telescopiusStore.hasApiKey"
        @openApiKeyModal="showApiKeyModal = true"
      />

      <!-- Main Plugin View - zeige wenn API Key gesetzt ist -->
      <div v-else>
        <h5 class="text-2xl text-center font-bold text-white mb-4">
          {{ $t('plugins.telescopius.title') }}
        </h5>

        <div class="flex flex-col space-y-4">
          <div
            class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
          >
            <!-- API Key Status -->
            <div v-if="telescopiusStore.hasApiKey" class="flex items-center justify-center mb-2">
              <div
                class="inline-flex items-center px-2 py-1 bg-green-900/30 border border-green-600 rounded text-green-400 text-xs"
              >
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  ></path>
                </svg>
                API
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
                @click="refreshTargetLists"
                :disabled="telescopiusStore.isLoadingLists"
                class="default-button-orange flex items-center gap-2"
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
                    d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
                {{ $t('plugins.telescopius.apiKey.loadFromTelescopius') }}
              </button>
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
                    <div class="text-white font-medium">{{ list.name || 'Unnamed List' }}</div>
                    <p class="text-gray-400 text-sm mt-1">
                      {{ list.username }} • ID: {{ list.id }}
                    </p>
                  </div>
                  <div class="text-right">
                    <button
                      @click="toggleListDetails(list.id)"
                      :class="expandedLists.includes(list.id) ? 'text-yellow-400' : 'text-blue-400'"
                      class="hover:text-blue-300 p-1 rounded transition-colors"
                      :title="expandedLists.includes(list.id) ? 'Hide Objects' : 'Show Objects'"
                    >
                      <svg
                        v-if="expandedLists.includes(list.id)"
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 15l7-7 7 7"
                        ></path>
                      </svg>
                      <svg
                        v-else
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Objects List -->
                <div v-if="expandedLists.includes(list.id) && list.objects" class="mt-4 space-y-3">
                  <div
                    v-for="(obj, index) in list.objects"
                    :key="index"
                    class="bg-gray-900/30 rounded-lg p-3 border border-gray-700 hover:border-gray-500 cursor-pointer transition-colors"
                    @click="openTargetModal(obj)"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="text-white font-medium text-sm">{{ obj.name }}</div>
                        <div class="text-gray-400 text-xs mt-1 space-y-1">
                          <div>RA: {{ formatRA(obj.coordinates.ra) }}</div>
                          <div>Dec: {{ formatDec(obj.coordinates.dec) }}</div>
                          <div v-if="obj.size_deg">Size: {{ obj.size_deg.toFixed(2) }}°</div>
                          <div v-if="obj.notes" class="text-gray-500">{{ obj.notes }}</div>
                        </div>
                      </div>

                      <!-- Click indicator -->
                      <div class="flex items-center justify-center text-gray-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5l7 7-7 7"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Target Lists Message -->
          <div
            v-else-if="
              telescopiusStore.hasApiKey &&
              !telescopiusStore.isLoadingLists &&
              !telescopiusStore.hasTargetLists &&
              !telescopiusStore.listsError
            "
            class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-6"
          >
            <div class="text-center">
              <svg
                class="w-12 h-12 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <h6 class="text-lg font-semibold text-white mb-2">
                {{ $t('plugins.telescopius.targetLists.noListsTitle') }}
              </h6>
              <p class="text-gray-400 text-sm mb-4">
                {{ $t('plugins.telescopius.targetLists.noListsDescription') }}
              </p>
              <p class="text-gray-500 text-xs">
                {{ $t('plugins.telescopius.targetLists.noListsHint') }}
              </p>
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
    </div>

    <!-- API Key Modal -->
    <ApiKeyModal :show="showApiKeyModal" @close="showApiKeyModal = false" />

    <!-- Target Modal -->
    <Modal :show="showTargetModal" @close="closeTargetModal">
      <template #header>
        <h2 class="text-xl font-bold text-white">
          {{ selectedTarget?.name || 'Target' }}
        </h2>
      </template>

      <template #body>
        <div class="w-full max-w-md mx-auto">
          <!-- Target Information -->
          <div v-if="selectedTarget" class="mb-6 text-center">
            <div
              v-if="selectedTarget.notes"
              class="bg-gray-800/50 rounded-lg p-3 border border-gray-600 mb-4"
            >
              <div class="text-sm text-gray-300">{{ selectedTarget.notes }}</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div
            v-if="selectedTarget && store.mountInfo.Connected && !store.sequenceRunning"
            class="space-y-3"
          >
            <!-- Go To Framing -->
            <button
              @click="setFramingForTarget(selectedTarget)"
              class="w-full default-button-cyan flex items-center justify-center gap-3"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Go To Framing
            </button>

            <!-- Slew -->
            <ButtonSlewCenterRotate
              :raAngle="selectedTarget.coordinates.ra * 15"
              :decAngle="selectedTarget.coordinates.dec"
              class="w-full"
            />
          </div>

          <!-- Mount not connected message -->
          <div
            v-else-if="selectedTarget && !store.mountInfo.Connected"
            class="text-center text-gray-400"
          >
            <svg
              class="w-12 h-12 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>Mount not connected</p>
          </div>

          <!-- Sequence running message -->
          <div
            v-else-if="selectedTarget && store.sequenceRunning"
            class="text-center text-gray-400"
          >
            <svg
              class="w-12 h-12 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>Sequence is running</p>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ApiKeyModal from '../components/ApiKeyModal.vue';
import TelescopiusLandingPage from '../components/TelescopiusLandingPage.vue';
import { useTelescopisStore } from '../store/telescopiusStore';
import telescopiusApiService from '../services/telescopiusApiService';
import { apiStore } from '@/store/store';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';
import { latitude, longitude, useLocationStore } from '@/utils/location';
import ButtonSlewCenterRotate from '@/components/mount/ButtonSlewCenterRotate.vue';
import Modal from '@/components/helpers/Modal.vue';
import { useRouter } from 'vue-router';
import { useFramingStore } from '@/store/framingStore';

const showApiKeyModal = ref(false);
const isInitializing = ref(true);
const telescopiusStore = useTelescopisStore();
const store = apiStore();
const locationStore = useLocationStore();
const router = useRouter();
const framingStore = useFramingStore();
const expandedLists = ref([]);
const showTargetModal = ref(false);
const selectedTarget = ref(null);

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

    // Handle 404 errors specifically (no target lists found)
    if (error.isNotFound || error.status === 404) {
      console.log(
        '[Telescopius] No target lists found (404) - this is normal for users without lists'
      );
      telescopiusStore.setTargetLists([]);
      telescopiusStore.setListsError(null); // Don't show error for empty lists
    } else {
      // Show error for actual API issues
      telescopiusStore.setListsError(error.message || 'Failed to load target lists');
      telescopiusStore.setTargetLists([]);
    }
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

const openTargetModal = (target) => {
  console.log('[Telescopius] Opening modal for target:', target.name);
  selectedTarget.value = target;
  showTargetModal.value = true;
};

const closeTargetModal = () => {
  console.log('[Telescopius] Closing target modal');
  showTargetModal.value = false;
  selectedTarget.value = null;
};

const setFramingForTarget = (target) => {
  console.log('[Telescopius] Setting framing for target:', target.name);

  try {
    const raDegrees = target.coordinates.ra * 15; // Convert hours to degrees
    const decDegrees = target.coordinates.dec;

    console.log(
      `[Telescopius] Setting framing coordinates: RA: ${raDegrees}°, Dec: ${decDegrees}°`
    );

    // Create framing data object for the existing setFramingCoordinates function
    const framingData = {
      name: target.name,
      raString: formatRA(target.coordinates.ra), // HMS format
      decString: formatDec(target.coordinates.dec), // DMS format
      ra: raDegrees, // Degrees
      dec: decDegrees, // Degrees
    };

    console.log('[Telescopius] Framing data:', framingData);

    // Use the existing setFramingCoordinates function
    setFramingCoordinates(framingData);

    // Close modal
    closeTargetModal();
  } catch (error) {
    console.error('[Telescopius] Failed to set framing:', error);
    alert(`Failed to go to framing: ${error.message}`);
  }
};

// Use the existing setFramingCoordinates function from the parent context
const setFramingCoordinates = (data) => {
  framingStore.RAangleString = data?.raString;
  framingStore.DECangleString = data?.decString;
  framingStore.RAangle = data?.ra;
  framingStore.DECangle = data?.dec;
  framingStore.selectedItem = {
    Name: data?.name || '',
    RA: data?.ra,
    Dec: data?.dec,
  };

  console.log('[Telescopius] Set Framing Coordinates');
  store.mount.currentTab = 'showSlew';
  console.log('[Telescopius] store.mount.currentTab', store.mount.currentTab);
  router.push('/mount');
};

onMounted(async () => {
  try {
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

    // Auto-load cached target lists on page load
    if (telescopiusStore.hasApiKey) {
      console.log('[Telescopius] Page loaded with API key, checking for cached target lists...');
      const cacheLoaded = await telescopiusStore.loadTargetListsFromCache();
      if (cacheLoaded) {
        console.log('[Telescopius] Target lists auto-loaded from cache on page load');
      } else {
        console.log('[Telescopius] No valid cache found on page load');
      }
    }
  } finally {
    isInitializing.value = false;
  }
});
</script>

<style scoped>
/* Remove border from slew button component */
:deep(.no-border > div:first-child) {
  border: none !important;
  padding: 0 !important;
  margin-top: 0 !important;
}
</style>
