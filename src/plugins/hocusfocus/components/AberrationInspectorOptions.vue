<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="spinner"></div>
      <p class="text-gray-400 ml-4">
        {{ $t('plugins.hocusfocus.aberrationInspectorOptions.loading') }}
      </p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-900 border border-red-700 rounded-lg p-4">
      <p class="text-red-200">
        <span class="font-semibold">{{
          $t('plugins.hocusfocus.aberrationInspectorOptions.error')
        }}</span>
        {{ error }}
      </p>
      <button
        @click="loadOptions()"
        class="mt-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition"
      >
        {{ $t('plugins.hocusfocus.aberrationInspectorOptions.retry') }}
      </button>
    </div>

    <!-- No Options Available -->
    <div v-if="!isLoading && !error && Object.keys(options).length === 0" class="text-center py-12">
      <p class="text-gray-400">
        {{ $t('plugins.hocusfocus.aberrationInspectorOptions.noOptions') }}
      </p>
    </div>

    <!-- Aberration Inspector Options Form -->
    <div v-if="!isLoading && !error && Object.keys(options).length > 0" class="space-y-6">
      <!-- Settings Card -->
      <div class="border border-gray-700 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">
          {{ $t('plugins.hocusfocus.aberrationInspectorOptions.inspectorSettings') }}
        </h3>
        <div class="space-y-3">
          <div v-for="meta in visibleOptionMeta" :key="meta.key">
            <!-- Numeric option where -1 means "auto" (shown as blank) -->
            <template v-if="meta.type === 'auto-number'">
              <label class="text-white mb-2 block">{{
                $t('plugins.hocusfocus.aberrationInspectorOptions.' + meta.labelKey)
              }}</label>
              <input
                :value="options[meta.key] === -1 ? '' : options[meta.key]"
                @change="
                  (e) => {
                    const val = e.target.value === '' ? -1 : parseFloat(e.target.value);
                    options[meta.key] = val;
                    saveOption(meta.key, val);
                  }
                "
                type="text"
                :placeholder="$t('plugins.hocusfocus.aberrationInspectorOptions.autoPlaceholder')"
                class="w-full bg-gray-700 text-white p-2 rounded"
                :disabled="savingOptions.has(meta.key)"
              />
            </template>
            <template v-else-if="meta.type === 'number'">
              <label class="text-white mb-2 block">{{
                $t('plugins.hocusfocus.aberrationInspectorOptions.' + meta.labelKey)
              }}</label>
              <input
                :value="options[meta.key]"
                @change="
                  (e) => {
                    const val = parseFloat(e.target.value);
                    options[meta.key] = val;
                    saveOption(meta.key, val);
                  }
                "
                type="number"
                class="w-full bg-gray-700 text-white p-2 rounded"
                :disabled="savingOptions.has(meta.key)"
              />
            </template>
            <template v-else-if="meta.type === 'boolean'">
              <label class="flex items-center text-white">
                <input
                  :checked="options[meta.key]"
                  @change="
                    (e) => {
                      options[meta.key] = e.target.checked;
                      saveOption(meta.key, e.target.checked);
                    }
                  "
                  type="checkbox"
                  class="mr-3"
                  :disabled="savingOptions.has(meta.key)"
                />
                <span>{{
                  $t('plugins.hocusfocus.aberrationInspectorOptions.' + meta.labelKey)
                }}</span>
              </label>
            </template>
            <div v-if="optionErrors[meta.key]" class="text-red-400 text-xs mt-1">
              {{ optionErrors[meta.key] }}
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
          {{
            isResetting
              ? $t('plugins.hocusfocus.aberrationInspectorOptions.resetting')
              : $t('plugins.hocusfocus.aberrationInspectorOptions.resetToDefaults')
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import apiService from '@/services/apiService';

const isLoading = ref(false);
const error = ref(null);
const isResetting = ref(false);
const options = reactive({});
const savingOptions = ref(new Set());
const optionErrors = ref({});

// Curated set of inspector options surfaced in TNS.
// 'auto-number' options treat -1 as "auto" and render blank.
const inspectorOptionMeta = [
  { key: 'StepCount', type: 'auto-number', labelKey: 'stepCount' },
  { key: 'StepSize', type: 'auto-number', labelKey: 'stepSize' },
  { key: 'FramesPerPoint', type: 'auto-number', labelKey: 'framesPerPoint' },
  { key: 'SimpleExposureSeconds', type: 'auto-number', labelKey: 'simpleExposureSeconds' },
  {
    key: 'DetailedAnalysisExposureSeconds',
    type: 'auto-number',
    labelKey: 'detailedAnalysisExposureSeconds',
  },
  { key: 'TimeoutSeconds', type: 'auto-number', labelKey: 'timeoutSeconds' },
  { key: 'SignalAmplification', type: 'number', labelKey: 'signalAmplification' },
  { key: 'CenterFocuserBeforeRun', type: 'boolean', labelKey: 'centerFocuserBeforeRun' },
  { key: 'NumRegionsWide', type: 'number', labelKey: 'numRegionsWide' },
  { key: 'MicronsPerFocuserStep', type: 'auto-number', labelKey: 'micronsPerFocuserStep' },
  { key: 'SensorCurveModelEnabled', type: 'boolean', labelKey: 'sensorCurveModelEnabled' },
];

// Only render options the backend actually reports (older plugin versions may miss some)
const visibleOptionMeta = computed(() => inspectorOptionMeta.filter((m) => m.key in options));

// Load options from API
const loadOptions = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await apiService.hocusfocus.getAberrationInspectorOptions();
    if (response && typeof response === 'object') {
      Object.assign(options, response.options);
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
