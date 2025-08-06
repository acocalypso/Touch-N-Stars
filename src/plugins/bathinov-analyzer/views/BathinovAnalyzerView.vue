<template>
  <div class="container py-16 flex items-center justify-center">
    <div class="container max-w-4xl">
      <h5 class="text-2xl text-center font-bold text-white mb-4">Bathinov Mask Focus Analyzer</h5>

      <div class="flex flex-col space-y-4">
        <!-- Controls section -->
        <div
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <div class="flex flex-col space-y-4">
            <!-- Image Source Selection -->
            <div class="flex-1">
              <label class="block text-gray-300 font-medium mb-2">Image Source</label>
              <div class="flex space-x-2">
                <button
                  @click="captureNewImage"
                  class="bg-cyan-800 hover:bg-cyan-700 text-white py-2 px-4 rounded-md transition-colors"
                  :disabled="isProcessing || selectionMode"
                >
                  {{ isCapturing ? 'Capturing...' : 'Capture Image' }}
                </button>
                <button
                  @click="triggerFileUpload"
                  class="bg-green-800 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
                  :disabled="isProcessing || selectionMode"
                >
                  Upload Image
                </button>
                <button
                  @click="loadTestImage"
                  class="bg-violet-800 hover:bg-violet-700 text-white py-2 px-4 rounded-md transition-colors"
                  :disabled="isProcessing || selectionMode"
                >
                  Load Test Image
                </button>
              </div>
              <!-- Hidden file input -->
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleFileUpload"
                class="hidden"
              />
            </div>

            <!-- Focus Error Threshold Configuration -->
            <div class="flex-1">
              <label class="block text-gray-300 font-medium mb-2"
                >Focus Error Threshold (pixels)</label
              >
              <div class="flex items-center space-x-4">
                <div class="flex-1">
                  <input
                    v-model.number="focusThreshold"
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    class="w-full"
                  />
                </div>
                <div class="text-gray-300 text-sm min-w-16">{{ focusThreshold.toFixed(1) }}px</div>
              </div>
              <div class="text-xs text-gray-400 mt-1">
                Focus errors below this threshold will be considered "In Focus"
              </div>
            </div>

            <!-- Auto Analysis Toggle -->
            <div class="flex-1">
              <label class="block text-gray-300 font-medium mb-2">Analysis Mode</label>
              <div class="flex items-center space-x-4">
                <label class="flex items-center space-x-2">
                  <input
                    v-model="autoAnalysis"
                    type="checkbox"
                    class="form-checkbox h-4 w-4 text-cyan-600"
                  />
                  <span class="text-gray-300 text-sm">Auto-analyze on selection</span>
                </label>
              </div>
              <div class="text-xs text-gray-400 mt-1">
                When enabled, analysis starts immediately after selecting a region
              </div>
            </div>
          </div>

          <!-- Analysis Quality Settings -->
          <div class="mt-4 p-3 bg-gray-700 rounded-lg">
            <label class="block text-gray-300 font-medium mb-2">Analysis Quality</label>
            <div class="flex space-x-4">
              <label class="flex items-center space-x-2">
                <input
                  v-model="analysisQuality"
                  type="radio"
                  value="fast"
                  class="form-radio h-4 w-4 text-cyan-600"
                />
                <span class="text-gray-300 text-sm">Fast</span>
              </label>
              <label class="flex items-center space-x-2">
                <input
                  v-model="analysisQuality"
                  type="radio"
                  value="balanced"
                  class="form-radio h-4 w-4 text-cyan-600"
                />
                <span class="text-gray-300 text-sm">Balanced</span>
              </label>
              <label class="flex items-center space-x-2">
                <input
                  v-model="analysisQuality"
                  type="radio"
                  value="precise"
                  class="form-radio h-4 w-4 text-cyan-600"
                />
                <span class="text-gray-300 text-sm">Precise</span>
              </label>
            </div>
            <div class="text-xs text-gray-400 mt-1">
              Higher quality = more accurate but slower analysis
            </div>
          </div>
        </div>

        <!-- Selection Mode Instructions -->
        <div
          v-if="selectionMode"
          class="border border-blue-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xl text-white font-semibold">Selection Mode</h3>
            <button
              @click="cancelSelection"
              class="bg-gray-600 hover:bg-gray-500 text-white py-1 px-3 rounded-md"
            >
              Cancel
            </button>
          </div>
          <p class="text-gray-300">
            Draw a rectangle around the star you want to analyze by clicking and dragging.
          </p>
        </div>

        <!-- Selection Confirmation -->
        <div
          v-if="selectionComplete && !hasResults"
          class="border border-green-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xl text-white font-semibold">Selection Complete</h3>
            <div class="space-x-2">
              <button
                @click="analyzeSelection"
                class="bg-green-700 hover:bg-green-600 text-white py-1 px-3 rounded-md"
              >
                Analyze Selection
              </button>
              <button
                @click="resetSelection"
                class="bg-gray-600 hover:bg-gray-500 text-white py-1 px-3 rounded-md"
              >
                Start Over
              </button>
            </div>
          </div>
          <p class="text-gray-300">
            Your selection is ready to analyze. Click "Analyze Selection" to proceed.
          </p>
        </div>

        <!-- Analysis Results -->
        <div
          v-if="hasResults"
          class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xl text-white font-semibold">Focus Analysis Results</h3>
            <div class="flex space-x-2">
              <button
                @click="saveResults"
                class="bg-green-800 hover:bg-green-700 text-white py-1 px-3 rounded-md"
                title="Save analysis results to file"
              >
                Save Results
              </button>
              <button
                @click="resetAnalysis"
                class="bg-cyan-800 hover:bg-cyan-700 text-white py-1 px-3 rounded-md"
              >
                New Analysis
              </button>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              class="bg-gray-800 p-3 rounded-lg flex flex-col items-center justify-center text-center"
            >
              <div class="text-lg text-gray-300">Focus Error</div>
              <div class="text-3xl font-bold" :class="getFocusErrorClass()">
                {{ results.metrics.focusErrorPixels.toFixed(2) }} px
              </div>
              <div class="text-sm text-gray-400">
                {{ results.metrics.focusErrorMicrons.toFixed(2) }} µm
              </div>
              <div v-if="results.metrics.confidence" class="text-xs text-gray-500 mt-1">
                Confidence: {{ results.metrics.confidence }}%
              </div>
            </div>
            <div
              class="bg-gray-800 p-3 rounded-lg flex flex-col items-center justify-center text-center"
            >
              <div class="text-lg text-gray-300">Status</div>
              <div class="text-2xl font-bold" :class="getFocusStatusClass()">
                {{ getFocusStatusText() }}
              </div>
              <div class="text-sm text-gray-400 mt-1">
                Threshold: {{ focusThreshold.toFixed(1) }}px
              </div>
            </div>
            <div
              class="bg-gray-800 p-3 rounded-lg flex flex-col items-center justify-center text-center"
            >
              <div class="text-lg text-gray-300">Mask Angle</div>
              <div class="text-3xl font-bold text-white">
                {{ results.metrics.maskAngle.toFixed(1) }}°
              </div>
              <div class="text-sm text-gray-400">Quality: {{ analysisQuality }}</div>
            </div>
          </div>
        </div>

        <!-- Image Display with Overlay -->
        <div
          class="relative border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
        >
          <div
            v-if="isProcessing"
            class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10 rounded-lg"
          >
            <div class="text-white text-xl">Processing image...</div>
          </div>

          <div
            v-if="!imageLoaded && !isProcessing"
            class="h-96 flex items-center justify-center border border-dashed border-gray-600 rounded-lg"
          >
            <div class="text-gray-400 text-center p-4">
              <p class="text-lg">No image loaded</p>
              <p class="text-sm">Capture a new image or load an existing one to begin analysis</p>
            </div>
          </div>

          <div v-if="imageLoaded" class="relative" ref="imageContainer">
            <img
              ref="displayImage"
              :src="displayImageSrc"
              class="w-full h-auto rounded-lg"
              @load="onImageLoad"
              @mousedown.prevent="startDrag"
              @mousemove="updateDrag"
              @mouseup="endDrag"
              @mouseleave="cancelDrag"
              @touchstart.prevent="startTouchDrag"
              @touchmove.prevent="updateTouchDrag"
              @touchend.prevent="endTouchDrag"
              @touchcancel.prevent="cancelDrag"
              @contextmenu.prevent
              :class="{ 'cursor-crosshair': selectionMode }"
            />

            <!-- Selection rectangle overlay -->
            <div
              v-if="selectionBox.visible"
              class="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none"
              :style="{
                left: `${selectionBox.x}px`,
                top: `${selectionBox.y}px`,
                width: `${selectionBox.width}px`,
                height: `${selectionBox.height}px`,
              }"
            ></div>

            <!-- SVG overlay for diffraction spikes -->
            <svg
              v-if="hasResults"
              class="absolute top-0 left-0 w-full h-full z-10"
              :style="{
                width: '100%',
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
              }"
              ref="svgOverlay"
              :viewBox="`0 0 ${imageWidth} ${imageHeight}`"
              preserveAspectRatio="none"
            >
              <!-- Draw lines first so they appear behind points -->
              <!-- Diffraction spikes -->
              <line
                v-for="(spike, index) in results.spikes"
                :key="`spike-${index}`"
                :x1="spike.start.x"
                :y1="spike.start.y"
                :x2="spike.end.x"
                :y2="spike.end.y"
                :stroke="getSpikeColor(index)"
                :stroke-width="index === 0 ? 3 : 2"
                stroke-opacity="0.85"
              />

              <!-- Focus error indicator -->
              <line
                v-if="intersectionPoint && results.spikes[0]"
                :x1="intersectionPoint.x"
                :y1="intersectionPoint.y"
                :x2="calculatePerpendicularPoint(intersectionPoint, results.spikes[0]).x"
                :y2="calculatePerpendicularPoint(intersectionPoint, results.spikes[0]).y"
                stroke="white"
                stroke-width="2"
                stroke-dasharray="4,2"
              />

              <!-- Intersection point of side spikes -->
              <circle
                v-if="intersectionPoint"
                :cx="intersectionPoint.x"
                :cy="intersectionPoint.y"
                r="4"
                fill="cyan"
                stroke="black"
                stroke-width="1"
              />

              <!-- Center point -->
              <circle
                :cx="results.center.x"
                :cy="results.center.y"
                r="5"
                fill="yellow"
                stroke="black"
                stroke-width="1"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { analyzeImageRegion, analyzeBathinovPattern } from '../utils/bathinovAnalysis';
import apiService from '@/services/apiService';
import { useCameraStore } from '@/store/cameraStore';
import { useToastStore } from '@/store/toastStore';
// Import local test image
import testImageUrl from '../test/Bhatinov.jpg';

// State variables
const displayImageSrc = ref('');
const imageLoaded = ref(false);
const isProcessing = ref(false);
const isCapturing = ref(false);
const results = ref(null);
const displayImage = ref(null);
const fileInput = ref(null);
const imageContainer = ref(null);
const svgOverlay = ref(null);
const imageWidth = ref(0);
const imageHeight = ref(0);
const cameraStore = useCameraStore();
const toastStore = useToastStore();
const intersectionPoint = ref(null);
const focusThreshold = ref(1.5); // User-configurable focus threshold
const autoAnalysis = ref(false); // Auto-analyze on selection
const analysisQuality = ref('balanced'); // Analysis quality setting

// Selection mode state
const selectionMode = ref(false);
const selectionComplete = ref(false);
const isDragging = ref(false);
const selectionBox = ref({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  startX: 0,
  startY: 0,
  visible: false,
});
const selectionRegion = ref(null);

// Ensure overlay gets resized when window resizes
onMounted(() => {
  window.addEventListener('resize', updateOverlayDimensions);
});

// Clean up event listeners
onUnmounted(() => {
  window.removeEventListener('resize', updateOverlayDimensions);
});

// Watch for image load and update overlay dimensions
watch(imageLoaded, async (newValue) => {
  if (newValue) {
    await nextTick();
    updateOverlayDimensions();
    // Enable selection mode when image is loaded
    selectionMode.value = true;
  }
});

// Computed properties
const hasResults = computed(() => results.value !== null);

// Update SVG overlay dimensions to match current image size
function updateOverlayDimensions() {
  if (displayImage.value && imageContainer.value) {
    // Get the original image dimensions from the display image
    const originalWidth = displayImage.value.naturalWidth;
    const originalHeight = displayImage.value.naturalHeight;

    // Get the current displayed dimensions
    const rect = displayImage.value.getBoundingClientRect();
    imageWidth.value = originalWidth;
    imageHeight.value = originalHeight;

    if (svgOverlay.value) {
      // Force SVG to maintain same aspect ratio as the image
      svgOverlay.value.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
      svgOverlay.value.style.width = `${rect.width}px`;
      svgOverlay.value.style.height = `${rect.height}px`;
    }

    console.log(`SVG dimensions set to ${imageWidth.value}x${imageHeight.value}`);
  }
}

// Selection rectangle handling (fixed and with touch support)
function startDrag(event) {
  if (!selectionMode.value) return;

  event.preventDefault(); // Prevent image dragging
  isDragging.value = true;
  const rect = displayImage.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  selectionBox.value = {
    startX: x,
    startY: y,
    x: x,
    y: y,
    width: 0,
    height: 0,
    visible: true,
  };
}

function updateDrag(event) {
  if (!isDragging.value) return;

  const rect = displayImage.value.getBoundingClientRect();
  const x = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
  const y = Math.min(Math.max(0, event.clientY - rect.top), rect.height);

  const width = x - selectionBox.value.startX;
  const height = y - selectionBox.value.startY;

  // Calculate top-left position based on drag direction
  selectionBox.value.x = width >= 0 ? selectionBox.value.startX : x;
  selectionBox.value.y = height >= 0 ? selectionBox.value.startY : y;

  // Ensure width and height are always positive
  selectionBox.value.width = Math.abs(width);
  selectionBox.value.height = Math.abs(height);
}

function endDrag() {
  if (!isDragging.value) return;

  isDragging.value = false;

  // Only continue if we have a meaningful selection (not just a click)
  if (selectionBox.value.width < 10 || selectionBox.value.height < 10) {
    selectionBox.value.visible = false;
    return;
  }

  // Calculate the region in the original image coordinates
  calculateSelectionRegion();

  // Mark selection as complete
  selectionComplete.value = true;
  selectionMode.value = false;

  // Auto-analyze if enabled
  if (autoAnalysis.value) {
    setTimeout(() => {
      analyzeSelection();
    }, 100); // Small delay to ensure UI updates
  }
}

// Touch event handlers for mobile support
function startTouchDrag(event) {
  if (!selectionMode.value || event.touches.length !== 1) return;

  event.preventDefault(); // Prevent scrolling
  isDragging.value = true;

  const touch = event.touches[0];
  const rect = displayImage.value.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  selectionBox.value = {
    startX: x,
    startY: y,
    x: x,
    y: y,
    width: 0,
    height: 0,
    visible: true,
  };
}

function updateTouchDrag(event) {
  if (!isDragging.value || event.touches.length !== 1) return;

  const touch = event.touches[0];
  const rect = displayImage.value.getBoundingClientRect();
  const x = Math.min(Math.max(0, touch.clientX - rect.left), rect.width);
  const y = Math.min(Math.max(0, touch.clientY - rect.top), rect.height);

  const width = x - selectionBox.value.startX;
  const height = y - selectionBox.value.startY;

  // Calculate top-left position based on drag direction
  selectionBox.value.x = width >= 0 ? selectionBox.value.startX : x;
  selectionBox.value.y = height >= 0 ? selectionBox.value.startY : y;

  // Ensure width and height are always positive
  selectionBox.value.width = Math.abs(width);
  selectionBox.value.height = Math.abs(height);
}

function endTouchDrag() {
  endDrag();
}

function cancelDrag() {
  if (isDragging.value) {
    isDragging.value = false;
    selectionBox.value.visible = false;
  }
}

function cancelSelection() {
  selectionMode.value = false;
  selectionComplete.value = false;
  selectionBox.value.visible = false;
  isDragging.value = false;
}

function resetSelection() {
  selectionMode.value = true;
  selectionComplete.value = false;
  selectionBox.value.visible = false;
}

function resetAnalysis() {
  results.value = null;
  intersectionPoint.value = null;
  selectionMode.value = true;
  selectionComplete.value = false;
  selectionBox.value.visible = false;
}

// Save analysis results to file
function saveResults() {
  if (!results.value) {
    toastStore.showToast({
      type: 'error',
      title: 'No Results',
      message: 'No analysis results to save.',
    });
    return;
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bathinov-analysis-${timestamp}.json`;

    const exportData = {
      timestamp: new Date().toISOString(),
      analysisSettings: {
        focusThreshold: focusThreshold.value,
        analysisQuality: analysisQuality.value,
        autoAnalysis: autoAnalysis.value,
      },
      results: {
        center: results.value.center,
        spikes: results.value.spikes,
        metrics: results.value.metrics,
        intersection: intersectionPoint.value,
      },
      selectionRegion: selectionRegion.value,
      imageInfo: {
        width: imageWidth.value,
        height: imageHeight.value,
        source: displayImageSrc.value.startsWith('blob:') ? 'uploaded-file' : displayImageSrc.value,
      },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up URL
    URL.revokeObjectURL(link.href);

    toastStore.showToast({
      type: 'success',
      title: 'Results Saved',
      message: `Analysis results saved as ${filename}`,
    });
  } catch (error) {
    console.error('Error saving results:', error);
    toastStore.showToast({
      type: 'error',
      title: 'Save Failed',
      message: `Failed to save results: ${error.message}`,
    });
  }
}

function calculateSelectionRegion() {
  const img = displayImage.value;
  if (!img) return;

  // Get the displayed size of the image
  const rect = img.getBoundingClientRect();

  // Calculate scaling factors
  const scaleX = img.naturalWidth / rect.width;
  const scaleY = img.naturalHeight / rect.height;

  // Calculate coordinates in the original image
  const x = Math.round(selectionBox.value.x * scaleX);
  const y = Math.round(selectionBox.value.y * scaleY);
  const width = Math.round(selectionBox.value.width * scaleX);
  const height = Math.round(selectionBox.value.height * scaleY);

  selectionRegion.value = { x, y, width, height };
  console.log('Selection region in original coordinates:', selectionRegion.value);
}

async function analyzeSelection() {
  if (!selectionRegion.value || !displayImageSrc.value) return;

  try {
    isProcessing.value = true;

    // Create a fallback implementation with quality settings
    let analysisFunction = async (url, region) => {
      // First load the full image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.crossOrigin = 'Anonymous';
        img.src = url;
      });

      // Create a canvas for the region
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = region.width;
      canvas.height = region.height;

      // Draw only the selected region to the canvas
      ctx.drawImage(
        img,
        region.x,
        region.y,
        region.width,
        region.height, // Source rectangle
        0,
        0,
        region.width,
        region.height // Destination rectangle
      );

      // Now analyze this region
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Apply quality settings to the analysis
      const analysisConfig = getAnalysisConfig();
      console.log('Using analysis config:', analysisConfig);

      // Use the imported analyzeBathinovPattern function
      const results = analyzeBathinovPattern(imageData, analysisConfig);

      // Adjust coordinates to be relative to the original image
      if (results && results.spikes) {
        // Adjust center position
        if (results.center) {
          results.center.x += region.x;
          results.center.y += region.y;
        }

        // Adjust spike coordinates
        results.spikes = results.spikes.map((spike) => ({
          start: {
            x: spike.start.x + region.x,
            y: spike.start.y + region.y,
          },
          end: {
            x: spike.end.x + region.x,
            y: spike.end.y + region.y,
          },
          angle: spike.angle,
          originalAngle: spike.originalAngle,
        }));
      }

      return {
        results,
        dimensions: {
          width: img.width,
          height: img.height,
        },
        region,
      };
    };

    // Use imported function if available, otherwise use our fallback
    const effectiveAnalyzeFunction =
      typeof analyzeImageRegion === 'function' ? analyzeImageRegion : analysisFunction;

    const analysisResults = await effectiveAnalyzeFunction(
      displayImageSrc.value,
      selectionRegion.value
    );

    results.value = analysisResults.results;

    console.log('Analysis results:', results.value);

    // Calculate intersection point of side spikes
    if (results.value && results.value.spikes.length >= 3) {
      intersectionPoint.value = calculateIntersection(
        results.value.spikes[1],
        results.value.spikes[2]
      );
      console.log('Intersection point calculated:', intersectionPoint.value);
    }

    // Force update after results are set
    await nextTick();
    updateOverlayDimensions();

    // Show success message with focus status
    const focusStatus = getFocusStatusText();
    const errorPixels = results.value?.metrics?.focusErrorPixels || 0;

    toastStore.showToast({
      type: errorPixels < focusThreshold.value ? 'success' : 'warning',
      title: 'Analysis Complete',
      message: `Focus Status: ${focusStatus} (${errorPixels.toFixed(2)}px error)`,
    });

    selectionComplete.value = false;
  } catch (error) {
    console.error('Error analyzing image region:', error);
    toastStore.showToast({
      type: 'error',
      title: 'Analysis Failed',
      message: `Failed to analyze image region: ${error.message}`,
    });
  } finally {
    isProcessing.value = false;
  }
}

// Get analysis configuration based on quality setting
function getAnalysisConfig() {
  const configs = {
    fast: {
      numAngles: 360, // 1 degree steps
      numSamples: 50,
      smoothingWindow: 5,
    },
    balanced: {
      numAngles: 720, // 0.5 degree steps
      numSamples: 100,
      smoothingWindow: 7,
    },
    precise: {
      numAngles: 1440, // 0.25 degree steps
      numSamples: 200,
      smoothingWindow: 9,
    },
  };

  return configs[analysisQuality.value] || configs.balanced;
}

async function loadTestImage() {
  try {
    isProcessing.value = true;
    displayImageSrc.value = testImageUrl;
    imageLoaded.value = true;

    // Wait for the image to fully load
    await new Promise((resolve) => {
      if (displayImage.value && displayImage.value.complete) {
        resolve();
      } else {
        setTimeout(resolve, 500);
      }
    });

    // Enable selection mode
    selectionMode.value = true;
    selectionComplete.value = false;
    results.value = null;
    intersectionPoint.value = null;

    // Update overlay dimensions
    updateOverlayDimensions();
  } catch (error) {
    console.error('Error loading test image:', error);
    toastStore.showToast({
      type: 'error',
      title: 'Loading Failed',
      message: `Failed to load test image: ${error.message}`,
    });
  } finally {
    isProcessing.value = false;
  }
}

async function captureNewImage() {
  try {
    isProcessing.value = true;
    isCapturing.value = true;

    // Use the camera API to capture an image
    await cameraStore.capturePhoto(apiService, 2);

    // Small delay to ensure the image is ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get the captured image result
    const response = await apiService.getCaptureResult();

    if (response.status === 200) {
      const imageUrl = URL.createObjectURL(response.data);
      displayImageSrc.value = imageUrl;
      imageLoaded.value = true;

      // Wait for the image to fully load
      await new Promise((resolve) => {
        if (displayImage.value && displayImage.value.complete) {
          resolve();
        } else {
          setTimeout(resolve, 500);
        }
      });

      // Enable selection mode
      selectionMode.value = true;
      selectionComplete.value = false;
      results.value = null;
      intersectionPoint.value = null;

      // Update overlay dimensions
      updateOverlayDimensions();

      toastStore.showToast({
        type: 'success',
        title: 'Capture Complete',
        message: 'Image captured successfully! Please select a star to analyze.',
      });
    } else {
      throw new Error('Failed to capture image');
    }
  } catch (error) {
    console.error('Error capturing image:', error);
    toastStore.showToast({
      type: 'error',
      title: 'Capture Failed',
      message: `Failed to capture image: ${error.message}`,
    });
  } finally {
    isProcessing.value = false;
    isCapturing.value = false;
  }
}

// File upload functions
function triggerFileUpload() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    isProcessing.value = true;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file');
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Image file size must be less than 10MB');
    }

    // Create object URL for the uploaded file
    const imageUrl = URL.createObjectURL(file);
    displayImageSrc.value = imageUrl;
    imageLoaded.value = true;

    // Wait for the image to fully load
    await new Promise((resolve) => {
      if (displayImage.value && displayImage.value.complete) {
        resolve();
      } else {
        setTimeout(resolve, 500);
      }
    });

    // Enable selection mode
    selectionMode.value = true;
    selectionComplete.value = false;
    results.value = null;
    intersectionPoint.value = null;

    // Update overlay dimensions
    updateOverlayDimensions();

    toastStore.showToast({
      type: 'success',
      title: 'Upload Complete',
      message: 'Image uploaded successfully! Please select a star to analyze.',
    });

    // Clear the file input so the same file can be uploaded again
    event.target.value = '';
  } catch (error) {
    console.error('Error uploading image:', error);
    toastStore.showToast({
      type: 'error',
      title: 'Upload Failed',
      message: `Failed to upload image: ${error.message}`,
    });
  } finally {
    isProcessing.value = false;
  }
}

function onImageLoad() {
  // Image has loaded, adjust SVG overlay dimensions
  console.log('Image loaded, updating overlay dimensions');
  updateOverlayDimensions();
}

// Function to calculate the intersection of two lines
function calculateIntersection(line1, line2) {
  // Line 1 represented as a1x + b1y = c1
  const a1 = line1.end.y - line1.start.y;
  const b1 = line1.start.x - line1.end.x;
  const c1 = a1 * line1.start.x + b1 * line1.start.y;

  // Line 2 represented as a2x + b2y = c2
  const a2 = line2.end.y - line2.start.y;
  const b2 = line2.start.x - line2.end.x;
  const c2 = a2 * line2.start.x + b2 * line2.start.y;

  // Calculate determinant
  const determinant = a1 * b2 - a2 * b1;

  if (determinant === 0) {
    // Lines are parallel, return a point on line1
    return { x: line1.start.x, y: line1.start.y };
  }

  // Calculate intersection point
  const x = (b2 * c1 - b1 * c2) / determinant;
  const y = (a1 * c2 - a2 * c1) / determinant;

  return { x, y };
}

// Function to calculate the perpendicular point from a point to a line
function calculatePerpendicularPoint(point, line) {
  const x0 = point.x;
  const y0 = point.y;
  const x1 = line.start.x;
  const y1 = line.start.y;
  const x2 = line.end.x;
  const y2 = line.end.y;

  // Calculate the perpendicular distance
  const A = x0 - x1;
  const B = y0 - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  const param = dot / len_sq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return { x: xx, y: yy };
}

// Helper functions for UI display
function getFocusErrorClass() {
  if (!results.value) return 'text-white';

  const error = Math.abs(results.value.metrics.focusErrorPixels);
  if (error < focusThreshold.value) return 'text-green-500';
  if (error < focusThreshold.value * 2) return 'text-yellow-500';
  return 'text-red-500';
}

function getFocusStatusClass() {
  if (!results.value) return 'text-white';

  const error = Math.abs(results.value.metrics.focusErrorPixels);
  if (error < focusThreshold.value) return 'text-green-500';
  if (error < focusThreshold.value * 2) return 'text-yellow-500';
  return 'text-red-500';
}

function getFocusStatusText() {
  if (!results.value) return 'Unknown';

  const error = Math.abs(results.value.metrics.focusErrorPixels);
  if (error < focusThreshold.value) return 'In Focus';
  if (error < focusThreshold.value * 2) return 'Slight Defocus';
  return 'Out of Focus';
}

// Get colors for spikes based on their role (central, left, right)
function getSpikeColor(index) {
  // We always want the central spike (index 0) to be green
  // This ensures it matches the strongest vertical line in the pattern
  if (index === 0) return '#00ff00'; // bright green for central spike

  // For the side spikes, we need to distinguish which is which based on their angle
  if (results.value && results.value.spikes) {
    if (results.value.spikes.length >= 3) {
      // If we have three spikes, try to align red and yellow consistently with the image
      // In most bathinov patterns, there's a specific ordering to the spikes

      // Different colors for side spikes based on their actual position
      if (index === 1) {
        return '#ff0000'; // Red for the first side spike
      } else {
        return '#ffff00'; // Yellow for the second side spike
      }
    }
  }

  // Fallback colors if we can't determine the correct ordering
  const colors = ['#00ff00', '#ff0000', '#ffff00'];
  return colors[index % colors.length];
}
</script>

<style scoped>
/* Additional styling if needed */
.image-container {
  position: relative;
  width: 100%;
}

/* Ensure SVG overlay stays aligned with image */
svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

/* Selection box styling */
.cursor-crosshair {
  cursor: crosshair;
}

/* Add mobile optimization styles */
@media (max-width: 640px) {
  .image-container img {
    touch-action: none; /* Prevent browser handling of touch gestures */
  }
}
</style>
