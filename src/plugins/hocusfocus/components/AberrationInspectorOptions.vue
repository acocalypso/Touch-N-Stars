<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="spinner"></div>
      <p class="text-gray-400 ml-4">Loading Aberration Inspector options...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-900 border border-red-700 rounded-lg p-4">
      <p class="text-red-200"><span class="font-semibold">Error:</span> {{ error }}</p>
      <button
        @click="loadOptions()"
        class="mt-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition"
      >
        Retry
      </button>
    </div>

    <!-- No Options Available -->
    <div v-if="!isLoading && !error && Object.keys(options).length === 0" class="text-center py-12">
      <p class="text-gray-400">No Aberration Inspector options available yet.</p>
    </div>

    <!-- Aberration Inspector Options Form -->
    <div v-if="!isLoading && !error && Object.keys(options).length > 0" class="space-y-6">
      <!-- Settings Card -->
      <div class="border border-gray-700 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">Inspector Settings</h3>
        <div class="space-y-3">
          <!-- Microns Per Focuser Step -->
          <div>
            <label class="text-white mb-2 block">Microns Per Focuser Step</label>
            <input
              :value="options.MicronsPerFocuserStep === -1 ? '' : options.MicronsPerFocuserStep"
              @change="
                (e) => {
                  const val = e.target.value === '' ? -1 : parseFloat(e.target.value);
                  options.MicronsPerFocuserStep = val;
                  saveOption('MicronsPerFocuserStep', val);
                }
              "
              type="text"
              class="w-full bg-gray-700 text-white p-2 rounded"
              :disabled="savingOptions.has('MicronsPerFocuserStep')"
            />
            <div v-if="optionErrors.MicronsPerFocuserStep" class="text-red-400 text-xs mt-1">
              {{ optionErrors.MicronsPerFocuserStep }}
            </div>
          </div>
        </div>
      </div>

      <!-- Reset Button -->
      <div class="flex justify-end">
        <button
          @click="resetToDefaults()"
          :disabled="isResetting"
          class="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded font-semibold transition"
        >
          {{ isResetting ? 'Resetting...' : 'Reset to Defaults' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import apiService from '@/services/apiService';

const isLoading = ref(false);
const error = ref(null);
const isResetting = ref(false);
const options = reactive({});
const savingOptions = ref(new Set());
const optionErrors = ref({});

// Load options from API
const loadOptions = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await apiService.hocusfocus.getAberrationInspectorOptions();
    if (response && typeof response === 'object') {
      Object.assign(options, response);
    }
  } catch (err) {
    console.error('[AberrationInspectorOptions] Error loading options:', err);
    error.value = err.message || 'Failed to load options';
  } finally {
    isLoading.value = false;
  }
};

// Save a single option
const saveOption = async (key, value) => {
  savingOptions.value.add(key);
  optionErrors.value[key] = null;

  try {
    const response = await apiService.hocusfocus.setAberrationInspectorOption(key, value);
    if (!response.Success) {
      optionErrors.value[key] = response.Error || 'Failed to save option';
      options[key] = value;
    }
  } catch (err) {
    console.error(`[AberrationInspectorOptions] Error saving option ${key}:`, err);
    optionErrors.value[key] = err.message || 'Failed to save option';
  } finally {
    savingOptions.value.delete(key);
  }
};

// Reset to defaults
const resetToDefaults = async () => {
  isResetting.value = true;
  error.value = null;

  try {
    const response = await apiService.hocusfocus.resetAberrationInspectorDefaults();
    if (response.Success) {
      optionErrors.value = {};
      await loadOptions();
    } else {
      error.value = response.Error || 'Failed to reset options';
    }
  } catch (err) {
    console.error('[AberrationInspectorOptions] Error resetting options:', err);
    error.value = err.message || 'Failed to reset options';
  } finally {
    isResetting.value = false;
  }
};

// Load options on mount
import { onMounted } from 'vue';
onMounted(() => {
  loadOptions();
});
</script>
