<template>
  <div class="min-h-screen bg-gray-900">
    <div class="container py-10">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-white mb-2">HocusFocus</h1>
          <p class="text-gray-400 text-sm">{{ store.pluginInfo.description }}</p>
        </div>

        <!-- Tabs Navigation -->
        <div class="border border-gray-700 rounded-lg bg-gray-800">
          <div class="flex border-b border-gray-700">
            <button
              @click="activeTab = 'aberration'"
              :class="
                activeTab === 'aberration'
                  ? 'border-b-2 border-cyan-400 text-white'
                  : 'text-gray-400 hover:text-white'
              "
              class="px-6 py-3 font-semibold transition"
            >
              Aberration Inspector
            </button>
            <button
              @click="activeTab = 'configuration'"
              :class="
                activeTab === 'configuration'
                  ? 'border-b-2 border-cyan-400 text-white'
                  : 'text-gray-400 hover:text-white'
              "
              class="px-6 py-3 font-semibold transition"
            >
              Configuration
            </button>
            <button
              @click="activeTab = 'star-annotator'"
              :class="
                activeTab === 'star-annotator'
                  ? 'border-b-2 border-cyan-400 text-white'
                  : 'text-gray-400 hover:text-white'
              "
              class="px-6 py-3 font-semibold transition"
            >
              Star Annotator
            </button>
            <button
              @click="activeTab = 'star-detection'"
              :class="
                activeTab === 'star-detection'
                  ? 'border-b-2 border-cyan-400 text-white'
                  : 'text-gray-400 hover:text-white'
              "
              class="px-6 py-3 font-semibold transition"
            >
              Star Detection
            </button>
          </div>

          <!-- Aberration Inspector Tab -->
          <div v-if="activeTab === 'aberration'" class="p-6 space-y-6">
            <!-- AutoFocus Action Buttons -->
            <div>
              <h2 class="text-xl font-semibold text-white mb-4">AutoFocus Actions</h2>
              <div class="flex flex-wrap gap-3 mb-6">
                <button
                  @click="canRunAutoFocus ? runDetailedAutoFocus() : stopDetailedAutoFocus()"
                  :disabled="
                    !store.cameraConnected || !store.focuserConnected || store.isCancelling
                  "
                  :class="
                    !canRunAutoFocus && store.cameraConnected && store.focuserConnected
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  "
                  class="px-6 py-2 rounded disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium transition"
                >
                  {{
                    !canRunAutoFocus && store.cameraConnected && store.focuserConnected
                      ? 'Cancel AutoFocus'
                      : 'Run Detailed AutoFocus'
                  }}
                </button>
              </div>
            </div>

            <!-- Chart -->
            <div v-if="autoFocusChartActive">
              <h2 class="text-xl font-semibold text-white mb-4">Focus Curve Analysis</h2>
              <div class="border border-gray-700 rounded-lg bg-gray-900 p-6">
                <canvas ref="focusCurveChart" class="w-full h-96"></canvas>
              </div>
            </div>

            <!-- Final Focus Data Summary -->
            <div
              class="border border-gray-700 rounded-lg bg-gray-900 p-6 space-y-4"
              v-if="autoFocusCompleted"
            >
              <div>
                <p class="text-white">
                  <span class="text-gray-400">Backfocus Error: </span>
                  <span class="font-semibold">
                    {{
                      finalFocusData?.BackfocusMicronDelta !== null &&
                      finalFocusData?.BackfocusMicronDelta !== undefined &&
                      finalFocusData?.BackfocusMicronDelta !== 'NaN' &&
                      !isNaN(finalFocusData?.BackfocusMicronDelta)
                        ? `${Math.abs(parseFloat(finalFocusData.BackfocusMicronDelta)).toFixed(2)} µm`
                        : `${Math.abs(Math.round(parseFloat(finalFocusData?.BackfocusFocuserPositionDelta))).toString()} steps`
                    }}
                  </span>
                  <span class="text-gray-400 ml-2">(Move sensor</span>
                  <span class="font-semibold ml-1">{{
                    finalFocusData?.BackfocusDirection || '--'
                  }}</span>
                  <span class="text-gray-400"> flattener)</span>
                </p>
              </div>

              <div>
                <p class="text-white">
                  <span class="text-gray-400">HFR difference: </span>
                  <span class="font-semibold">{{ formatValue(finalFocusData?.BackfocusHFR) }}</span>
                </p>
              </div>

              <div>
                <p class="text-white">
                  <span class="text-gray-400">Inner HFR: </span>
                  <span class="font-semibold">{{ formatValue(finalFocusData?.InnerHFR) }}</span>
                  <span class="text-gray-400 ml-4">Outer HFR: </span>
                  <span class="font-semibold">{{ formatValue(finalFocusData?.OuterHFR) }}</span>
                </p>
              </div>
            </div>

            <!-- Tilt Corner Measurements Table -->
            <div v-if="autoFocusCompleted">
              <h2 class="text-xl font-semibold text-white mb-4">Tilt Corner Measurements</h2>
              <div class="border border-gray-700 rounded-lg bg-gray-900 p-6 overflow-x-auto">
                <table class="w-full text-sm text-gray-300">
                  <thead>
                    <tr class="border-b border-gray-700">
                      <th class="px-4 py-3 text-left font-semibold text-white">Sensor Side</th>
                      <th class="px-4 py-3 text-left font-semibold text-white">Focuser Position</th>
                      <th class="px-4 py-3 text-left font-semibold text-white">Adjustment Steps</th>
                      <th class="px-4 py-3 text-left font-semibold text-white">
                        Adjustment Microns
                      </th>
                      <th class="px-4 py-3 text-left font-semibold text-white">R²</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(measurement, idx) in tiltMeasurements"
                      :key="idx"
                      class="border-b border-gray-700 hover:bg-gray-800"
                    >
                      <td class="px-4 py-3">{{ measurement.sensorSide || '--' }}</td>
                      <td class="px-4 py-3">{{ formatInteger(measurement.focuserPosition) }}</td>
                      <td class="px-4 py-3">
                        {{ formatInteger(measurement.adjustmentRequiredSteps) }}
                      </td>
                      <td class="px-4 py-3">
                        {{ formatValue(measurement.adjustmentRequiredMicrons) }}
                      </td>
                      <td class="px-4 py-3">{{ formatValue(measurement.rSquared) }}</td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="tiltMeasurements.length === 0" class="text-center py-8 text-gray-400">
                  No tilt corner measurements available
                </div>
              </div>
            </div>

            <!-- Tilt Measurement History Table -->
            <div v-if="autoFocusChartActivatedOnce">
              <h2 class="text-xl font-semibold text-white mb-4">Tilt Measurement History</h2>
              <div class="border border-gray-700 rounded-lg bg-gray-900 p-6 overflow-x-auto">
                <table class="w-full text-sm text-gray-300">
                  <thead>
                    <tr class="border-b border-gray-700">
                      <th class="px-4 py-3 text-left font-semibold text-white">ID</th>
                      <th class="px-4 py-3 text-left font-semibold text-white">TopLeft Steps</th>
                      <th class="px-4 py-3 text-left font-semibold text-white">TopRight Steps</th>
                      <th class="px-4 py-3 text-left font-semibold text-white">BottomLeft Steps</th>
                      <th class="px-4 py-3 text-left font-semibold text-white">
                        BottomRight Steps
                      </th>
                      <th class="px-4 py-3 text-left font-semibold text-white">Backfocus Steps</th>
                      <th class="px-4 py-3 text-left font-semibold text-white">Center R²</th>
                      <th class="px-4 py-3 text-left font-semibold text-white">TopLeft R²</th>
                      <th class="px-4 py-3 text-left font-semibold text-white">TopRight R²</th>
                      <th class="px-4 py-3 text-left font-semibold text-white">BottomLeft R²</th>
                      <th class="px-4 py-3 text-left font-semibold text-white">BottomRight R²</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="history in [...tiltMeasurementHistory].reverse()"
                      :key="history.historyId"
                      class="border-b border-gray-700 hover:bg-gray-800"
                    >
                      <td class="px-4 py-3">{{ history.historyId || '--' }}</td>
                      <td class="px-4 py-3">{{ formatInteger(history.topleftAdjustmentSteps) }}</td>
                      <td class="px-4 py-3">
                        {{ formatInteger(history.toprightAdjustmentSteps) }}
                      </td>
                      <td class="px-4 py-3">
                        {{ formatInteger(history.bottomleftAdjustmentSteps) }}
                      </td>
                      <td class="px-4 py-3">
                        {{ formatInteger(history.bottomrightAdjustmentSteps) }}
                      </td>
                      <td class="px-4 py-3">{{ formatInteger(history.backfocusSteps) }}</td>
                      <td class="px-4 py-3">{{ formatValue(history.centerRSquared) }}</td>
                      <td class="px-4 py-3">{{ formatValue(history.topleftRSquared) }}</td>
                      <td class="px-4 py-3">{{ formatValue(history.toprightRSquared) }}</td>
                      <td class="px-4 py-3">{{ formatValue(history.bottomleftRSquared) }}</td>
                      <td class="px-4 py-3">{{ formatValue(history.bottomrightRSquared) }}</td>
                    </tr>
                  </tbody>
                </table>
                <div
                  v-if="tiltMeasurementHistory.length === 0"
                  class="text-center py-8 text-gray-400"
                >
                  No tilt measurement history available
                </div>
              </div>
            </div>
          </div>

          <!-- Configuration Tab -->
          <div v-if="activeTab === 'configuration'" class="p-6 space-y-6"></div>

          <!-- Star Annotator Tab -->
          <div v-if="activeTab === 'star-annotator'" class="p-6 space-y-6">
            <!-- Loading State -->
            <div v-if="store.isLoadingOptions" class="flex items-center justify-center py-12">
              <div class="spinner"></div>
              <p class="text-gray-400 ml-4">Loading Star Annotator options...</p>
            </div>

            <!-- Error State -->
            <div v-if="store.optionsError" class="bg-red-900 border border-red-700 rounded-lg p-4">
              <p class="text-red-200">
                <span class="font-semibold">Error:</span> {{ store.optionsError }}
              </p>
              <button
                @click="loadStarAnnotatorOptions()"
                class="mt-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition"
              >
                Retry
              </button>
            </div>

            <!-- Options Form -->
            <div v-if="store.starAnnotatorOptions && !store.isLoadingOptions" class="space-y-6">
              <!-- Display Settings Section -->
              <div class="border border-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-cyan-400 mb-4">Display Settings</h3>
                <div class="space-y-3">
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starAnnotatorOptions.ShowAnnotations"
                      type="checkbox"
                      class="mr-3"
                    />
                    Show Annotations
                  </label>
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starAnnotatorOptions.ShowAllStars"
                      type="checkbox"
                      class="mr-3"
                    />
                    Show All Stars
                  </label>
                  <div>
                    <label class="text-white mb-2 block"
                      >Max Stars: {{ store.starAnnotatorOptions.MaxStars }}</label
                    >
                    <input
                      v-model.number="store.starAnnotatorOptions.MaxStars"
                      type="range"
                      min="1"
                      max="500"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="text-white mb-2 block"
                      >Font Size: {{ store.starAnnotatorOptions.AnnotationFontSizePoints }}</label
                    >
                    <input
                      v-model.number="store.starAnnotatorOptions.AnnotationFontSizePoints"
                      type="range"
                      min="8"
                      max="50"
                      step="0.5"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>

              <!-- Star Bounds Section -->
              <div class="border border-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-cyan-400 mb-4">Star Bounds</h3>
                <div class="space-y-3">
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starAnnotatorOptions.ShowStarBounds"
                      type="checkbox"
                      class="mr-3"
                    />
                    Show Star Bounds
                  </label>
                  <div>
                    <label class="text-white mb-2 block">Bounds Type</label>
                    <select
                      v-model="store.starAnnotatorOptions.StarBoundsType"
                      class="w-full bg-gray-700 text-white p-2 rounded"
                    >
                      <option>Ellipse</option>
                      <option>Box</option>
                      <option>PSF</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Annotation Settings Section -->
              <div class="border border-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-cyan-400 mb-4">Annotation Settings</h3>
                <div class="space-y-3">
                  <div>
                    <label class="text-white mb-2 block">Annotation Type</label>
                    <select
                      v-model="store.starAnnotatorOptions.ShowAnnotationType"
                      class="w-full bg-gray-700 text-white p-2 rounded"
                    >
                      <option>None</option>
                      <option>HFR</option>
                      <option>FWHM</option>
                      <option>FWHM_X</option>
                      <option>FWHM_Y</option>
                      <option>FWHMPixels</option>
                      <option>Eccentricity</option>
                      <option>PSFTheta</option>
                      <option>Background</option>
                      <option>PSFBackground</option>
                      <option>PSFPeak</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-white mb-2 block">Font Family</label>
                    <input
                      v-model="store.starAnnotatorOptions.AnnotationFontFamily"
                      type="text"
                      class="w-full bg-gray-700 text-white p-2 rounded"
                      placeholder="Arial"
                    />
                  </div>
                </div>
              </div>

              <!-- Quality Indicators Section -->
              <div class="border border-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-cyan-400 mb-4">Quality Indicators</h3>
                <div class="grid grid-cols-2 gap-4">
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starAnnotatorOptions.ShowTooFlat"
                      type="checkbox"
                      class="mr-3"
                    />
                    Show Too Flat
                  </label>
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starAnnotatorOptions.ShowSaturated"
                      type="checkbox"
                      class="mr-3"
                    />
                    Show Saturated
                  </label>
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starAnnotatorOptions.ShowLowSensitivity"
                      type="checkbox"
                      class="mr-3"
                    />
                    Show Low Sensitivity
                  </label>
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starAnnotatorOptions.ShowNotCentered"
                      type="checkbox"
                      class="mr-3"
                    />
                    Show Not Centered
                  </label>
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starAnnotatorOptions.ShowDegenerate"
                      type="checkbox"
                      class="mr-3"
                    />
                    Show Degenerate
                  </label>
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starAnnotatorOptions.ShowTooDistorted"
                      type="checkbox"
                      class="mr-3"
                    />
                    Show Too Distorted
                  </label>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3">
                <button
                  @click="saveStarAnnotatorOptions()"
                  :disabled="store.isLoadingOptions"
                  class="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-semibold transition"
                >
                  Save Options
                </button>
                <button
                  @click="showAnnotationResetConfirmation = true"
                  :disabled="store.isLoadingOptions"
                  class="flex-1 px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white rounded font-semibold transition"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>

          <!-- Annotation Reset Confirmation Dialog -->
          <div
            v-if="showAnnotationResetConfirmation"
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-sm mx-4">
              <h3 class="text-lg font-semibold text-white mb-4">Reset Star Annotation Options</h3>

              <p class="text-sm text-gray-300 mb-6">
                Are you sure you want to reset all Star Annotation options to their defaults? This
                action cannot be undone.
              </p>

              <div class="flex gap-3">
                <button
                  @click="showAnnotationResetConfirmation = false"
                  class="flex-1 py-2 px-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  @click="executeAnnotationResetDefaults()"
                  :disabled="isResettingAnnotationOptions"
                  class="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isResettingAnnotationOptions ? 'Resetting...' : 'Reset' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Star Detection Tab -->
          <div v-if="activeTab === 'star-detection'" class="p-6 space-y-6">
            <!-- Loading State -->
            <div
              v-if="store.isLoadingDetectionOptions"
              class="flex items-center justify-center py-12"
            >
              <div class="spinner"></div>
              <p class="text-gray-400 ml-4">Loading Star Detection options...</p>
            </div>

            <!-- Error State -->
            <div
              v-if="store.detectionOptionsError"
              class="bg-red-900 border border-red-700 rounded-lg p-4"
            >
              <p class="text-red-200">
                <span class="font-semibold">Error:</span> {{ store.detectionOptionsError }}
              </p>
              <button
                @click="loadStarDetectionOptions()"
                class="mt-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition"
              >
                Retry
              </button>
            </div>

            <!-- Options Form (Abbreviated for Tab Compatibility) -->
            <div
              v-if="store.starDetectionOptions && !store.isLoadingDetectionOptions"
              class="space-y-6"
            >
              <!-- General Settings -->
              <div class="border border-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-cyan-400 mb-4">General Settings</h3>
                <div class="space-y-3">
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starDetectionOptions.UseAdvanced"
                      type="checkbox"
                      class="mr-3"
                    />
                    Advanced Mode
                  </label>
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starDetectionOptions.ModelPSF"
                      type="checkbox"
                      class="mr-3"
                    />
                    Model PSF
                  </label>
                </div>
              </div>

              <!-- Simple Mode Settings -->
              <div
                v-if="!store.starDetectionOptions.UseAdvanced"
                class="border border-gray-700 rounded-lg p-4"
              >
                <h3 class="text-lg font-semibold text-cyan-400 mb-4">Simple Mode Settings</h3>
                <div class="space-y-3">
                  <div>
                    <label class="text-white mb-2 block">Noise Level</label>
                    <select
                      v-model="store.starDetectionOptions.SimpleNoiseLevel"
                      class="w-full bg-gray-700 text-white p-2 rounded"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-white mb-2 block">Pixel Scale</label>
                    <select
                      v-model="store.starDetectionOptions.SimplePixelScale"
                      class="w-full bg-gray-700 text-white p-2 rounded"
                    >
                      <option>VerySmall</option>
                      <option>Small</option>
                      <option>Medium</option>
                      <option>Large</option>
                      <option>VeryLarge</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-white mb-2 block">Focus Range</label>
                    <select
                      v-model="store.starDetectionOptions.SimpleFocusRange"
                      class="w-full bg-gray-700 text-white p-2 rounded"
                    >
                      <option>Narrow</option>
                      <option>Normal</option>
                      <option>Wide</option>
                      <option>VeryWide</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Advanced Parameters -->
              <div
                v-if="store.starDetectionOptions.UseAdvanced"
                class="border border-gray-700 rounded-lg p-4"
              >
                <h3 class="text-lg font-semibold text-cyan-400 mb-4">Detection Parameters</h3>
                <div class="space-y-3">
                  <div>
                    <label class="text-white mb-2 block"
                      >Noise Reduction Radius:
                      {{ store.starDetectionOptions.NoiseReductionRadius }}</label
                    >
                    <input
                      v-model.number="store.starDetectionOptions.NoiseReductionRadius"
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
                      v-model.number="store.starDetectionOptions.StructureLayers"
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
                      v-model.number="store.starDetectionOptions.BrightnessSensitivity"
                      type="range"
                      min="0"
                      max="2"
                      step="0.01"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="text-white mb-2 block"
                      >Max Distortion:
                      {{ store.starDetectionOptions.MaxDistortion.toFixed(2) }}</label
                    >
                    <input
                      v-model.number="store.starDetectionOptions.MaxDistortion"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>

              <!-- Hotpixel Settings -->
              <div class="border border-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-cyan-400 mb-4">Hotpixel Settings</h3>
                <div class="space-y-3">
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starDetectionOptions.HotpixelFiltering"
                      type="checkbox"
                      class="mr-3"
                    />
                    Enable Hotpixel Filtering
                  </label>
                  <label class="flex items-center text-white">
                    <input
                      v-model="store.starDetectionOptions.HotpixelThresholdingEnabled"
                      type="checkbox"
                      class="mr-3"
                    />
                    Enable Hotpixel Thresholding
                  </label>
                  <div v-if="store.starDetectionOptions.HotpixelThresholdingEnabled">
                    <label class="text-white mb-2 block"
                      >Hotpixel Threshold:
                      {{ store.starDetectionOptions.HotpixelThreshold.toFixed(2) }}</label
                    >
                    <input
                      v-model.number="store.starDetectionOptions.HotpixelThreshold"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3">
                <button
                  @click="saveStarDetectionOptions()"
                  :disabled="store.isLoadingDetectionOptions"
                  class="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-semibold transition"
                >
                  Save Options
                </button>
                <button
                  @click="showDetectionResetConfirmation = true"
                  :disabled="store.isLoadingDetectionOptions"
                  class="flex-1 px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white rounded font-semibold transition"
                >
                  Reset to Defaults
                </button>
              </div>
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
                Are you sure you want to reset all Star Detection options to their defaults? This
                action cannot be undone.
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import Chart from 'chart.js/auto';
import { useHocusFocusStore } from '../store/hocusfocusStore';
import apiService from '@/services/apiService';

const store = useHocusFocusStore();
const activeTab = ref('aberration');
const focusCurveChart = ref(null);
const tiltMeasurements = ref([]);
const tiltMeasurementHistory = ref([]);
const finalFocusData = ref(null);
const autoFocusCompleted = ref(false);
const autoFocusChartActive = ref(false);
const autoFocusChartActivatedOnce = ref(false);
const showAnnotationResetConfirmation = ref(false);
const showDetectionResetConfirmation = ref(false);
const isResettingAnnotationOptions = ref(false);
const isResettingDetectionOptions = ref(false);

// Compute canRunAutoFocus from backend status - source of truth
const backendCanRun = ref(true);
const canRunAutoFocus = computed(() => {
  return (
    store.cameraConnected && store.focuserConnected && backendCanRun.value && !store.isCancelling
  );
});

let chartInstance = null;
let pollingActive = false;

// Format NaN values
const formatValue = (value) => {
  if (value === null || value === undefined || isNaN(value) || value === 'NaN') {
    return '--';
  }
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return value;
};

// Format as integer (round to whole number)
const formatInteger = (value) => {
  if (value === null || value === undefined || isNaN(value) || value === 'NaN') {
    return '--';
  }
  if (typeof value === 'number') {
    return Math.round(value).toString();
  }
  return value;
};

// Fetch and update tilt corner measurements
const updateTiltMeasurements = async () => {
  try {
    console.log('[TiltMeasurements] Fetching data...');
    const data = await apiService.hocusfocus.getTiltCornerMeasurements();
    console.log('[TiltMeasurements] Data received:', data);
    if (data && data.tiltCornerMeasurements) {
      tiltMeasurements.value = data.tiltCornerMeasurements;
    }
  } catch (err) {
    console.error('Error fetching tilt measurements:', err);
  }
};

// Fetch and update tilt measurement history
const updateTiltMeasurementHistory = async () => {
  try {
    console.log('[TiltHistory] Fetching data...');
    const data = await apiService.hocusfocus.getTiltMeasurementHistory();
    console.log('[TiltHistory] Data received:', data);
    if (data && data.tiltMeasurementHistory) {
      tiltMeasurementHistory.value = data.tiltMeasurementHistory;
    }
  } catch (err) {
    console.error('Error fetching tilt measurement history:', err);
  }
};

// Fetch and update final focus data
const updateFinalFocusData = async () => {
  try {
    console.log('[FinalFocus] Fetching data...');
    const data = await apiService.hocusfocus.getFinalFocusData();
    console.log('[FinalFocus] Data received:', data);
    if (data && data.RegionFinalFocusPoints) {
      finalFocusData.value = data;
    }
  } catch (err) {
    console.error('Error fetching final focus data:', err);
  }
};

// Convert final focus points from API format to chart format
const convertFinalFocusPointsToChartFormat = (regionFinalFocusPoints) => {
  // The API returns RegionFinalFocusPoints as a list of serialized focus points
  // Skip the first entry (index 0) which is a placeholder (-1, 0)
  // Each remaining point corresponds to a region in order (index 1 = region 1, etc.)
  console.log('[ConvertFinal] Input points:', regionFinalFocusPoints);
  if (!Array.isArray(regionFinalFocusPoints) || regionFinalFocusPoints.length <= 1) {
    console.log('[ConvertFinal] Skipping - not enough points');
    return null;
  }

  // Skip the first entry and process the rest
  const pointsToProcess = regionFinalFocusPoints.slice(1);
  console.log('[ConvertFinal] After skipping first:', pointsToProcess);
  const regions = [];

  // Each point maps to its corresponding region index
  pointsToProcess.forEach((point, pointIdx) => {
    const regionIdx = pointIdx + 1; // Account for skipped index 0
    regions.push({
      regionName: `Region${regionIdx}`,
      regionIdx: regionIdx,
      focusPoints: [
        {
          x: point.x !== undefined ? point.x : point.X,
          y: point.y !== undefined ? point.y : point.Y,
        },
      ],
    });
  });

  console.log('[ConvertFinal] Converted regions:', regions);
  return regions.length > 0 ? regions : null;
};

// Fetch and update status
const updateStatus = async () => {
  try {
    console.log('[Status] Fetching data...');
    const data = await apiService.hocusfocus.getStatus();
    console.log('[Status] Data received:', data);
    if (data && data.Success) {
      backendCanRun.value = data.CanRunAutoFocusAnalysis ?? false;
      autoFocusCompleted.value = data.AutoFocusCompleted ?? false;
      autoFocusChartActive.value = data.AutoFocusChartActive ?? false;
      autoFocusChartActivatedOnce.value = data.AutoFocusChartActivatedOnce ?? false;
      // Reset cancelling flag when backend indicates AF is no longer running
      if (backendCanRun.value && store.isCancelling) {
        store.isCancelling = false;
      }
    }
  } catch (err) {
    console.error('Error fetching status:', err);
    backendCanRun.value = false;
    autoFocusCompleted.value = false;
    autoFocusChartActive.value = false;
    autoFocusChartActivatedOnce.value = false;
  }
};

// Update and manage focus curve chart
const updateAberrationInspector = async () => {
  // Fetch initial data
  try {
    // Fetch status
    await updateStatus();

    // Fetch final focus data and tilt measurement only if no AF run is happening
    if (autoFocusCompleted.value) {
      await updateFinalFocusData();
      await updateTiltMeasurements();
    }

    if (autoFocusChartActive.value) {
      console.log('[FocusCurve] Initializing chart...');
      const data = await apiService.hocusfocus.getRegionFocusPoints();
      console.log('[FocusCurve] Initial data received:', data);
      if (data && data.regionFocusPoints) {
        // Fetch final focus points if auto focus is completed
        let finalFocusPoints = null;
        console.log(
          '[FocusCurve] autoFocusCompleted:',
          autoFocusCompleted.value,
          'finalFocusData:',
          finalFocusData.value
        );
        if (
          autoFocusCompleted.value &&
          finalFocusData.value &&
          finalFocusData.value.RegionFinalFocusPoints
        ) {
          // RegionFinalFocusPoints comes from getFinalFocusData endpoint and is already serialized
          // We need to convert it to the same format as regionFocusPoints for the chart
          console.log(
            '[FocusCurve] Converting final focus points:',
            finalFocusData.value.RegionFinalFocusPoints
          );
          try {
            finalFocusPoints = convertFinalFocusPointsToChartFormat(
              finalFocusData.value.RegionFinalFocusPoints
            );
            console.log('[FocusCurve] Final focus points converted:', finalFocusPoints);
          } catch (err) {
            console.error('[FocusCurve] Error converting final focus points:', err);
          }
        }
        updateFocusCurveChart(data.regionFocusPoints, finalFocusPoints);
      }
    }

    // Fetch history only if chart was at least activated once
    if (autoFocusChartActivatedOnce.value) {
      await updateTiltMeasurementHistory();
    }
  } catch (err) {
    console.error('Error fetching initial focus points:', err);
  }
};

const updateFocusCurveChart = (focusPointsData, finalFocusPointsData = null) => {
  if (!focusCurveChart.value) {
    console.warn('[FocusCurve] Canvas element not available');
    return;
  }

  console.log('[FocusCurve] Updating chart with data:', focusPointsData);
  console.log('[FocusCurve] Final focus points:', finalFocusPointsData);

  // Prepare datasets for each region
  const datasets = [];
  const colors = [
    { border: 'rgb(255, 255, 255)', bg: 'rgba(255, 255, 255, 0.05)' }, // White for Full Picture
    { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.1)' }, // Green for TopLeft
    { border: 'rgb(249, 115, 22)', bg: 'rgba(249, 115, 22, 0.1)' }, // Orange for TopRight
    { border: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.1)' }, // Purple for BottomLeft
    { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.1)' }, // Red for BottomRight
    { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' }, // Blue for TopCenter
  ];

  // Iterate through the response data directly - region names come from the endpoint
  focusPointsData.forEach((regionData, idx) => {
    if (regionData && regionData.focusPoints && regionData.focusPoints.length > 0) {
      const regionName = regionData.regionName || `Region${idx}`;
      console.log(`[FocusCurve] Region ${regionName}:`, regionData);
      console.log(`[FocusCurve] First point structure:`, regionData.focusPoints[0]);
      const points = regionData.focusPoints.map((p) => {
        // Handle both "x"/"y" and "X"/"Y" property names and extract error values
        const dataPoint = {
          x: p.x !== undefined ? p.x : p.X,
          y: p.y !== undefined ? p.y : p.Y,
        };

        // Check for error properties (common names: error, errorY, yError, HFRError, stdDev, etc.)
        const errorValue =
          p.error !== undefined
            ? p.error
            : p.errorY !== undefined
              ? p.errorY
              : p.yError !== undefined
                ? p.yError
                : p.HFRError !== undefined
                  ? p.HFRError
                  : p.stdDev !== undefined
                    ? p.stdDev
                    : p.ErrorY !== undefined
                      ? p.ErrorY
                      : null;

        if (errorValue !== null) {
          dataPoint.errorY = errorValue;
        }

        return dataPoint;
      });

      if (points.length > 0) {
        datasets.push({
          label: regionName,
          data: points,
          borderColor: colors[idx].border,
          backgroundColor: colors[idx].bg,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: false,
        });
      }
    }
  });

  // Add final focus points if available
  if (finalFocusPointsData && finalFocusPointsData.length > 0) {
    finalFocusPointsData.forEach((regionData) => {
      if (regionData && regionData.focusPoints && regionData.focusPoints.length > 0) {
        const regionName = regionData.regionName || 'Final Points';
        const regionIdx = regionData.regionIdx !== undefined ? regionData.regionIdx : 0;
        console.log(
          `[FocusCurve] Final focus region ${regionName} (idx: ${regionIdx}):`,
          regionData
        );
        const points = regionData.focusPoints.map((p) => {
          // Handle both "x"/"y" and "X"/"Y" property names
          return {
            x: p.x !== undefined ? p.x : p.X,
            y: p.y !== undefined ? p.y : p.Y,
          };
        });

        if (points.length > 0) {
          // Use the color matching the region index
          const selectedColor = colors[regionIdx] || colors[0];

          datasets.push({
            label: '', // No label so it doesn't appear in legend
            data: points,
            borderColor: selectedColor.border,
            backgroundColor: selectedColor.bg,
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointStyle: 'star', // Star marker for final points
            tension: 0,
            fill: false,
            showLine: false,
          });
        }
      }
    });
  }

  console.log('[FocusCurve] Datasets to render:', datasets);

  // Calculate y-axis range including error bars
  let minY = Infinity;
  let maxY = -Infinity;

  datasets.forEach((dataset) => {
    if (dataset.data && Array.isArray(dataset.data)) {
      dataset.data.forEach((point) => {
        if (point && point.y !== undefined) {
          const y = point.y;
          const error = point.errorY || 0;
          minY = Math.min(minY, y - error);
          maxY = Math.max(maxY, y + error);
        }
      });
    }
  });

  // Add 10% padding to the range for better visualization
  const padding = (maxY - minY) * 0.1;
  const yAxisMin = Math.max(0, minY - padding);
  const yAxisMax = maxY + padding;

  console.log('[FocusCurve] Y-axis range:', { min: yAxisMin, max: yAxisMax });

  // Custom plugin to draw error bars
  const errorBarPlugin = {
    id: 'errorBars',
    afterDatasetsDraw(chart) {
      const yScale = chart.scales.y;

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);

        if (meta.hidden) return;

        dataset.data.forEach((datapoint, index) => {
          if (!datapoint.errorY) return; // Skip if no error value

          const element = meta.data[index];
          if (!element) return;

          const x = element.x;
          const y = element.y;
          const errorPixels =
            yScale.getPixelForValue(datapoint.y - datapoint.errorY) -
            yScale.getPixelForValue(datapoint.y + datapoint.errorY);

          const ctx = chart.ctx;
          ctx.save();
          ctx.strokeStyle = dataset.borderColor || '#999';
          ctx.lineWidth = 1;

          // Draw error bar line
          ctx.beginPath();
          ctx.moveTo(x - 3, y - errorPixels / 2);
          ctx.lineTo(x + 3, y - errorPixels / 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x, y - errorPixels / 2);
          ctx.lineTo(x, y + errorPixels / 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x - 3, y + errorPixels / 2);
          ctx.lineTo(x + 3, y + errorPixels / 2);
          ctx.stroke();

          ctx.restore();
        });
      });
    },
  };

  if (chartInstance) {
    // Update existing chart
    chartInstance.data.datasets = datasets;
    // Update y-axis scale to accommodate error bars
    if (chartInstance.options.scales && chartInstance.options.scales.y) {
      chartInstance.options.scales.y.min = isFinite(yAxisMin) ? yAxisMin : undefined;
      chartInstance.options.scales.y.max = isFinite(yAxisMax) ? yAxisMax : undefined;
    }
    chartInstance.update('none'); // Don't animate on updates
  } else {
    // Create new chart
    if (datasets.length === 0) {
      console.warn('[FocusCurve] No datasets available to render');
    }

    chartInstance = new Chart(focusCurveChart.value, {
      type: 'scatter',
      data: {
        datasets: datasets,
      },
      plugins: [errorBarPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0, // Disable animations for real-time updates
        },
        plugins: {
          legend: {
            labels: {
              color: '#e5e7eb',
              font: {
                size: 12,
                weight: 'bold',
              },
              filter: function (item) {
                // Hide legend items for datasets with empty labels
                return item.text !== '';
              },
            },
          },
          title: {
            display: true,
            text: 'Focus Curve Analysis',
            color: '#fff',
            font: {
              size: 16,
              weight: 'bold',
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Focuser Position',
              color: '#9ca3af',
            },
            ticks: {
              color: '#9ca3af',
            },
            grid: {
              color: 'rgba(107, 114, 128, 0.1)',
            },
          },
          y: {
            title: {
              display: true,
              text: 'HFR',
              color: '#9ca3af',
            },
            ticks: {
              color: '#9ca3af',
            },
            grid: {
              color: 'rgba(107, 114, 128, 0.1)',
            },
            min: isFinite(yAxisMin) ? yAxisMin : undefined,
            max: isFinite(yAxisMax) ? yAxisMax : undefined,
          },
        },
      },
    });
  }
};

const startAberrationInspectorPolling = () => {
  pollingActive = true;
  console.log('[FocusCurve] Starting polling...');

  const poll = async () => {
    if (!pollingActive) return;

    try {
      await updateAberrationInspector();
    } catch (err) {
      console.error('Error polling focus points:', err);
      // Continue polling even on error
    }

    // Schedule next poll only after this one completes (no concurrent requests)
    if (pollingActive) {
      setTimeout(poll, 1000);
    }
  };

  poll();
};

const stopAberrationInspectorPolling = () => {
  pollingActive = false;
  console.log('[FocusCurve] Polling stopped');
};

// Watch for tab changes
watch(
  activeTab,
  async (newTab) => {
    if (newTab === 'aberration') {
      // Wait for canvas to be rendered in DOM
      await nextTick();
      console.log('[FocusCurve] Switching to aberration tab - starting polling');
      // Clear old chart instance
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      // Update chart and start polling
      updateAberrationInspector();
      startAberrationInspectorPolling();
    } else {
      // Stop polling when leaving aberration tab
      console.log('[FocusCurve] Leaving aberration tab - stopping polling');
      stopAberrationInspectorPolling();
      // Destroy chart to free resources
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    }
  },
  { immediate: true }
);

// Start detailed autofocus run with analysis
const runDetailedAutoFocus = async () => {
  if (!canRunAutoFocus.value) {
    return;
  }

  try {
    console.log('[HocusFocus] Starting detailed AutoFocus analysis');

    // Call the backend endpoint - let polling handle state transitions
    const response = await apiService.hocusfocus.runDetailedAutoFocus();
    console.log('[HocusFocus] RunDetailedAutoFocus response:', response);

    if (response && response.Success) {
      store.error = null;
      // Let polling update button state
    } else {
      store.error = response?.Error || 'Failed to start detailed AutoFocus';
    }
  } catch (err) {
    console.error('[HocusFocus] Error starting analysis:', err);
    store.error = err.message || 'Failed to run DetailedAutoFocus';
  }
};

const stopDetailedAutoFocus = async () => {
  console.log('[HocusFocus] Sending cancel request to backend');
  store.isCancelling = true;

  try {
    const response = await apiService.hocusfocus.cancelDetailedAutoFocus();
    console.log('[HocusFocus] Cancel response:', response);

    if (!response?.Success) {
      store.error = response?.Error || 'Failed to cancel analysis';
    } else {
      store.error = null;
    }
    // Let polling reset the isCancelling flag
  } catch (err) {
    console.error('[HocusFocus] Error cancelling analysis:', err);
    store.error = `Error cancelling: ${err.message}`;
    // Next polling cycle will attempt to reset state
  }
};

// Star Annotator options methods
const loadStarAnnotatorOptions = async () => {
  await store.loadStarAnnotatorOptions();
};

const saveStarAnnotatorOptions = async () => {
  console.log('[StarAnnotator] Saving options:', store.starAnnotatorOptions);
  await store.saveStarAnnotatorOptions(store.starAnnotatorOptions);
};

// Star Detection options methods
const loadStarDetectionOptions = async () => {
  await store.loadStarDetectionOptions();
};

const saveStarDetectionOptions = async () => {
  console.log('[StarDetection] Saving options:', store.starDetectionOptions);
  await store.saveStarDetectionOptions(store.starDetectionOptions);
};

const executeAnnotationResetDefaults = async () => {
  try {
    isResettingAnnotationOptions.value = true;
    await store.resetStarAnnotatorDefaults();
    showAnnotationResetConfirmation.value = false;
  } catch (err) {
    console.error('[StarAnnotation] Error resetting options:', err);
  } finally {
    isResettingAnnotationOptions.value = false;
  }
};

const executeDetectionResetDefaults = async () => {
  try {
    isResettingDetectionOptions.value = true;
    await store.resetStarDetectionDefaults();
    showDetectionResetConfirmation.value = false;
  } catch (err) {
    console.error('[StarDetection] Error resetting options:', err);
  } finally {
    isResettingDetectionOptions.value = false;
  }
};

// Generate sample focus data on mount
onMounted(() => {
  store.fetchEquipmentStatus();
  loadStarAnnotatorOptions();
  loadStarDetectionOptions();
});

// Cleanup on component unmount
onBeforeUnmount(() => {
  stopAberrationInspectorPolling();
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>
