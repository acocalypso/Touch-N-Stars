<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="store.isLoadingAutoFocusOptions" class="flex items-center justify-center py-12">
      <div class="spinner"></div>
      <p class="text-gray-400 ml-4">Loading AutoFocus options...</p>
    </div>

    <!-- Error State -->
    <div v-if="store.autoFocusOptionsError" class="bg-red-900 border border-red-700 rounded-lg p-4">
      <p class="text-red-200">
        <span class="font-semibold">Error:</span> {{ store.autoFocusOptionsError }}
      </p>
      <button
        @click="loadAutoFocusOptions()"
        class="mt-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition"
      >
        Retry
      </button>
    </div>

    <!-- AutoFocus Options Form -->
    <div v-if="store.autoFocusOptions && !store.isLoadingAutoFocusOptions" class="space-y-6">
      <!-- Basic Settings Section -->
      <div class="border border-gray-700 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">Basic Settings</h3>
        <div class="space-y-3">
          <div v-for="key in getSectionOptions('Basic Settings')" :key="key">
            <template v-if="isNumeric(key)">
              <label class="text-white mb-2 block"
                >{{ formatOptionName(key) }}: {{ store.autoFocusOptions[key] }}</label
              >
              <input
                :value="store.autoFocusOptions[key]"
                @change="
                  (e) => {
                    const num = parseFloat(e.target.value);
                    store.autoFocusOptions[key] = num;
                    saveAutoFocusOption(key, num);
                  }
                "
                type="range"
                :min="getNumericRangeMin(key)"
                :max="getNumericRangeMax(key)"
                :step="getNumericStep(key)"
                class="w-full"
                :disabled="savingOptions.has(key)"
              />
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
            <template v-else-if="isBoolean(key)">
              <label class="flex items-center text-white">
                <input
                  :checked="store.autoFocusOptions[key]"
                  @change="
                    (e) => {
                      store.autoFocusOptions[key] = e.target.checked;
                      saveAutoFocusOption(key, e.target.checked);
                    }
                  "
                  type="checkbox"
                  class="mr-3"
                  :disabled="savingOptions.has(key)"
                />
                <span>{{ formatOptionName(key) }}</span>
              </label>
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
            <template v-else>
              <label class="text-white mb-2 block">{{ formatOptionName(key) }}</label>
              <input
                :value="store.autoFocusOptions[key]"
                @change="
                  (e) => {
                    store.autoFocusOptions[key] = e.target.value;
                    saveAutoFocusOption(key, e.target.value);
                  }
                "
                type="text"
                class="w-full bg-gray-700 text-white p-2 rounded"
                :disabled="savingOptions.has(key)"
              />
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- HFR Validation Section -->
      <div
        v-if="getSectionOptions('HFR Validation').length > 0"
        class="border border-gray-700 rounded-lg p-4"
      >
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">HFR Validation</h3>
        <div class="space-y-3">
          <div v-for="key in getSectionOptions('HFR Validation')" :key="key">
            <template v-if="isNumeric(key) && store.autoFocusOptions.ValidateHfrImprovement">
              <label class="text-white mb-2 block"
                >{{ formatOptionName(key) }}: {{ store.autoFocusOptions[key] }}</label
              >
              <input
                :value="store.autoFocusOptions[key]"
                @change="
                  (e) => {
                    const num = parseFloat(e.target.value);
                    store.autoFocusOptions[key] = num;
                    saveAutoFocusOption(key, num);
                  }
                "
                type="range"
                :min="getNumericRangeMin(key)"
                :max="getNumericRangeMax(key)"
                :step="getNumericStep(key)"
                class="w-full"
                :disabled="savingOptions.has(key)"
              />
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
            <template v-else-if="isBoolean(key)">
              <label class="flex items-center text-white">
                <input
                  :checked="store.autoFocusOptions[key]"
                  @change="
                    (e) => {
                      store.autoFocusOptions[key] = e.target.checked;
                      saveAutoFocusOption(key, e.target.checked);
                    }
                  "
                  type="checkbox"
                  class="mr-3"
                  :disabled="savingOptions.has(key)"
                />
                <span>{{ formatOptionName(key) }}</span>
              </label>
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
            <template v-else-if="store.autoFocusOptions.ValidateHfrImprovement">
              <label class="text-white mb-2 block">{{ formatOptionName(key) }}</label>
              <input
                :value="store.autoFocusOptions[key]"
                @change="
                  (e) => {
                    store.autoFocusOptions[key] = e.target.value;
                    saveAutoFocusOption(key, e.target.value);
                  }
                "
                type="text"
                class="w-full bg-gray-700 text-white p-2 rounded"
                :disabled="savingOptions.has(key)"
              />
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Outlier Rejection Section -->
      <div
        v-if="getSectionOptions('Outlier Rejection').length > 0"
        class="border border-gray-700 rounded-lg p-4"
      >
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">Outlier Rejection</h3>
        <div class="space-y-3">
          <div v-for="key in getSectionOptions('Outlier Rejection')" :key="key">
            <template v-if="isNumeric(key)">
              <label class="text-white mb-2 block"
                >{{ formatOptionName(key) }}: {{ store.autoFocusOptions[key] }}</label
              >
              <input
                :value="store.autoFocusOptions[key]"
                @change="
                  (e) => {
                    const num = parseFloat(e.target.value);
                    store.autoFocusOptions[key] = num;
                    saveAutoFocusOption(key, num);
                  }
                "
                type="range"
                :min="getNumericRangeMin(key)"
                :max="getNumericRangeMax(key)"
                :step="getNumericStep(key)"
                class="w-full"
                :disabled="savingOptions.has(key)"
              />
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
            <template v-else-if="isBoolean(key)">
              <label class="flex items-center text-white">
                <input
                  :checked="store.autoFocusOptions[key]"
                  @change="
                    (e) => {
                      store.autoFocusOptions[key] = e.target.checked;
                      saveAutoFocusOption(key, e.target.checked);
                    }
                  "
                  type="checkbox"
                  class="mr-3"
                  :disabled="savingOptions.has(key)"
                />
                <span>{{ formatOptionName(key) }}</span>
              </label>
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
            <template v-else>
              <label class="text-white mb-2 block">{{ formatOptionName(key) }}</label>
              <input
                :value="store.autoFocusOptions[key]"
                @change="
                  (e) => {
                    store.autoFocusOptions[key] = e.target.value;
                    saveAutoFocusOption(key, e.target.value);
                  }
                "
                type="text"
                class="w-full bg-gray-700 text-white p-2 rounded"
                :disabled="savingOptions.has(key)"
              />
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- FastFocus Settings Section -->
      <div
        v-if="getSectionOptions('FastFocus Settings').length > 0"
        class="border border-gray-700 rounded-lg p-4"
      >
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">FastFocus Settings</h3>
        <div class="space-y-3">
          <div v-for="key in getSectionOptions('FastFocus Settings')" :key="key">
            <template v-if="isNumeric(key) && store.autoFocusOptions.FastFocusModeEnabled">
              <label class="text-white mb-2 block"
                >{{ formatOptionName(key) }}: {{ store.autoFocusOptions[key] }}</label
              >
              <input
                :value="store.autoFocusOptions[key]"
                @change="
                  (e) => {
                    const num = parseFloat(e.target.value);
                    store.autoFocusOptions[key] = num;
                    saveAutoFocusOption(key, num);
                  }
                "
                type="range"
                :min="getNumericRangeMin(key)"
                :max="getNumericRangeMax(key)"
                :step="getNumericStep(key)"
                class="w-full"
                :disabled="savingOptions.has(key)"
              />
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
            <template v-else-if="isBoolean(key)">
              <label class="flex items-center text-white">
                <input
                  :checked="store.autoFocusOptions[key]"
                  @change="
                    (e) => {
                      store.autoFocusOptions[key] = e.target.checked;
                      saveAutoFocusOption(key, e.target.checked);
                    }
                  "
                  type="checkbox"
                  class="mr-3"
                  :disabled="savingOptions.has(key)"
                />
                <span>{{ formatOptionName(key) }}</span>
              </label>
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
            <template v-else-if="store.autoFocusOptions.FastFocusModeEnabled">
              <label class="text-white mb-2 block">{{ formatOptionName(key) }}</label>
              <input
                :value="store.autoFocusOptions[key]"
                @change="
                  (e) => {
                    store.autoFocusOptions[key] = e.target.value;
                    saveAutoFocusOption(key, e.target.value);
                  }
                "
                type="text"
                class="w-full bg-gray-700 text-white p-2 rounded"
                :disabled="savingOptions.has(key)"
              />
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Storage Section -->
      <div
        v-if="getSectionOptions('Storage').length > 0"
        class="border border-gray-700 rounded-lg p-4"
      >
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">Storage</h3>
        <div class="space-y-3">
          <div v-for="key in getSectionOptions('Storage')" :key="key">
            <template v-if="isNumeric(key)">
              <label class="text-white mb-2 block"
                >{{ formatOptionName(key) }}: {{ store.autoFocusOptions[key] }}</label
              >
              <input
                :value="store.autoFocusOptions[key]"
                @change="
                  (e) => {
                    const num = parseFloat(e.target.value);
                    store.autoFocusOptions[key] = num;
                    saveAutoFocusOption(key, num);
                  }
                "
                type="range"
                :min="getNumericRangeMin(key)"
                :max="getNumericRangeMax(key)"
                :step="getNumericStep(key)"
                class="w-full"
                :disabled="savingOptions.has(key)"
              />
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
            <template v-else-if="isBoolean(key)">
              <label class="flex items-center text-white">
                <input
                  :checked="store.autoFocusOptions[key]"
                  @change="
                    (e) => {
                      store.autoFocusOptions[key] = e.target.checked;
                      saveAutoFocusOption(key, e.target.checked);
                    }
                  "
                  type="checkbox"
                  class="mr-3"
                  :disabled="savingOptions.has(key)"
                />
                <span>{{ formatOptionName(key) }}</span>
              </label>
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
            <template v-else>
              <label class="text-white mb-2 block">{{ formatOptionName(key) }}</label>
              <input
                :value="store.autoFocusOptions[key]"
                @change="
                  (e) => {
                    store.autoFocusOptions[key] = e.target.value;
                    saveAutoFocusOption(key, e.target.value);
                  }
                "
                type="text"
                class="w-full bg-gray-700 text-white p-2 rounded"
                :disabled="savingOptions.has(key)"
              />
              <div v-if="optionErrors[key]" class="text-red-400 text-xs mt-1">
                {{ optionErrors[key] }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Reset to Defaults Button -->
      <div class="flex justify-end">
        <button
          @click="resetAutoFocusDefaults()"
          :disabled="resettingDefaults"
          class="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded font-semibold transition"
        >
          {{ resettingDefaults ? 'Resetting...' : 'Reset to Defaults' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useHocusFocusStore } from '../store/hocusfocusStore';
import apiService from '@/services/apiService';

const store = useHocusFocusStore();

// Track which options are currently being saved
const savingOptions = ref(new Set());
const optionErrors = ref({});
const resettingDefaults = ref(false);

const loadAutoFocusOptions = async () => {
  await store.loadAutoFocusOptions();
};

// Save individual AutoFocus option
const saveAutoFocusOption = async (optionName, newValue) => {
  try {
    savingOptions.value.add(optionName);
    optionErrors.value[optionName] = null;

    console.log(`[AutoFocus] Saving ${optionName}: ${newValue}`);
    const response = await apiService.hocusfocus.setAutoFocusOption(optionName, newValue);

    if (response.Success) {
      console.log(`[AutoFocus] ${optionName} saved successfully`);
    } else {
      optionErrors.value[optionName] = response.Error || 'Failed to save option';
    }
  } catch (err) {
    console.error(`[AutoFocus] Error saving ${optionName}:`, err);
    optionErrors.value[optionName] = err.message || 'Failed to save option';
  } finally {
    savingOptions.value.delete(optionName);
  }
};

// Reset AutoFocus options to defaults
const resetAutoFocusDefaults = async () => {
  if (!confirm('Are you sure you want to reset all AutoFocus options to their defaults?')) {
    return;
  }

  try {
    resettingDefaults.value = true;
    console.log('[AutoFocus] Resetting all options to defaults');
    const response = await apiService.hocusfocus.resetAutoFocusDefaults();

    if (response.Success) {
      console.log('[AutoFocus] Options reset successfully:', response.Message);
      // Reload options to sync with backend
      await store.loadAutoFocusOptions();
      // Clear any error messages
      optionErrors.value = {};
    } else {
      store.autoFocusOptionsError = response.Error || 'Failed to reset options';
    }
  } catch (err) {
    console.error('[AutoFocus] Error resetting options:', err);
    store.autoFocusOptionsError = err.message || 'Failed to reset options';
  } finally {
    resettingDefaults.value = false;
  }
};

// Option categorization mapping
const optionCategories = {
  // Basic Settings
  MaxConcurrent: 'Basic Settings',
  AutoFocusTimeoutSeconds: 'Basic Settings',
  FocuserOffset: 'Basic Settings',

  // HFR Validation
  ValidateHfrImprovement: 'HFR Validation',
  HFRImprovementThreshold: 'HFR Validation',

  // Hyperbolic Fit
  UnevenHyperbolicFitEnabled: 'Hyperbolic Fit',
  WeightedHyperbolicFitEnabled: 'Hyperbolic Fit',

  // Outlier Rejection
  MaxOutlierRejections: 'Outlier Rejection',
  OutlierRejectionConfidence: 'Outlier Rejection',

  // FastFocus Settings
  FastFocusModeEnabled: 'FastFocus Settings',
  FastStepSize: 'FastFocus Settings',
  FastOffsetSteps: 'FastFocus Settings',
  FastThreshold_Seconds: 'FastFocus Settings',
  FastThreshold_Celcius: 'FastFocus Settings',
  FastThreshold_FocuserPosition: 'FastFocus Settings',

  // Storage
  Save: 'Storage',
  SavePath: 'Storage',
};

// Friendly display names for options
const optionDisplayNames = {
  MaxConcurrent: 'Max Concurrent',
  AutoFocusTimeoutSeconds: 'AutoFocus Timeout (seconds)',
  FocuserOffset: 'Focuser Offset',
  ValidateHfrImprovement: 'Validate HFR Improvement',
  HFRImprovementThreshold: 'HFR Improvement Threshold',
  UnevenHyperbolicFitEnabled: 'Uneven Hyperbolic Fit',
  WeightedHyperbolicFitEnabled: 'Weighted Hyperbolic Fit',
  MaxOutlierRejections: 'Max Outlier Rejections',
  OutlierRejectionConfidence: 'Outlier Rejection Confidence',
  FastFocusModeEnabled: 'Fast Focus Mode',
  FastStepSize: 'Fast Step Size',
  FastOffsetSteps: 'Fast Offset Steps',
  FastThreshold_Seconds: 'Fast Threshold (Seconds)',
  FastThreshold_Celcius: 'Fast Threshold (Celsius)',
  FastThreshold_FocuserPosition: 'Fast Threshold (Focuser Position)',
  Save: 'Save',
  SavePath: 'Save Path',
};

// Helper function to get options for a specific section
const getSectionOptions = (section) => {
  if (!store.autoFocusOptions) return [];
  return Object.keys(store.autoFocusOptions).filter((key) => {
    const category = optionCategories[key];
    if (category === section) return true;
    if (!category && section === 'Other') return true;
    return false;
  });
};

// Helper function to check if a value is boolean
const isBoolean = (key) => {
  if (!store.autoFocusOptions) return false;
  return typeof store.autoFocusOptions[key] === 'boolean';
};

// Helper function to check if a value is numeric
const isNumeric = (key) => {
  if (!store.autoFocusOptions) return false;
  return typeof store.autoFocusOptions[key] === 'number';
};

// Helper function to get numeric range min
const getNumericRangeMin = (key) => {
  const ranges = {
    MaxConcurrent: 0,
    FastStepSize: 1,
    FastOffsetSteps: 2,
    FastThreshold_Seconds: 0,
    FastThreshold_Celcius: 0,
    FastThreshold_FocuserPosition: 0,
    AutoFocusTimeoutSeconds: 1,
    FocuserOffset: -1000,
    MaxOutlierRejections: 0,
    HFRImprovementThreshold: 0,
    OutlierRejectionConfidence: 0.5001,
  };
  return ranges[key] !== undefined ? ranges[key] : 0;
};

// Helper function to get numeric range max
const getNumericRangeMax = (key) => {
  const ranges = {
    MaxConcurrent: 10,
    FastStepSize: 100,
    FastOffsetSteps: 100,
    FastThreshold_Seconds: 3600,
    FastThreshold_Celcius: 100,
    FastThreshold_FocuserPosition: 10000,
    AutoFocusTimeoutSeconds: 3600,
    FocuserOffset: 1000,
    MaxOutlierRejections: 10,
    HFRImprovementThreshold: 1,
    OutlierRejectionConfidence: 0.9999,
  };
  return ranges[key] !== undefined ? ranges[key] : 100;
};

// Helper function to get numeric step
const getNumericStep = (key) => {
  const steps = {
    HFRImprovementThreshold: 0.01,
    OutlierRejectionConfidence: 0.01,
  };
  return steps[key] !== undefined ? steps[key] : 1;
};

// Helper function to format option names
const formatOptionName = (key) => {
  if (!key) return '';
  // Check if we have a friendly display name
  if (optionDisplayNames[key]) {
    return optionDisplayNames[key];
  }
  // Fallback: insert space before capital letters
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

// Load options on mount
onMounted(() => {
  loadAutoFocusOptions();
});
</script>
