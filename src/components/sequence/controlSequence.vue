<template>
  <div v-if="!store.sequenceIsLoaded" class="text-red-500">
    <p>{{ $t('components.sequence.noSequenceLoaded') }}</p>
  </div>
  <div v-else class="flex items-center justify-center w-full mb-6">
    <div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700">
      <h3 class="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-blue-400"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M12 2a1 1 0 011 1v3a1 1 0 11-2 0V3a1 1 0 011-1zm0 15a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm10-5a1 1 0 01-1 1h-3a1 1 0 110-2h3a1 1 0 011 1zM7 12a1 1 0 01-1 1H3a1 1 0 110-2h3a1 1 0 011 1zm12.071 7.071a1 1 0 01-1.414 0l-2.121-2.121a1 1 0 011.414-1.414l2.121 2.121a1 1 0 010 1.414zM8.464 8.464a1 1 0 01-1.414 0L4.93 6.344a1 1 0 011.414-1.414L8.464 7.05a1 1 0 010 1.414zM4.93 19.071a1 1 0 01-1.414-1.414l2.121-2.121a1 1 0 011.414 1.414l-2.121 2.121a1 1 0 01-1.414 0zM15.536 8.464a1 1 0 01-1.414-1.414l2.121-2.121a1 1 0 011.414 1.414l-2.121 2.121a1 1 0 01-1.414 0z"
          />
        </svg>
        {{ $t('components.sequence.sequence_control') }}
      </h3>
      <div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <button
          :class="[
            'btn-primary bg-gradient-to-br from-blue-600 to-blue-500',
            store.sequenceRunning
              ? 'opacity-75 cursor-not-allowed'
              : 'hover:from-blue-700 hover:to-blue-600',
          ]"
          @click="startSequence"
          :disabled="store.sequenceRunning"
          v-tooltip="'Start the imaging sequence'"
        >
          <span v-if="store.sequenceRunning" class="animate-spin mr-2">&#9696;</span>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clip-rule="evenodd"
            />
          </svg>
          {{
            store.sequenceRunning
              ? $t('components.sequence.running')
              : $t('components.sequence.startSequence')
          }}
        </button>
        <button
          class="btn-primary bg-gradient-to-br from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
          @click="stopSequence"
          v-tooltip="'Stop the current sequence'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
              clip-rule="evenodd"
            />
          </svg>
          {{ $t('components.sequence.stopSequence') }}
        </button>
        <button
          class="btn-primary bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
          @click="showResetConfirmation = true"
          :disabled="store.sequenceRunning"
          v-tooltip="'Reset sequence state'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clip-rule="evenodd"
            />
          </svg>
          {{ $t('components.sequence.resetSequence') }}
        </button>
        <button
          class="btn-primary bg-gradient-to-br from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
          @click="openEditModal"
          :disabled="store.sequenceRunning"
          v-tooltip="'Edit exposure parameters'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
            />
          </svg>
          {{ $t('components.sequence.editSequence') }}
        </button>
      </div>
    </div>

    <!-- Edit Parameters Dialog -->
    <transition name="fade">
      <div
        v-if="showEditModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4"
        @click.self="showEditModal = false"
        @keydown.esc="showEditModal = false"
      >
        <transition name="scale">
          <div v-if="showEditModal" class="bg-gray-800 rounded-lg p-6 max-w-md w-full mt-4">
            <h3 class="text-xl font-semibold mb-4">
              {{ $t('components.sequence.editParameters') }}
            </h3>

            <!-- Group for plain Take Exposure (if available) -->
            <div v-if="takeExposure" class="space-y-4 mb-6 border-b pb-4">
              <h4 class="text-lg font-semibold mb-2">Take Exposure</h4>
              <div>
                <label class="block text-sm font-medium mb-1">
                  {{ $t('components.sequence.gain') }}
                </label>
                <input
                  v-model.number="takeExposureGain"
                  type="number"
                  class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">
                  {{ $t('components.sequence.exposureTime') }}
                </label>
                <input
                  v-model.number="takeExposureExposureTime"
                  type="number"
                  step="0.1"
                  class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <!-- Group for Smart Exposure (if available) -->
            <div v-if="smartExposure" class="space-y-4 mb-6">
              <h4 class="text-lg font-semibold mb-2">Smart Exposure</h4>
              <div>
                <label class="block text-sm font-medium mb-1">
                  {{ $t('components.sequence.gain') }}
                </label>
                <input
                  v-model.number="smartExposureGain"
                  type="number"
                  class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">
                  {{ $t('components.sequence.exposureCount') }}
                </label>
                <input
                  v-model.number="smartExposureExposureCount"
                  type="number"
                  class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">
                  {{ $t('components.sequence.exposureTime') }}
                </label>
                <input
                  v-model.number="smartExposureExposureTime"
                  type="number"
                  step="0.1"
                  class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">
                  {{ $t('components.sequence.ditherAfterExposures') }}
                </label>
                <input
                  v-model.number="smartExposureAfterExposures"
                  type="number"
                  class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div class="flex justify-end space-x-4">
              <button class="btn-secondary" @click="showEditModal = false">
                {{ $t('general.cancel') }}
              </button>
              <button class="btn-primary bg-green-600 hover:bg-green-700" @click="saveEdits">
                {{ $t('components.settings.save') }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Reset Confirmation Dialog -->
    <transition name="fade">
      <div
        v-if="showResetConfirmation"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4"
        @click.self="showResetConfirmation = false"
        @keydown.esc="showResetConfirmation = false"
      >
        <transition name="scale">
          <div v-if="showResetConfirmation" class="bg-gray-800 rounded-lg p-6 max-w-md w-full mt-4">
            <h3 class="text-xl font-semibold mb-4">
              {{ $t('components.sequence.resetConfirmationTitle') }}
            </h3>
            <p class="mb-6">{{ $t('components.sequence.resetConfirmationMessage') }}</p>
            <div class="flex justify-end space-x-4">
              <button class="btn-secondary" @click="showResetConfirmation = false">
                {{ $t('general.cancel') }}
              </button>
              <button class="btn-danger" @click="confirmReset">
                {{ $t('general.confirm') }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';

const store = apiStore();
const showResetConfirmation = ref(false);
const showEditModal = ref(false);
const isLoading = computed(() => store.sequenceRunning);

// Refs for storing exposure items and their paths.
const takeExposure = ref(null);
const smartExposure = ref(null);
const ditherTrigger = ref(null);
const takeExposurePath = ref('');
const smartExposurePath = ref('');
const ditherTriggerPath = ref('');

// Input field refs.
const takeExposureGain = ref(-1);
const takeExposureExposureTime = ref(5);
const smartExposureGain = ref(-1);
const smartExposureExposureCount = ref(0);
const smartExposureExposureTime = ref(5);
const smartExposureAfterExposures = ref(1);

onMounted(() => {
  findExposureItemsInSequence();
});

/**
 * Recursively search the sequence tree.
 * If a container's Name is "Smart Exposure_Container", then all nested "Take Exposure"
 * items are marked as Smart Exposures. Also finds Dither triggers.
 */
function findExposureItems(container, path = '', inSmartContainer = false, results = []) {
  if (container.Name === 'Smart Exposure_Container') {
    inSmartContainer = true;
  }

  // Find Take Exposure items
  if (container.Name === 'Take Exposure') {
    const type = inSmartContainer ? 'Smart Exposure' : 'Take Exposure';
    results.push({ type, path, item: container });
  }

  // Find Dither after Exposures trigger
  if (container.Triggers && Array.isArray(container.Triggers)) {
    container.Triggers.forEach((trigger, index) => {
      if (trigger.Name === 'Dither after Exposures_Trigger') {
        const triggerPath = path ? `${path}-Triggers-${index}` : `Triggers-${index}`;
        results.push({ type: 'Dither Trigger', path: triggerPath, item: trigger });
      }
    });
  }

  // Continue recursive search
  if (container.Items && Array.isArray(container.Items)) {
    container.Items.forEach((child, index) => {
      const newPath = path ? `${path}-Items-${index}` : `${index}`;
      findExposureItems(child, newPath, inSmartContainer, results);
    });
  }
}

/**
 * Traverse the sequenceStateInfo and pick out the first occurrence of
 * a plain Take Exposure, a Smart Exposure, and a Dither trigger.
 */
function findExposureItemsInSequence() {
  if (!store.sequenceStateInfo) return;
  let items = [];

  if (Array.isArray(store.sequenceStateInfo)) {
    store.sequenceStateInfo.forEach((container, index) => {
      findExposureItems(container, `${index}`, false, items);
    });
  } else {
    findExposureItems(store.sequenceStateInfo, '0', false, items);
  }

  const plainExposure = items.find((exp) => exp.type === 'Take Exposure');
  const smartExp = items.find((exp) => exp.type === 'Smart Exposure');
  const ditherTrig = items.find((item) => item.type === 'Dither Trigger');

  if (plainExposure) {
    takeExposure.value = plainExposure.item;
    takeExposurePath.value = plainExposure.path;
  } else {
    takeExposure.value = null;
    takeExposurePath.value = '';
  }

  if (smartExp) {
    smartExposure.value = smartExp.item;
    smartExposurePath.value = smartExp.path;
  } else {
    smartExposure.value = null;
    smartExposurePath.value = '';
  }

  if (ditherTrig) {
    ditherTrigger.value = ditherTrig.item;
    ditherTriggerPath.value = ditherTrig.path;
    smartExposureAfterExposures.value = ditherTrig.item.AfterExposures || 1;
  } else {
    ditherTrigger.value = null;
    ditherTriggerPath.value = '';
  }

  console.log('Found Take Exposure path:', takeExposurePath.value);
  console.log('Found Smart Exposure path:', smartExposurePath.value);
  console.log('Found Dither Trigger path:', ditherTriggerPath.value);
}

function openEditModal() {
  findExposureItemsInSequence();
  if (takeExposure.value) {
    takeExposureGain.value = takeExposure.value.Gain !== undefined ? takeExposure.value.Gain : -1;
    takeExposureExposureTime.value =
      takeExposure.value.ExposureTime !== undefined ? takeExposure.value.ExposureTime : 5;
  }
  if (smartExposure.value) {
    smartExposureGain.value =
      smartExposure.value.Gain !== undefined ? smartExposure.value.Gain : -1;
    smartExposureExposureCount.value =
      smartExposure.value.ExposureCount !== undefined ? smartExposure.value.ExposureCount : 0;
    smartExposureExposureTime.value =
      smartExposure.value.ExposureTime !== undefined ? smartExposure.value.ExposureTime : 5;
  }
  if (ditherTrigger.value) {
    smartExposureAfterExposures.value =
      ditherTrigger.value.AfterExposures !== undefined ? ditherTrigger.value.AfterExposures : 1;
  }
  if (!takeExposure.value && !smartExposure.value) {
    console.error('Could not find any exposure settings in sequence data');
    alert('Could not find exposure settings. Please reload the sequence.');
    return;
  }
  showEditModal.value = true;
}

async function saveEdits() {
  if (!takeExposure.value && !smartExposure.value) {
    console.error('No valid exposure item found');
    findExposureItemsInSequence();
    if (!takeExposure.value && !smartExposure.value) {
      alert('Could not find any exposure settings to update. Please reload the sequence.');
      showEditModal.value = false;
      return;
    }
  }
  try {
    let success = true;
    const results = {};

    // Update plain Take Exposure (if available)
    if (takeExposure.value) {
      let basePath = takeExposurePath.value;
      if (basePath.startsWith('2')) {
        basePath = basePath.replace(/^2/, 'Imaging');
      }
      const takeUpdates = [
        { key: 'Gain', value: takeExposureGain.value.toString() },
        { key: 'ExposureTime', value: takeExposureExposureTime.value.toString() },
      ];
      for (const update of takeUpdates) {
        const path = `${basePath}-${update.key}`;
        const payload = { path, value: update.value };
        console.debug(`Requesting update for Take Exposure: ${update.key}`, payload);
        const response = await apiService.sequenceEdit(payload);
        results[`TakeExposure-${update.key}`] = response;
        if (!response.Success) {
          console.error(`Failed to update Take Exposure ${update.key}:`, response.Error);
          success = false;
        }
      }
    }

    // Update Smart Exposure (if available)
    if (smartExposure.value) {
      let basePath = smartExposurePath.value;
      if (basePath.startsWith('2')) {
        basePath = basePath.replace(/^2/, 'Imaging');
      }
      const smartUpdates = [
        { key: 'Gain', value: smartExposureGain.value.toString() },
        { key: 'ExposureCount', value: smartExposureExposureCount.value.toString() },
        { key: 'ExposureTime', value: smartExposureExposureTime.value.toString() },
      ];
      for (const update of smartUpdates) {
        const path = `${basePath}-${update.key}`;
        const payload = { path, value: update.value };
        console.debug(`Requesting update for Smart Exposure: ${update.key}`, payload);
        const response = await apiService.sequenceEdit(payload);
        results[`SmartExposure-${update.key}`] = response;
        if (!response.Success) {
          console.error(`Failed to update Smart Exposure ${update.key}:`, response.Error);
          success = false;
        }
      }
    }

    // Update Dither Trigger AfterExposures (if available)
    if (ditherTrigger.value) {
      let basePath = ditherTriggerPath.value;
      if (basePath.startsWith('2')) {
        basePath = basePath.replace(/^2/, 'Imaging');
      }
      const payload = {
        path: `${basePath}-AfterExposures`,
        value: smartExposureAfterExposures.value.toString(),
      };
      console.debug(`Requesting update for Dither Trigger AfterExposures:`, payload);
      const response = await apiService.sequenceEdit(payload);
      results[`DitherTrigger-AfterExposures`] = response;
      if (!response.Success) {
        console.error(`Failed to update Dither Trigger AfterExposures:`, response.Error);
        success = false;
      }
    } else {
      console.warn('No Dither Trigger found to update AfterExposures value');
    }

    if (success) {
      await store.fetchAllInfos();
      showEditModal.value = false;
    } else {
      let errorMessage = 'Failed to save some settings:\n';
      for (const key in results) {
        if (!results[key].Success) {
          errorMessage += `- ${key}: ${results[key].Error}\n`;
        }
      }
      alert(errorMessage);
    }
  } catch (error) {
    console.error('Error saving edits:', error);
    alert('Error saving changes: ' + (error.message || 'Unknown error'));
  }
}

async function startSequence() {
  console.log('Starting sequence');
  store.setSequenceRunning(true);
  try {
    const data = await apiService.sequenceAction('start');
    console.log('Response:', data);
  } catch (error) {
    console.log('Error:', error);
    store.setSequenceRunning(false);
  }
}

async function stopSequence() {
  try {
    const data = await apiService.sequenceAction('stop');
    console.log('Response:', data);
    if (data.Success) {
      store.setSequenceRunning(false);
    } else {
      console.error('Failed to stop sequence:', data.Error);
    }
  } catch (error) {
    console.log('Error:', error);
    store.setSequenceRunning(false);
  }
}

async function confirmReset() {
  isLoading.value = true;
  showResetConfirmation.value = false;
  try {
    const data = await apiService.sequenceAction('reset');
    console.log('Response:', data);
    if (data.Success) {
      await store.fetchAllInfos();
      isLoading.value = false;
    } else {
      console.error('Failed to reset sequence:', data.Error);
      isLoading.value = false;
    }
  } catch (error) {
    console.log('Error:', error);
    isLoading.value = false;
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}
.scale-enter-from,
.scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}
</style>
