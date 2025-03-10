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
        class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-auto"
        @click.self="showEditModal = false"
        @keydown.esc="showEditModal = false"
      >
        <transition name="scale">
          <div v-if="showEditModal" class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mt-4 mb-8">
            <h3 class="text-xl font-semibold mb-4">
              {{ $t('components.sequence.editParameters') }}
            </h3>

            <!-- Dynamic exposure settings rendering -->
            <div
              v-for="(config, type) in filteredExposureConfig"
              :key="type"
              class="space-y-4 mb-6"
              :class="{
                'border-b pb-4': type !== Object.keys(filteredExposureConfig).slice(-1)[0],
              }"
            >
              <h4 class="text-lg font-semibold mb-2">{{ config.displayName }}</h4>

              <!-- Dynamic field rendering section -->
              <div
                v-for="(exposure, index) in exposures[type]"
                :key="`${type}-${index}`"
                class="border border-gray-700 rounded-lg p-4 mb-4"
              >
                <div class="flex justify-between items-center mb-3">
                  <span class="font-medium text-blue-400">
                    {{ exposure.item.ImageType || 'LIGHT' }}
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <template v-for="field in config.fields" :key="`${type}-${index}-${field.key}`">
                    <div v-if="shouldShowField(field, exposure, type)">
                      <label class="block text-sm font-medium mb-1">
                        {{ $t(field.label) }}
                      </label>
                      <input
                        v-model.number="exposure[field.key]"
                        :type="field.type || 'number'"
                        :step="field.step"
                        class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </template>
                </div>

                <!-- Dither settings integrated directly -->
                <div
                  v-if="
                    type === 'smart' &&
                    exposure.item.ImageType === 'LIGHT' &&
                    exposure.ditherTrigger
                  "
                  class="mt-4 pt-3 border-t border-gray-700"
                >
                  <div>
                    <label class="block text-sm font-medium mb-1">
                      {{ $t('components.sequence.ditherAfterExposures') }}
                    </label>
                    <input
                      v-model.number="exposure.afterExposures"
                      type="number"
                      class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
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

// Configuration for exposure types
const exposureConfig = {
  take: {
    type: 'take',
    displayName: 'Take Exposure',
    fields: [
      { key: 'gain', label: 'components.sequence.gain' },
      { key: 'exposureTime', label: 'components.sequence.exposureTime', step: 0.1 },
    ],
  },
  smart: {
    type: 'smart',
    displayName: 'Smart Exposure',
    fields: [
      { key: 'gain', label: 'components.sequence.gain' },
      { key: 'exposureCount', label: 'components.sequence.exposureCount' },
      { key: 'exposureTime', label: 'components.sequence.exposureTime', step: 0.1 },
    ],
  },
  many: {
    type: 'many',
    displayName: 'Take Many Exposures',
    fields: [
      { key: 'exposureCount', label: 'components.sequence.exposureCount' },
      { key: 'gain', label: 'components.sequence.gain' },
      { key: 'exposureTime', label: 'components.sequence.exposureTime', step: 0.1 },
    ],
  },
};

// Object to hold all exposure types
const exposures = ref({
  take: [],
  smart: [],
  many: [],
});

// Computed property to filter exposureConfig based on exposures length
const filteredExposureConfig = computed(() => {
  const result = {};
  for (const type in exposureConfig) {
    if (exposures.value[type].length > 0) {
      result[type] = exposureConfig[type];
    }
  }
  return result;
});

onMounted(() => {
  findExposureItemsInSequence();
});

const shouldShowField = (field, exposure, type) => {
  // Always show exposureCount for smart and many types
  if ((type === 'smart' || type === 'many') && field.key === 'exposureCount') return true;

  // Hide exposureCount for take type
  if (type === 'take' && field.key === 'exposureCount') return false;

  return true;
};

/**
 * Create an exposure object with appropriate properties
 */
function createExposureObject(
  item,
  path,
  type,
  isDitherTrigger = false,
  triggerItem = null,
  triggerPath = ''
) {
  if (isDitherTrigger) {
    return {
      item: triggerItem,
      path: triggerPath,
      afterExposures: triggerItem.AfterExposures || 1,
      originalAfterExposures: triggerItem.AfterExposures || 1,
      modified: false,
    };
  }

  return {
    item: item,
    path: path,
    type: type,
    gain: item.Gain !== undefined ? item.Gain : -1,
    exposureTime: item.ExposureTime !== undefined ? item.ExposureTime : 5,
    exposureCount: item.ExposureCount !== undefined ? item.ExposureCount : 0,
    originalGain: item.Gain !== undefined ? item.Gain : -1,
    originalExposureTime: item.ExposureTime !== undefined ? item.ExposureTime : 5,
    originalExposureCount: item.ExposureCount !== undefined ? item.ExposureCount : 0,
    ditherTrigger: null,
    afterExposures: 1,
    originalAfterExposures: 1,
    modified: false,
  };
}

/**
 * Recursively search the sequence tree.
 * Find all exposure items and categorize them by type
 */
function findExposureItems(
  container,
  path = '',
  inSmartContainer = false,
  smartContainerPath = '',
  results = []
) {
  // Find Smart Exposure containers
  if (container.Name === 'Smart Exposure_Container') {
    inSmartContainer = true;
    smartContainerPath = path;

    // Look for dither triggers in the smart container
    let ditherTrigger = null;
    let ditherTriggerPath = '';

    if (container.Triggers && Array.isArray(container.Triggers)) {
      container.Triggers.forEach((trigger, index) => {
        if (trigger.Name === 'Dither after Exposures_Trigger') {
          ditherTrigger = trigger;
          ditherTriggerPath = path ? `${path}-Triggers-${index}` : `Triggers-${index}`;
        }
      });
    }

    // Find exposure items within this Smart Container
    if (container.Items && Array.isArray(container.Items)) {
      container.Items.forEach((item, index) => {
        if (item.Name === 'Take Exposure') {
          const itemPath = path ? `${path}-Items-${index}` : `Items-${index}`;
          const exp = createExposureObject(item, itemPath, 'smart');

          // Associate dither trigger with this exposure if it exists
          if (ditherTrigger) {
            exp.ditherTrigger = ditherTrigger;
            exp.ditherTriggerPath = ditherTriggerPath;
            exp.afterExposures = ditherTrigger.AfterExposures || 1;
            exp.originalAfterExposures = ditherTrigger.AfterExposures || 1;
          }

          results.push({ type: 'smart', data: exp });
        }
      });
    }
  }

  // Find Take Many Exposures containers
  if (container.Name === 'Take Many Exposures_Container') {
    // Get the first Take Exposure item inside the container
    if (container.Items && Array.isArray(container.Items)) {
      container.Items.forEach((item, index) => {
        if (item.Name === 'Take Exposure') {
          const itemPath = path ? `${path}-Items-${index}` : `Items-${index}`;
          const exp = createExposureObject(item, itemPath, 'many');

          // Handle container conditions for iterations (exposureCount)
          if (container.Conditions && Array.isArray(container.Conditions)) {
            container.Conditions.forEach((condition) => {
              if (condition.Name === 'Loop For Iterations_Condition') {
                exp.exposureCount = condition.Iterations || 1;
                exp.originalExposureCount = condition.Iterations || 1;
              }
            });
          }

          results.push({ type: 'many', data: exp });
        }
      });
    }
  }

  // Find standalone Take Exposure items (not in Smart Container or Take Many Container)
  if (!inSmartContainer && container.Name === 'Take Exposure') {
    // Check if this is not inside a Take Many container by examining the parent path
    // This is a simplification - you may need a more robust parent check
    const exp = createExposureObject(container, path, 'take');
    results.push({ type: 'take', data: exp });
  }

  // Continue recursive search through child items
  if (container.Items && Array.isArray(container.Items)) {
    container.Items.forEach((child, index) => {
      const newPath = path ? `${path}-Items-${index}` : `${index}`;
      findExposureItems(child, newPath, inSmartContainer, smartContainerPath, results);
    });
  }

  return results;
}

/**
 * Traverse the sequenceStateInfo and find all exposure items
 */
function findExposureItemsInSequence() {
  if (!store.sequenceStateInfo) return;

  // Reset all exposure arrays
  exposures.value = {
    take: [],
    smart: [],
    many: [],
  };

  let results = [];

  if (Array.isArray(store.sequenceStateInfo)) {
    store.sequenceStateInfo.forEach((container, index) => {
      results = findExposureItems(container, `${index}`, false, '', results);
    });
  } else {
    results = findExposureItems(store.sequenceStateInfo, '0', false, '', results);
  }

  // Process and categorize results
  results.forEach((result) => {
    if (result.type === 'take') {
      exposures.value.take.push(result.data);
    } else if (result.type === 'smart') {
      exposures.value.smart.push(result.data);
    } else if (result.type === 'many') {
      exposures.value.many.push(result.data);
    }
  });

  console.log(`Found ${exposures.value.take.length} Take Exposures`);
  console.log(`Found ${exposures.value.smart.length} Smart Exposures`);
  console.log(`Found ${exposures.value.many.length} Take Many Exposures`);
}

function openEditModal() {
  findExposureItemsInSequence();

  const totalExposures =
    exposures.value.take.length + exposures.value.smart.length + exposures.value.many.length;

  if (totalExposures === 0) {
    console.error('Could not find any exposure settings in sequence data');
    alert('Could not find exposure settings. Please reload the sequence.');
    return;
  }

  // Reset modification flags
  Object.keys(exposures.value).forEach((type) => {
    exposures.value[type].forEach((exposure) => {
      exposure.modified = false;
    });
  });

  showEditModal.value = true;
}

async function saveEdits() {
  const totalExposures =
    exposures.value.take.length + exposures.value.smart.length + exposures.value.many.length;

  if (totalExposures === 0) {
    console.error('No valid exposure items found');
    findExposureItemsInSequence();

    const newTotalExposures =
      exposures.value.take.length + exposures.value.smart.length + exposures.value.many.length;

    if (newTotalExposures === 0) {
      alert('Could not find any exposure settings to update. Please reload the sequence.');
      showEditModal.value = false;
      return;
    }
  }

  try {
    let success = true;
    const results = {};
    const updatePromises = [];

    // Process all exposure types
    for (const type in exposures.value) {
      for (const exposure of exposures.value[type]) {
        let basePath = exposure.path;
        if (basePath.startsWith('2')) {
          basePath = basePath.replace(/^2/, 'Imaging');
        }

        // Check if gain was modified
        if (exposure.gain !== exposure.originalGain) {
          const path = `${basePath}-Gain`;
          const payload = { path, value: exposure.gain.toString() };
          console.debug(`Requesting update for ${type} Exposure Gain:`, payload);
          updatePromises.push(
            apiService.sequenceEdit(payload).then((response) => {
              results[`${type}Exposure-Gain-${path}`] = response;
              if (!response.Success) {
                console.error(`Failed to update ${type} Exposure Gain:`, response.Error);
                success = false;
              }
            })
          );
        }

        // Check if exposure count was modified (for smart and many types)
        if (
          (type === 'smart' || type === 'many') &&
          exposure.exposureCount !== exposure.originalExposureCount
        ) {
          const path = `${basePath}-ExposureCount`;
          const payload = { path, value: exposure.exposureCount.toString() };
          console.debug(`Requesting update for ${type} Exposure ExposureCount:`, payload);
          updatePromises.push(
            apiService.sequenceEdit(payload).then((response) => {
              results[`${type}Exposure-ExposureCount-${path}`] = response;
              if (!response.Success) {
                console.error(`Failed to update ${type} Exposure ExposureCount:`, response.Error);
                success = false;
              }
            })
          );
        }

        // Check if exposure time was modified
        if (exposure.exposureTime !== exposure.originalExposureTime) {
          const path = `${basePath}-ExposureTime`;
          const payload = { path, value: exposure.exposureTime.toString() };
          console.debug(`Requesting update for ${type} Exposure ExposureTime:`, payload);
          updatePromises.push(
            apiService.sequenceEdit(payload).then((response) => {
              results[`${type}Exposure-ExposureTime-${path}`] = response;
              if (!response.Success) {
                console.error(`Failed to update ${type} Exposure ExposureTime:`, response.Error);
                success = false;
              }
            })
          );
        }

        // Check if dither setting was modified
        if (exposure.ditherTrigger && exposure.afterExposures !== exposure.originalAfterExposures) {
          let ditherPath = exposure.ditherTriggerPath;
          if (ditherPath.startsWith('2')) {
            ditherPath = ditherPath.replace(/^2/, 'Imaging');
          }

          const path = `${ditherPath}-AfterExposures`;
          const payload = { path, value: exposure.afterExposures.toString() };
          console.debug(`Requesting update for Dither Trigger AfterExposures:`, payload);
          updatePromises.push(
            apiService.sequenceEdit(payload).then((response) => {
              results[`DitherTrigger-AfterExposures-${path}`] = response;
              if (!response.Success) {
                console.error(`Failed to update Dither Trigger AfterExposures:`, response.Error);
                success = false;
              }
            })
          );
        }
      }
    }

    // Wait for all updates to complete
    await Promise.all(updatePromises);

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
