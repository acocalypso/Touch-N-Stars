<template>
  <div class="filter-calculator-view px-4 py-6 lg:px-8">
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- Header -->
      <header
        class="rounded-2xl border border-gray-700/70 bg-gradient-to-br from-purple-900/40 to-blue-900/40 p-6 shadow-lg backdrop-blur"
      >
        <div class="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 class="text-3xl font-bold text-white">{{ $t('plugins.narrowband.title') }}</h1>
            <p class="mt-2 text-sm text-gray-300">
              {{ $t('plugins.narrowband.subtitle') }}
            </p>
          </div>
        </div>
      </header>

      <!-- Main Grid -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Parameters Section -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Optical Parameters -->
          <section
            class="rounded-2xl border border-gray-700/70 bg-gray-900/50 p-6 shadow-inner backdrop-blur"
          >
            <h2 class="text-lg font-semibold text-white flex items-center gap-2">
              <svg
                class="h-5 w-5 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {{ $t('plugins.narrowband.sections.optical') }}
            </h2>

            <div class="mt-6 space-y-5">
              <!-- Aperture -->
              <NumberInputPicker
                v-model="params.aperture"
                :label="$t('plugins.narrowband.aperture')"
                labelKey="plugins.narrowband.aperture"
                :min="10"
                :max="300"
                :step="1"
              />

              <!-- Focal Length -->
              <NumberInputPicker
                v-model="params.focalLength"
                :label="$t('plugins.narrowband.focalLength')"
                labelKey="plugins.narrowband.focalLength"
                :min="100"
                :max="2000"
                :step="10"
              />

              <!-- Peak Transmittance -->
              <NumberInputPicker
                v-model="params.peakTransmittance"
                :label="$t('plugins.narrowband.peakTransmittance')"
                labelKey="plugins.narrowband.peakTransmittance"
                :min="0"
                :max="1"
                :step="0.01"
                :decimalPlaces="3"
                :wrapperClass="loadedCurveData ? 'opacity-50 pointer-events-none' : ''"
              />

              <!-- Effective Refractive Index -->
              <NumberInputPicker
                v-model="params.effectiveRefractiveIndex"
                :label="$t('plugins.narrowband.refractiveIndex')"
                labelKey="plugins.narrowband.refractiveIndex"
                :min="1.1"
                :max="2.5"
                :step="0.05"
                :decimalPlaces="2"
              />

              <!-- Central Obstruction Diameter -->
              <NumberInputPicker
                v-model="params.obstructionDiameter"
                :label="$t('plugins.narrowband.obstructionDiameter')"
                labelKey="plugins.narrowband.obstructionDiameter"
                :min="0"
                :max="params.aperture * 0.9"
                :step="1"
                :decimalPlaces="1"
              />
            </div>
          </section>

          <!-- Bandpass Parameters -->
          <section
            class="rounded-2xl border border-gray-700/70 bg-gray-900/50 p-6 shadow-inner backdrop-blur"
          >
            <h2 class="text-lg font-semibold text-white flex items-center gap-2">
              <svg
                class="h-5 w-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              {{ $t('plugins.narrowband.sections.bandpass') }}
            </h2>

            <!-- Filter Manufacturer Preset -->
            <div class="mt-6 mb-6 pb-6 border-b border-gray-700/50">
              <label class="block text-sm font-medium text-gray-300 mb-3">
                {{ $t('plugins.narrowband.populerFilters') }}
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  @change="loadManufacturerPreset"
                  v-model="selectedManufacturer"
                  :disabled="!!loadedCurveData"
                  class="rounded-lg border border-gray-600 bg-gray-700/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{{ $t('plugins.narrowband.selectManufacturer') }}</option>
                  <option value="chroma-ha">Chroma 3nm [Ha]</option>
                  <option value="chroma-oiii">Chroma 3nm [OIII]</option>
                  <option value="chroma-sii">Chroma 3nm [SII]</option>
                </select>
                <button
                  v-if="selectedManufacturer"
                  type="button"
                  @click="clearManufacturerSelection"
                  class="rounded-lg bg-gray-700/50 px-3 py-2 text-sm font-medium text-gray-300 border border-gray-600 transition hover:bg-gray-600"
                >
                  {{ $t('plugins.narrowband.clearSelection') }}
                </button>
              </div>
            </div>

            <!-- Bandpass Curve Upload -->
            <div class="mt-6 mb-6 pb-6 border-b border-gray-700/50">
              <div class="flex items-center gap-2 mb-3">
                <label class="text-sm font-medium text-gray-300">
                  {{ $t('plugins.narrowband.customCurve') }}
                </label>
                <button
                  type="button"
                  @click="showCsvInfo = !showCsvInfo"
                  class="text-gray-400 hover:text-blue-400 transition-colors flex-shrink-0"
                  :title="$t('plugins.narrowband.csvInfo.title')"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
              <!-- CSV format info panel -->
              <div
                v-if="showCsvInfo"
                class="mb-3 rounded-lg border border-blue-700/50 bg-blue-900/20 p-3 text-xs text-blue-200 space-y-1"
              >
                <p class="font-semibold text-blue-300">
                  {{ $t('plugins.narrowband.csvInfo.title') }}
                </p>
                <p>{{ $t('plugins.narrowband.csvInfo.description') }}</p>
                <pre class="mt-1 rounded bg-gray-800/60 px-2 py-1 font-mono text-gray-300">{{
                  $t('plugins.narrowband.csvInfo.example')
                }}</pre>
                <p class="text-gray-400">{{ $t('plugins.narrowband.csvInfo.note') }}</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="flex items-center">
                  <input
                    type="file"
                    accept=".csv,.txt,.dat"
                    @change="loadCurveFromCSV"
                    class="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-700/50 file:text-gray-300 hover:file:bg-gray-600"
                  />
                </div>
                <button
                  v-if="loadedCurveData"
                  type="button"
                  @click="clearLoadedCurve"
                  class="rounded-lg bg-gray-700/50 px-3 py-2 text-sm font-medium text-gray-300 border border-gray-600 transition hover:bg-gray-600"
                >
                  {{ $t('plugins.narrowband.clearCurve') }}
                </button>
              </div>
              <p v-if="loadedCurveData" class="mt-2 text-xs text-emerald-300">
                ✓ {{ $t('plugins.narrowband.loaded') }}
                <span class="font-semibold">{{ loadedFileName }}</span> ({{
                  loadedCurveData.length
                }}
                {{ $t('plugins.narrowband.dataPoints') }})
              </p>
            </div>

            <div class="space-y-5">
              <!-- Bandpass Center -->
              <NumberInputPicker
                v-model="params.bandpassCenter"
                :label="$t('plugins.narrowband.bandpassCenter')"
                labelKey="plugins.narrowband.bandpassCenter"
                :min="400"
                :max="900"
                :step="0.5"
                :decimalPlaces="2"
                :wrapperClass="loadedCurveData ? 'opacity-50 pointer-events-none' : ''"
              />

              <!-- FWHM -->
              <NumberInputPicker
                v-model="params.fwhm"
                :label="$t('plugins.narrowband.fwhm')"
                labelKey="plugins.narrowband.fwhm"
                :min="0.5"
                :max="20"
                :step="0.1"
                :decimalPlaces="2"
                :wrapperClass="loadedCurveData ? 'opacity-50 pointer-events-none' : ''"
              />

              <!-- Flat Top -->
              <NumberInputPicker
                v-model="params.flatTop"
                :label="$t('plugins.narrowband.flatTop')"
                labelKey="plugins.narrowband.flatTop"
                :min="0"
                :max="params.fwhm"
                :step="0.1"
                :decimalPlaces="2"
                :wrapperClass="loadedCurveData ? 'opacity-50 pointer-events-none' : ''"
              />

              <!-- Target Wavelength with Presets -->
              <div class="space-y-2">
                <div class="flex items-center justify-between w-full">
                  <label class="text-sm font-medium text-gray-300">
                    {{ $t('plugins.narrowband.targetWavelength') }}
                  </label>
                  <input
                    v-model.number="params.targetWavelength"
                    type="number"
                    min="400"
                    max="900"
                    step="0.1"
                    class="h-8 w-24 rounded-lg border border-gray-600 bg-gray-700/50 px-2 text-sm text-white text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="setTargetWavelength(656.3)"
                    class="flex-1 rounded-lg bg-red-500/20 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/30"
                  >
                    [Ha]
                  </button>
                  <button
                    type="button"
                    @click="setTargetWavelength(500.7)"
                    class="flex-1 rounded-lg bg-cyan-500/20 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/30"
                  >
                    [OIII]
                  </button>
                  <button
                    type="button"
                    @click="setTargetWavelength(672.4)"
                    class="flex-1 rounded-lg bg-yellow-500/20 py-1.5 text-xs font-medium text-yellow-200 transition hover:bg-yellow-500/30"
                  >
                    [SII]
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Bandpass Curve Chart -->
          <BandpassChart
            :bandpassCenter="params.bandpassCenter"
            :fwhm="params.fwhm"
            :flatTop="params.flatTop"
            :peakTransmittance="params.peakTransmittance"
            :targetWavelength="params.targetWavelength"
            :loadedCurveData="loadedCurveData"
            :aperture="params.aperture"
            :focalLength="params.focalLength"
            :effectiveRefractiveIndex="params.effectiveRefractiveIndex"
            :calculatedTransmission="transmission"
          />
        </div>

        <!-- Results Section -->
        <aside class="space-y-6 order-first lg:order-last">
          <!-- Transmission Display -->
          <section
            class="rounded-2xl border border-emerald-700/70 bg-gradient-to-br from-emerald-900/40 to-green-900/40 p-8 shadow-lg backdrop-blur lg:sticky lg:top-6"
          >
            <div class="space-y-6">
              <!-- Transmission Gauge -->
              <div class="flex flex-col items-center">
                <div
                  class="relative h-40 w-40 rounded-full border-8 shadow-2xl flex items-center justify-center"
                  :style="{
                    borderColor: getTransmissionColor(),
                    background: `conic-gradient(${getTransmissionColor()} ${transmission * 360}deg, #374151 0deg)`,
                  }"
                >
                  <div
                    class="h-36 w-36 rounded-full bg-gray-900 flex flex-col items-center justify-center"
                  >
                    <span class="text-4xl font-bold text-white">
                      {{ (transmission * 100).toFixed(1) }}
                    </span>
                    <span class="text-xs text-gray-400 uppercase tracking-wider">%</span>
                  </div>
                </div>
              </div>

              <!-- Status -->
              <div class="space-y-3 text-center">
                <div v-if="errors.length" class="text-sm text-red-300 space-y-1">
                  <div
                    v-for="error in errors"
                    :key="error"
                    class="flex items-center justify-center gap-1"
                  >
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    {{ error }}
                  </div>
                </div>
                <p v-else class="text-sm font-medium text-emerald-200">
                  ✓ {{ $t('plugins.narrowband.status.success') }}
                </p>
              </div>

              <!-- Details -->
              <div class="space-y-2 border-t border-gray-700/50 pt-4">
                <div class="flex justify-between text-xs text-gray-400">
                  <span>{{ $t('plugins.narrowband.wavelengthRange') }}</span>
                  <span class="text-emerald-300">
                    {{ (params.bandpassCenter - params.fwhm / 2).toFixed(1) }} -
                    {{ (params.bandpassCenter + params.fwhm / 2).toFixed(1) }} nm
                  </span>
                </div>
                <div class="flex justify-between text-xs text-gray-400">
                  <span>{{ $t('plugins.narrowband.flatTopRange') }}</span>
                  <span class="text-emerald-300">
                    {{ (params.bandpassCenter - params.flatTop / 2).toFixed(1) }} -
                    {{ (params.bandpassCenter + params.flatTop / 2).toFixed(1) }} nm
                  </span>
                </div>
                <div class="flex justify-between text-xs text-gray-400">
                  <span>{{ $t('plugins.narrowband.fRatio') }}</span>
                  <span class="text-emerald-300">f/{{ fRatio.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Clear Button -->
          <button
            type="button"
            @click="resetToDefaults"
            class="w-full rounded-lg border border-gray-600 bg-gray-800/50 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
          >
            {{ $t('plugins.narrowband.resetDefaults') }}
          </button>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
  calculateTransmissionContinuous,
  validateParameters,
} from '../utils/filterCalculations.js';
import BandpassChart from '../components/BandpassChart.vue';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';

// Default parameters based on your filter.py
const defaultParams = {
  aperture: 106,
  bandpassCenter: 672.5,
  fwhm: 3.4,
  flatTop: 2.2,
  effectiveRefractiveIndex: 1.8,
  peakTransmittance: 0.99,
  focalLength: 318,
  targetWavelength: 672.4,
  obstructionDiameter: 0, // Central obstruction diameter in mm
};

// Manufacturer filter specifications
const manufacturerFilters = {
  'chroma-ha': {
    name: 'Chroma 3nm [Ha]',
    bandpassCenter: 656.5,
    fwhm: 3.0,
    flatTop: 1.9,
    targetWavelength: 656.3,
    peakTransmittance: 0.99,
    effectiveRefractiveIndex: 2.0,
  },
  'chroma-oiii': {
    name: 'Chroma 3nm [OIII]',
    bandpassCenter: 500.5,
    fwhm: 3.1,
    flatTop: 1.8,
    targetWavelength: 500.7,
    peakTransmittance: 0.99,
    effectiveRefractiveIndex: 2.0,
  },
  'chroma-sii': {
    name: 'Chroma 3nm [SII]',
    bandpassCenter: 672.4,
    fwhm: 2.95,
    flatTop: 2.0,
    targetWavelength: 672.4,
    peakTransmittance: 0.99,
    effectiveRefractiveIndex: 2.0,
  },
};

const params = ref({ ...defaultParams });
const transmission = ref(0);
const errors = ref([]);
const selectedManufacturer = ref('');
const loadedCurveData = ref(null);
const loadedFileName = ref('');
const showCsvInfo = ref(false);

// Calculate transmission and validate
function updateTransmission() {
  const validation = validateParameters(params.value);

  if (!validation.valid) {
    errors.value = validation.errors;
    transmission.value = 0;
    return;
  }

  errors.value = [];

  try {
    // Calculate transmission using the updated function which handles both
    // curve-based and parametric methods
    const calcParams = {
      ...params.value,
      loadedCurveData:
        loadedCurveData.value && loadedCurveData.value.length > 0 ? loadedCurveData.value : null,
    };

    transmission.value = calculateTransmissionContinuous(calcParams);
    transmission.value = Math.min(1, Math.max(0, transmission.value)); // Clamp to 0-1
  } catch (error) {
    errors.value = ['Calculation error: ' + error.message];
    transmission.value = 0;
  }
}

// Computed property for field of view
const fRatio = computed(() => {
  return params.value.focalLength / params.value.aperture;
});

// Get color based on transmission
function getTransmissionColor() {
  if (transmission.value >= 0.9) return '#10b981'; // emerald
  if (transmission.value >= 0.7) return '#3b82f6'; // blue
  if (transmission.value >= 0.5) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

// Set target wavelength (for preset buttons)
function setTargetWavelength(wavelength) {
  params.value.targetWavelength = wavelength;
  updateTransmission();
}

// Load manufacturer preset
function loadManufacturerPreset() {
  if (!selectedManufacturer.value) return;

  const filter = manufacturerFilters[selectedManufacturer.value];
  if (filter) {
    params.value.bandpassCenter = filter.bandpassCenter;
    params.value.fwhm = filter.fwhm;
    params.value.flatTop = filter.flatTop;
    params.value.targetWavelength = filter.targetWavelength;
    params.value.peakTransmittance = filter.peakTransmittance;
    params.value.effectiveRefractiveIndex = filter.effectiveRefractiveIndex;
    updateTransmission();
  }
}

// Clear manufacturer selection
function clearManufacturerSelection() {
  selectedManufacturer.value = '';
}

// Parse CSV file and load bandpass curve
function loadCurveFromCSV(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result;
      if (typeof content !== 'string') return;

      const lines = content.trim().split('\n');
      const data = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue; // Skip empty lines

        // Parse wavelength and transmission values (whitespace-separated)
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const wavelength = parseFloat(parts[0]);
          let transmission = parseFloat(parts[1]);

          if (!isNaN(wavelength) && !isNaN(transmission)) {
            // CSV files contain transmission as percentage (0-100), convert to 0-1 range
            transmission = transmission / 100;
            data.push({ wavelength, transmission: Math.max(0, Math.min(1, transmission)) });
          }
        }
      }

      if (data.length > 0) {
        loadedCurveData.value = data;
        loadedFileName.value = file.name;
        // Calculate bandpass characteristics from loaded data
        calculateBandpassCharacteristics(data);
        errors.value = [];
        // Keep file input showing the filename - don't reset
      } else {
        errors.value = ['No valid wavelength/transmission data found in CSV'];
        loadedFileName.value = '';
        // Reset file input on error
        event.target.value = '';
      }
    } catch (error) {
      errors.value = ['Error parsing CSV: ' + error.message];
      loadedFileName.value = '';
      // Reset file input on error
      event.target.value = '';
    }
  };

  reader.readAsText(file);
}

// Calculate bandpass center and peak transmittance from loaded data
function calculateBandpassCharacteristics(data) {
  if (data.length === 0) return;

  // Sort data by wavelength to ensure proper ordering
  const sortedData = [...data].sort((a, b) => a.wavelength - b.wavelength);

  // Find peak transmission and wavelength
  let maxTransmission = 0;
  let peakWavelength = sortedData[0].wavelength;
  let peakIndex = 0;

  for (let i = 0; i < sortedData.length; i++) {
    if (sortedData[i].transmission > maxTransmission) {
      maxTransmission = sortedData[i].transmission;
      peakWavelength = sortedData[i].wavelength;
      peakIndex = i;
    }
  }

  // Update bandpass center and peak transmittance
  params.value.bandpassCenter = peakWavelength;
  params.value.peakTransmittance = Math.min(1, maxTransmission);

  // Auto-detect target wavelength: use closest standard filter (Ha, OIII, or SII)
  const standardWavelengths = {
    Ha: 656.3,
    '[OIII]': 500.7,
    '[SII]': 672.4,
  };

  let closestStandard = 656.3; // Default to Ha
  let minDistance = Math.abs(peakWavelength - 656.3);

  for (const wavelength of Object.values(standardWavelengths)) {
    const distance = Math.abs(peakWavelength - wavelength);
    if (distance < minDistance) {
      minDistance = distance;
      closestStandard = wavelength;
    }
  }

  params.value.targetWavelength = closestStandard;

  // Calculate FWHM (Full Width Half Maximum) for display/visualization only
  // (not used in transmission calculations when loading curves)
  const halfMax = maxTransmission / 2;
  let leftWavelength = peakWavelength;
  let rightWavelength = peakWavelength;

  // Find left edge: search left from peak for first point <= halfMax
  for (let i = peakIndex; i >= 0; i--) {
    if (sortedData[i].transmission <= halfMax) {
      leftWavelength = sortedData[i].wavelength;
      break;
    }
  }

  // Find right edge: search right from peak for first point <= halfMax
  for (let i = peakIndex; i < sortedData.length; i++) {
    if (sortedData[i].transmission <= halfMax) {
      rightWavelength = sortedData[i].wavelength;
      break;
    }
  }

  const fwhm = rightWavelength - leftWavelength;
  if (fwhm > 0) {
    params.value.fwhm = Math.max(0.1, fwhm);
  }

  // Estimate flat top as approximately 50-60% of FWHM for display
  params.value.flatTop = Math.max(0.1, Math.min(fwhm, fwhm * 0.6));

  updateTransmission();
}

// Clear loaded curve
function clearLoadedCurve() {
  loadedCurveData.value = null;
  loadedFileName.value = '';
  // Also clear the file input
  const fileInput = document.querySelector('input[type="file"][accept=".csv"]');
  if (fileInput) {
    fileInput.value = '';
  }
  resetToDefaults();
}

// Reset to defaults
function resetToDefaults() {
  params.value = { ...defaultParams };
  updateTransmission();
}

// Watch for parameter changes
watch(params, updateTransmission, { deep: true });

// Watch for loaded curve data changes
watch(loadedCurveData, updateTransmission);

// Initial calculation
updateTransmission();
</script>

<style scoped>
/* Pulse animation for transmission gauge */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
