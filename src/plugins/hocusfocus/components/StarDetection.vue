<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="store.isLoadingDetectionOptions" class="flex items-center justify-center py-12">
      <div class="spinner"></div>
      <p class="text-gray-400 ml-4">{{ $t('plugins.hocusfocus.starDetection.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-if="store.detectionOptionsError" class="bg-red-900 border border-red-700 rounded-lg p-4">
      <p class="text-red-200">
        <span class="font-semibold">{{ $t('plugins.hocusfocus.starDetection.error') }}</span>
        {{ store.detectionOptionsError }}
      </p>
      <button
        @click="loadStarDetectionOptions()"
        class="mt-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition"
      >
        {{ $t('plugins.hocusfocus.starDetection.retry') }}
      </button>
    </div>

    <!-- Options Form -->
    <div v-if="store.starDetectionOptions && !store.isLoadingDetectionOptions" class="space-y-6">
      <!-- General Settings Card -->
      <div class="border border-gray-700 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">
          {{ $t('plugins.hocusfocus.starDetection.generalSettings') }}
        </h3>
        <div class="space-y-3">
          <label class="flex items-center text-white">
            <input
              :checked="store.starDetectionOptions.UseAdvanced"
              @change="
                (e) => {
                  store.starDetectionOptions.UseAdvanced = e.target.checked;
                  saveStarDetectionOption('UseAdvanced', e.target.checked);
                }
              "
              type="checkbox"
              class="mr-3"
            />
            <span>{{ $t('plugins.hocusfocus.starDetection.advancedMode') }}</span>
          </label>
          <label class="flex items-center text-white">
            <input
              :checked="store.starDetectionOptions.HotpixelThresholdingEnabled"
              @change="
                (e) => {
                  store.starDetectionOptions.HotpixelThresholdingEnabled = e.target.checked;
                  saveStarDetectionOption('HotpixelThresholdingEnabled', e.target.checked);
                }
              "
              type="checkbox"
              class="mr-3"
            />
            <span>{{ $t('plugins.hocusfocus.starDetection.useHotpixelThresholding') }}</span>
          </label>
          <label class="flex items-center text-white">
            <input
              :checked="store.starDetectionOptions.UseAutoFocusCrop"
              @change="
                (e) => {
                  store.starDetectionOptions.UseAutoFocusCrop = e.target.checked;
                  saveStarDetectionOption('UseAutoFocusCrop', e.target.checked);
                }
              "
              type="checkbox"
              class="mr-3"
            />
            <span>{{ $t('plugins.hocusfocus.starDetection.useAutoFocusCrop') }}</span>
          </label>
          <label class="flex items-center text-white">
            <input
              :checked="store.starDetectionOptions.ModelPSF"
              @change="
                (e) => {
                  store.starDetectionOptions.ModelPSF = e.target.checked;
                  saveStarDetectionOption('ModelPSF', e.target.checked);
                }
              "
              type="checkbox"
              class="mr-3"
            />
            <span>{{ $t('plugins.hocusfocus.starDetection.fitPSF') }}</span>
          </label>
          <label class="flex items-center text-white">
            <input
              :checked="store.starDetectionOptions.HotpixelFiltering"
              @change="
                (e) => {
                  store.starDetectionOptions.HotpixelFiltering = e.target.checked;
                  saveStarDetectionOption('HotpixelFiltering', e.target.checked);
                }
              "
              type="checkbox"
              class="mr-3"
            />
            <span>{{ $t('plugins.hocusfocus.starDetection.hotpixelFiltering') }}</span>
          </label>
          <label class="flex items-center text-white">
            <input
              :checked="store.starDetectionOptions.StarMeasurementNoiseReductionEnabled"
              @change="
                (e) => {
                  store.starDetectionOptions.StarMeasurementNoiseReductionEnabled =
                    e.target.checked;
                  saveStarDetectionOption('StarMeasurementNoiseReductionEnabled', e.target.checked);
                }
              "
              type="checkbox"
              class="mr-3"
            />
            <span>{{ $t('plugins.hocusfocus.starDetection.noiseReducedStarMeasurement') }}</span>
          </label>
          <label class="flex items-center text-white">
            <input
              :checked="store.starDetectionOptions.DebugMode"
              @change="
                (e) => {
                  store.starDetectionOptions.DebugMode = e.target.checked;
                  saveStarDetectionOption('DebugMode', e.target.checked);
                }
              "
              type="checkbox"
              class="mr-3"
            />
            <span>{{ $t('plugins.hocusfocus.starDetection.debugMode') }}</span>
          </label>
        </div>
      </div>

      <!-- Simple Mode Settings -->
      <div
        v-if="!store.starDetectionOptions.UseAdvanced"
        class="border border-gray-700 rounded-lg p-4"
      >
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">
          {{ $t('plugins.hocusfocus.starDetection.simpleModeSettings') }}
        </h3>
        <div class="space-y-3">
          <div>
            <label class="text-white mb-2 block">{{
              $t('plugins.hocusfocus.starDetection.noiseLevel')
            }}</label>
            <select
              :value="store.starDetectionOptions.Simple_NoiseLevel"
              @change="
                (e) => {
                  store.starDetectionOptions.Simple_NoiseLevel = e.target.value;
                  saveStarDetectionOption('Simple_NoiseLevel', e.target.value);
                }
              "
              class="w-full bg-gray-700 text-white p-2 rounded"
            >
              <option>Typical</option>
              <option>None</option>
              <option>High</option>
              <option>Low</option>
            </select>
          </div>
          <div>
            <label class="text-white mb-2 block">Pixel Scale</label>
            <select
              :value="store.starDetectionOptions.Simple_PixelScale"
              @change="
                (e) => {
                  store.starDetectionOptions.Simple_PixelScale = e.target.value;
                  saveStarDetectionOption('Simple_PixelScale', e.target.value);
                }
              "
              class="w-full bg-gray-700 text-white p-2 rounded"
            >
              <option>Typical</option>
              <option>WideField</option>
              <option>LongFocalLength</option>
            </select>
          </div>
          <div>
            <label class="text-white mb-2 block">Focus Range</label>
            <select
              :value="store.starDetectionOptions.Simple_FocusRange"
              @change="
                (e) => {
                  store.starDetectionOptions.Simple_FocusRange = e.target.value;
                  saveStarDetectionOption('Simple_FocusRange', e.target.value);
                }
              "
              class="w-full bg-gray-700 text-white p-2 rounded"
            >
              <option>Typical</option>
              <option>WideRange</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Advanced Parameters Card -->
      <div
        v-if="store.starDetectionOptions.UseAdvanced"
        class="border border-gray-700 rounded-lg p-4"
      >
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">Basic Detection Parameters</h3>
        <div class="space-y-3">
          <div>
            <label class="text-white mb-2 block"
              >Noise Reduction Radius: {{ store.starDetectionOptions.NoiseReductionRadius }}</label
            >
            <input
              :value="store.starDetectionOptions.NoiseReductionRadius"
              @change="
                (e) => {
                  const num = parseInt(e.target.value);
                  store.starDetectionOptions.NoiseReductionRadius = num;
                  saveStarDetectionOption('NoiseReductionRadius', num);
                }
              "
              type="range"
              min="0"
              max="20"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Noise Clipping Multiplier:
              {{ store.starDetectionOptions.NoiseClippingMultiplier }}</label
            >
            <input
              :value="store.starDetectionOptions.NoiseClippingMultiplier"
              @change="
                (e) => {
                  const num = parseInt(e.target.value);
                  store.starDetectionOptions.NoiseClippingMultiplier = num;
                  saveStarDetectionOption('NoiseClippingMultiplier', num);
                }
              "
              type="range"
              min="0"
              max="20"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Star Clipping Multiplier:
              {{ store.starDetectionOptions.StarClippingMultiplier }}</label
            >
            <input
              :value="store.starDetectionOptions.StarClippingMultiplier"
              @change="
                (e) => {
                  const num = parseInt(e.target.value);
                  store.starDetectionOptions.StarClippingMultiplier = num;
                  saveStarDetectionOption('StarClippingMultiplier', num);
                }
              "
              type="range"
              min="0"
              max="20"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Structure Layers: {{ store.starDetectionOptions.StructureLayers }}</label
            >
            <input
              :value="store.starDetectionOptions.StructureLayers"
              @change="
                (e) => {
                  const num = parseFloat(e.target.value);
                  store.starDetectionOptions.StructureLayers = num;
                  saveStarDetectionOption('StructureLayers', num);
                }
              "
              type="range"
              min="1"
              max="10"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Brightness Sensitivity:
              {{ store.starDetectionOptions.BrightnessSensitivity.toFixed(2) }}</label
            >
            <input
              :value="store.starDetectionOptions.BrightnessSensitivity"
              @change="
                (e) => {
                  const num = parseFloat(e.target.value);
                  store.starDetectionOptions.BrightnessSensitivity = num;
                  saveStarDetectionOption('BrightnessSensitivity', num);
                }
              "
              type="range"
              min="0"
              max="20"
              step="0.01"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Star Detection Parameters Card -->
      <div
        v-if="store.starDetectionOptions.UseAdvanced"
        class="border border-gray-700 rounded-lg p-4"
      >
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">Star Detection Parameters</h3>
        <div class="space-y-3">
          <div>
            <label class="text-white mb-2 block"
              >Max Distortion: {{ store.starDetectionOptions.MaxDistortion.toFixed(2) }}</label
            >
            <input
              :value="store.starDetectionOptions.MaxDistortion"
              @change="
                (e) => {
                  const num = parseFloat(e.target.value);
                  store.starDetectionOptions.MaxDistortion = num;
                  saveStarDetectionOption('MaxDistortion', num);
                }
              "
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Star Peak Response:
              {{ store.starDetectionOptions.StarPeakResponse.toFixed(2) }}</label
            >
            <input
              :value="store.starDetectionOptions.StarPeakResponse"
              @change="
                (e) => {
                  const num = parseFloat(e.target.value);
                  store.starDetectionOptions.StarPeakResponse = num;
                  saveStarDetectionOption('StarPeakResponse', num);
                }
              "
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Star Center Tolerance:
              {{ store.starDetectionOptions.StarCenterTolerance.toFixed(2) }}</label
            >
            <input
              :value="store.starDetectionOptions.StarCenterTolerance"
              @change="
                (e) => {
                  const num = parseFloat(e.target.value);
                  store.starDetectionOptions.StarCenterTolerance = num;
                  saveStarDetectionOption('StarCenterTolerance', num);
                }
              "
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Star Background Box Expansion:
              {{ store.starDetectionOptions.StarBackgroundBoxExpansion }}</label
            >
            <input
              :value="store.starDetectionOptions.StarBackgroundBoxExpansion"
              @change="
                (e) => {
                  const num = parseInt(e.target.value);
                  store.starDetectionOptions.StarBackgroundBoxExpansion = num;
                  saveStarDetectionOption('StarBackgroundBoxExpansion', num);
                }
              "
              type="range"
              min="1"
              max="20"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Min Star Bounding Box Size:
              {{ store.starDetectionOptions.MinStarBoundingBoxSize }}</label
            >
            <input
              :value="store.starDetectionOptions.MinStarBoundingBoxSize"
              @change="
                (e) => {
                  const num = parseInt(e.target.value);
                  store.starDetectionOptions.MinStarBoundingBoxSize = num;
                  saveStarDetectionOption('MinStarBoundingBoxSize', num);
                }
              "
              type="range"
              min="1"
              max="50"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Min HFR: {{ store.starDetectionOptions.MinHFR.toFixed(2) }}</label
            >
            <input
              :value="store.starDetectionOptions.MinHFR"
              @change="
                (e) => {
                  const num = parseFloat(e.target.value);
                  store.starDetectionOptions.MinHFR = num;
                  saveStarDetectionOption('MinHFR', num);
                }
              "
              type="range"
              min="0"
              max="10"
              step="0.1"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Structure Dilation Size:
              {{ store.starDetectionOptions.StructureDilationSize }}</label
            >
            <input
              :value="store.starDetectionOptions.StructureDilationSize"
              @change="
                (e) => {
                  const num = parseInt(e.target.value);
                  store.starDetectionOptions.StructureDilationSize = num;
                  saveStarDetectionOption('StructureDilationSize', num);
                }
              "
              type="range"
              min="3"
              max="30"
              step="1"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Structure Dilation Count:
              {{ store.starDetectionOptions.StructureDilationCount }}</label
            >
            <input
              :value="store.starDetectionOptions.StructureDilationCount"
              @change="
                (e) => {
                  const num = parseInt(e.target.value);
                  store.starDetectionOptions.StructureDilationCount = num;
                  saveStarDetectionOption('StructureDilationCount', num);
                }
              "
              type="range"
              min="0"
              max="10"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Pixel Sample Size: {{ store.starDetectionOptions.PixelSampleSize }}</label
            >
            <input
              :value="store.starDetectionOptions.PixelSampleSize"
              @change="
                (e) => {
                  const num = parseFloat(e.target.value);
                  store.starDetectionOptions.PixelSampleSize = num;
                  saveStarDetectionOption('PixelSampleSize', num);
                }
              "
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- PSF Settings Card -->
      <div
        v-if="store.starDetectionOptions.ModelPSF && store.starDetectionOptions.UseAdvanced"
        class="border border-gray-700 rounded-lg p-4"
      >
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">PSF Settings</h3>
        <div class="space-y-3">
          <div>
            <label class="text-white mb-2 block">PSF Type</label>
            <select
              :value="store.starDetectionOptions.PSFFitType"
              @change="
                (e) => {
                  store.starDetectionOptions.PSFFitType = e.target.value;
                  saveStarDetectionOption('PSFFitType', e.target.value);
                }
              "
              class="w-full bg-gray-700 text-white p-2 rounded"
            >
              <option>Moffat_40</option>
              <option>Gaussian</option>
            </select>
          </div>
          <div>
            <label class="text-white mb-2 block"
              >PSF Resolution: {{ store.starDetectionOptions.PSFResolution }}</label
            >
            <input
              :value="store.starDetectionOptions.PSFResolution"
              @change="
                (e) => {
                  const num = parseInt(e.target.value);
                  store.starDetectionOptions.PSFResolution = num;
                  saveStarDetectionOption('PSFResolution', num);
                }
              "
              type="range"
              min="0"
              max="30"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >PSF Parallel Partition Size:
              {{ store.starDetectionOptions.PSFParallelPartitionSize }}</label
            >
            <input
              :value="store.starDetectionOptions.PSFParallelPartitionSize"
              @change="
                (e) => {
                  const num = parseInt(e.target.value);
                  store.starDetectionOptions.PSFParallelPartitionSize = num;
                  saveStarDetectionOption('PSFParallelPartitionSize', num);
                }
              "
              type="range"
              min="0"
              max="2000"
              step="10"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >PSF Fit Threshold: {{ store.starDetectionOptions.PSFFitThreshold.toFixed(2) }}</label
            >
            <input
              :value="store.starDetectionOptions.PSFFitThreshold"
              @change="
                (e) => {
                  const num = parseFloat(e.target.value);
                  store.starDetectionOptions.PSFFitThreshold = num;
                  saveStarDetectionOption('PSFFitThreshold', num);
                }
              "
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              class="w-full"
            />
          </div>
          <label class="flex items-center text-white">
            <input
              :checked="store.starDetectionOptions.UsePSFAbsoluteDeviation"
              @change="
                (e) => {
                  store.starDetectionOptions.UsePSFAbsoluteDeviation = e.target.checked;
                  saveStarDetectionOption('UsePSFAbsoluteDeviation', e.target.checked);
                }
              "
              type="checkbox"
              class="mr-3"
            />
            <span>PSF MAD Fitting</span>
          </label>
        </div>
      </div>

      <!-- Hotpixel Settings Card -->
      <div
        v-if="store.starDetectionOptions.UseAdvanced"
        class="border border-gray-700 rounded-lg p-4"
      >
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">Hotpixel Settings</h3>
        <div class="space-y-3">
          <div
            v-if="
              store.starDetectionOptions.HotpixelThresholdingEnabled &&
              store.starDetectionOptions.UseAdvanced
            "
          >
            <label class="text-white mb-2 block"
              >Hotpixel Threshold:
              {{ store.starDetectionOptions.HotpixelThreshold.toFixed(3) }}</label
            >
            <input
              :value="store.starDetectionOptions.HotpixelThreshold"
              @change="
                (e) => {
                  const num = parseFloat(e.target.value);
                  store.starDetectionOptions.HotpixelThreshold = num;
                  saveStarDetectionOption('HotpixelThreshold', num);
                }
              "
              type="range"
              min="0.01"
              max="1.0"
              step="0.001"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-white mb-2 block"
              >Saturation Threshold:
              {{ store.starDetectionOptions.SaturationThreshold.toFixed(2) }}</label
            >
            <input
              :value="store.starDetectionOptions.SaturationThreshold"
              @change="
                (e) => {
                  const num = parseFloat(e.target.value);
                  store.starDetectionOptions.SaturationThreshold = num;
                  saveStarDetectionOption('SaturationThreshold', num);
                }
              "
              type="range"
              min="0.01"
              max="1.0"
              step="0.001"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Star Measurement Settings Card -->
      <div
        v-if="store.starDetectionOptions.UseAdvanced"
        class="border border-gray-700 rounded-lg p-4"
      >
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">Star Measurement</h3>
        <div class="space-y-3">
          <div>
            <label class="text-white mb-2 block">Measurement Average Method</label>
            <select
              :value="store.starDetectionOptions.MeasurementAverage"
              @change="
                (e) => {
                  store.starDetectionOptions.MeasurementAverage = e.target.value;
                  saveStarDetectionOption('MeasurementAverage', e.target.value);
                }
              "
              class="w-full bg-gray-700 text-white p-2 rounded"
            >
              <option>Median</option>
              <option>MeanOutliers</option>
            </select>
          </div>
        </div>
      </div>

      <!-- File Settings Card -->
      <div class="border border-gray-700 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-cyan-400 mb-4">File Settings</h3>
        <div class="space-y-3">
          <label class="flex items-center text-white">
            <input
              :checked="store.starDetectionOptions.SaveIntermediateImages"
              @change="
                (e) => {
                  store.starDetectionOptions.SaveIntermediateImages = e.target.checked;
                  saveStarDetectionOption('SaveIntermediateImages', e.target.checked);
                }
              "
              type="checkbox"
              class="mr-3"
            />
            <span>Save Intermediate Images</span>
          </label>
          <div v-if="store.starDetectionOptions.SaveIntermediateImages">
            <label class="text-white mb-2 block">Intermediate Save Path</label>
            <input
              :value="store.starDetectionOptions.IntermediateSavePath"
              @change="
                (e) => {
                  store.starDetectionOptions.IntermediateSavePath = e.target.value;
                  saveStarDetectionOption('IntermediateSavePath', e.target.value);
                }
              "
              type="text"
              class="w-full bg-gray-700 text-white p-2 rounded"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-start">
        <button
          @click="showDetectionResetConfirmation = true"
          :disabled="store.isLoadingDetectionOptions"
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white rounded font-semibold transition"
        >
          Reset to Defaults
        </button>
      </div>
    </div>

    <!-- Detection Reset Confirmation Dialog -->
    <div
      v-if="showDetectionResetConfirmation"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-sm mx-4">
        <h3 class="text-lg font-semibold text-white mb-4">Reset Star Detection Options</h3>

        <p class="text-sm text-gray-300 mb-6">
          Are you sure you want to reset all Star Detection options to their defaults? This action
          cannot be undone.
        </p>

        <div class="flex gap-3">
          <button
            @click="showDetectionResetConfirmation = false"
            class="flex-1 py-2 px-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            @click="executeDetectionResetDefaults()"
            :disabled="isResettingDetectionOptions"
            class="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isResettingDetectionOptions ? 'Resetting...' : 'Reset' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useHocusFocusStore } from '../store/hocusfocusStore';
import apiService from '@/services/apiService';

const store = useHocusFocusStore();
const showDetectionResetConfirmation = ref(false);
const isResettingDetectionOptions = ref(false);
const savingOptions = ref(new Set());
const optionErrors = ref({});

const props = defineProps({
  isTabActive: {
    type: Boolean,
    default: false,
  },
});

const loadStarDetectionOptions = async () => {
  await store.loadStarDetectionOptions();
};

// Save individual Star Detection option
const saveStarDetectionOption = async (optionName, newValue) => {
  try {
    savingOptions.value.add(optionName);
    optionErrors.value[optionName] = null;

    console.log(`[StarDetection] Saving ${optionName}: ${newValue}`);
    // Update the store option first
    store.starDetectionOptions[optionName] = newValue;

    // Send individual option to backend
    const response = await apiService.hocusfocus.setStarDetectionOption(optionName, newValue);

    if (response.success || response.message) {
      console.log(`[StarDetection] ${optionName} saved successfully`);
    } else {
      optionErrors.value[optionName] = response.error || 'Failed to save option';
    }
  } catch (err) {
    console.error(`[StarDetection] Error saving ${optionName}:`, err);
    optionErrors.value[optionName] = err.message || 'Failed to save option';
  } finally {
    savingOptions.value.delete(optionName);
  }
};

const executeDetectionResetDefaults = async () => {
  try {
    isResettingDetectionOptions.value = true;
    const response = await store.resetStarDetectionDefaults();

    if (response && response.success) {
      showDetectionResetConfirmation.value = false;
      console.log('[StarDetection] Options reset successfully');
    } else if (response && response.message) {
      console.log('[StarDetection] Reset response:', response.message);
      showDetectionResetConfirmation.value = false;
    } else {
      throw new Error('Reset failed');
    }
  } catch (err) {
    console.error('[StarDetection] Error resetting options:', err);
    alert(`Failed to reset options: ${err.message}`);
  } finally {
    isResettingDetectionOptions.value = false;
  }
};

// Load options when tab becomes active
watch(
  () => props.isTabActive,
  async (isActive) => {
    if (isActive) {
      console.log('[StarDetection] Tab activated - loading options');
      await loadStarDetectionOptions();
    }
  },
  { immediate: true }
);
</script>
