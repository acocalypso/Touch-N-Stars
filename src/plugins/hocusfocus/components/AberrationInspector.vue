<template>
  <div class="space-y-6">
    <!-- AutoFocus Action Buttons -->
    <div>
      <h2 class="text-xl font-semibold text-white mb-4">
        {{ $t('plugins.hocusfocus.aberrationInspector.title') }}
      </h2>
      <div class="flex flex-wrap gap-3 mb-6">
        <button
          @click="canRunAutoFocus ? $emit('run') : $emit('stop')"
          :disabled="!cameraConnected || !focuserConnected || isCancelling"
          :class="
            !canRunAutoFocus && cameraConnected && focuserConnected
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-purple-600 hover:bg-purple-700'
          "
          class="px-6 py-2 rounded disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium transition"
        >
          {{
            !canRunAutoFocus && cameraConnected && focuserConnected
              ? $t('plugins.hocusfocus.aberrationInspector.cancelButton')
              : $t('plugins.hocusfocus.aberrationInspector.runButton')
          }}
        </button>
        <button
          @click="$emit('rerun')"
          :disabled="!backendCanRun"
          class="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium transition"
        >
          {{ $t('plugins.hocusfocus.aberrationInspector.loadSaved') }}
        </button>
        <button
          @click="$emit('clear')"
          :disabled="!backendCanRun"
          class="px-6 py-2 rounded bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium transition"
        >
          {{ $t('plugins.hocusfocus.aberrationInspector.clearAnalyses') }}
        </button>
      </div>
    </div>

    <!-- Chart -->
    <div v-if="autoFocusChartActive">
      <h2 class="text-xl font-semibold text-white mb-4">
        {{ $t('plugins.hocusfocus.aberrationInspector.focusCurveAnalysis') }}
      </h2>
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
          <span class="text-gray-400"
            >{{ $t('plugins.hocusfocus.aberrationInspector.backfocusError') }}
          </span>
          <span class="font-semibold">
            {{
              finalFocusData?.BackfocusMicronDelta !== null &&
              finalFocusData?.BackfocusMicronDelta !== undefined &&
              finalFocusData?.BackfocusMicronDelta !== 'NaN' &&
              !isNaN(finalFocusData?.BackfocusMicronDelta)
                ? `${Math.abs(parseFloat(finalFocusData.BackfocusMicronDelta)).toFixed(2)} ${$t('plugins.hocusfocus.aberrationInspector.unitMicrons')}`
                : `${Math.abs(Math.round(parseFloat(finalFocusData?.BackfocusFocuserPositionDelta))).toString()} ${$t('plugins.hocusfocus.aberrationInspector.unitSteps')}`
            }}
          </span>
          <span class="text-gray-400 ml-2">{{
            $t('plugins.hocusfocus.aberrationInspector.moveSensor')
          }}</span>
          <span class="font-semibold ml-1">{{ finalFocusData?.BackfocusDirection || '--' }}</span>
          <span class="text-gray-400">
            {{ $t('plugins.hocusfocus.aberrationInspector.flattener') }})</span
          >
        </p>
      </div>

      <div>
        <p class="text-white">
          <span class="text-gray-400"
            >{{ $t('plugins.hocusfocus.aberrationInspector.hfrDifference') }}
          </span>
          <span class="font-semibold">{{ formatValue(finalFocusData?.BackfocusHFR) }}</span>
        </p>
      </div>

      <div>
        <p class="text-white">
          <span class="text-gray-400"
            >{{ $t('plugins.hocusfocus.aberrationInspector.innerHFR') }}
          </span>
          <span class="font-semibold">{{ formatValue(finalFocusData?.InnerHFR) }}</span>
          <span class="text-gray-400 ml-4"
            >{{ $t('plugins.hocusfocus.aberrationInspector.outerHFR') }}
          </span>
          <span class="font-semibold">{{ formatValue(finalFocusData?.OuterHFR) }}</span>
        </p>
      </div>
    </div>

    <!-- Tilt Corner Measurements Table -->
    <div v-if="autoFocusCompleted">
      <h2 class="text-xl font-semibold text-white mb-4">
        {{ $t('plugins.hocusfocus.aberrationInspector.tiltCornerMeasurements') }}
      </h2>
      <div class="border border-gray-700 rounded-lg bg-gray-900 p-6 overflow-x-auto">
        <table class="w-full text-sm text-gray-300">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="px-4 py-3 text-left font-semibold text-white">
                {{ $t('plugins.hocusfocus.aberrationInspector.sensorSide') }}
              </th>
              <th class="px-4 py-3 text-left font-semibold text-white">
                {{ $t('plugins.hocusfocus.aberrationInspector.focuserPosition') }}
              </th>
              <th class="px-4 py-3 text-left font-semibold text-white">
                {{ $t('plugins.hocusfocus.aberrationInspector.adjustmentSteps') }}
              </th>
              <th class="px-4 py-3 text-left font-semibold text-white">
                {{ $t('plugins.hocusfocus.aberrationInspector.adjustmentMicrons') }}
              </th>
              <th class="px-4 py-3 text-left font-semibold text-white">
                {{ $t('plugins.hocusfocus.aberrationInspector.rSquared') }}
              </th>
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
              <th class="px-4 py-3 text-left font-semibold text-white">BottomRight Steps</th>
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
              <td class="px-4 py-3">{{ formatInteger(history.toprightAdjustmentSteps) }}</td>
              <td class="px-4 py-3">{{ formatInteger(history.bottomleftAdjustmentSteps) }}</td>
              <td class="px-4 py-3">{{ formatInteger(history.bottomrightAdjustmentSteps) }}</td>
              <td class="px-4 py-3">{{ formatInteger(history.backfocusSteps) }}</td>
              <td class="px-4 py-3">{{ formatValue(history.centerRSquared) }}</td>
              <td class="px-4 py-3">{{ formatValue(history.topleftRSquared) }}</td>
              <td class="px-4 py-3">{{ formatValue(history.toprightRSquared) }}</td>
              <td class="px-4 py-3">{{ formatValue(history.bottomleftRSquared) }}</td>
              <td class="px-4 py-3">{{ formatValue(history.bottomrightRSquared) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="tiltMeasurementHistory.length === 0" class="text-center py-8 text-gray-400">
          No tilt measurement history available
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  autoFocusChartActive: Boolean,
  autoFocusChartActivatedOnce: Boolean,
  autoFocusCompleted: Boolean,
  tiltMeasurements: Array,
  tiltMeasurementHistory: Array,
  finalFocusData: Object,
  cameraConnected: Boolean,
  focuserConnected: Boolean,
  isCancelling: Boolean,
  backendCanRun: Boolean,
  isTabActive: Boolean,
  // Callbacks for data updates
  onUpdateStatus: Function,
  onUpdateFinalFocusData: Function,
  onUpdateTiltMeasurements: Function,
  onUpdateTiltMeasurementHistory: Function,
  getRegionFocusPoints: Function,
});

defineEmits(['run', 'stop', 'rerun', 'clear']);

const focusCurveChart = ref(null);
let chartInstance = null;
let pollingActive = false;

const canRunAutoFocus = computed(() => {
  return (
    props.cameraConnected && props.focuserConnected && props.backendCanRun && !props.isCancelling
  );
});

const formatValue = (value) => {
  if (value === null || value === undefined || isNaN(value) || value === 'NaN') {
    return '--';
  }
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return value;
};

const formatInteger = (value) => {
  if (value === null || value === undefined || isNaN(value) || value === 'NaN') {
    return '--';
  }
  if (typeof value === 'number') {
    return Math.round(value).toString();
  }
  return value;
};

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

const updateAberrationInspectorData = async () => {
  // Fetch initial data
  try {
    // Fetch status
    if (props.onUpdateStatus) {
      await props.onUpdateStatus();
    }

    // Fetch final focus data and tilt measurement only if no AF run is happening
    if (props.autoFocusCompleted) {
      if (props.onUpdateFinalFocusData) {
        await props.onUpdateFinalFocusData();
      }
      if (props.onUpdateTiltMeasurements) {
        await props.onUpdateTiltMeasurements();
      }
    }

    if (props.autoFocusChartActive) {
      console.log('[FocusCurve] Initializing chart...');
      const data = await props.getRegionFocusPoints();
      console.log('[FocusCurve] Initial data received:', data);
      if (data && data.regionFocusPoints) {
        // Fetch final focus points if auto focus is completed
        let finalFocusPoints = null;
        console.log(
          '[FocusCurve] autoFocusCompleted:',
          props.autoFocusCompleted,
          'finalFocusData:',
          props.finalFocusData
        );
        if (
          props.autoFocusCompleted &&
          props.finalFocusData &&
          props.finalFocusData.RegionFinalFocusPoints
        ) {
          // RegionFinalFocusPoints comes from getFinalFocusData endpoint and is already serialized
          // We need to convert it to the same format as regionFocusPoints for the chart
          console.log(
            '[FocusCurve] Converting final focus points:',
            props.finalFocusData.RegionFinalFocusPoints
          );
          try {
            finalFocusPoints = convertFinalFocusPointsToChartFormat(
              props.finalFocusData.RegionFinalFocusPoints
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
    if (props.autoFocusChartActivatedOnce) {
      if (props.onUpdateTiltMeasurementHistory) {
        await props.onUpdateTiltMeasurementHistory();
      }
    }
  } catch (err) {
    console.error('Error fetching focus points:', err);
  }
};

// Poll only region focus points when AF is actively running
const updateRegionFocusPointsOnly = async () => {
  try {
    if (props.autoFocusChartActive) {
      console.log('[FocusCurve] Polling region focus points...');
      const data = await props.getRegionFocusPoints();
      if (data && data.regionFocusPoints) {
        // Get final focus points if already completed
        let finalFocusPoints = null;
        if (
          props.autoFocusCompleted &&
          props.finalFocusData &&
          props.finalFocusData.RegionFinalFocusPoints
        ) {
          try {
            finalFocusPoints = convertFinalFocusPointsToChartFormat(
              props.finalFocusData.RegionFinalFocusPoints
            );
          } catch (err) {
            console.error('[FocusCurve] Error converting final focus points:', err);
          }
        }
        updateFocusCurveChart(data.regionFocusPoints, finalFocusPoints);
      }
    }
  } catch (err) {
    console.error('Error polling region focus points:', err);
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

      // Add curve fit data if available
      if (
        regionData.curveFit &&
        regionData.curveFit.CurvePoints &&
        regionData.curveFit.CurvePoints.length > 0
      ) {
        console.log(
          `[FocusCurve] Adding curve fit for ${regionName}:`,
          regionData.curveFit.CurvePoints
        );
        const curvePoints = regionData.curveFit.CurvePoints.map((p) => ({
          x: p.x !== undefined ? p.x : p.X,
          y: p.y !== undefined ? p.y : p.Y,
        }));

        if (curvePoints.length > 0) {
          datasets.push({
            label: '', // No label so it doesn't appear in legend
            data: curvePoints,
            borderColor: colors[idx].border,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5], // Dashed line for curve fit
            pointRadius: 0, // Hide points on the curve
            tension: 0.4,
            fill: false,
            showLine: true,
          });
        }
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

const startPolling = () => {
  pollingActive = true;
  console.log('[FocusCurve] Starting polling...');

  const poll = async () => {
    if (!pollingActive) return;

    try {
      // Only poll region focus points if AF is actively running
      // (AutoFocusChartActive && !AutoFocusCompleted)
      if (props.autoFocusChartActive && !props.autoFocusCompleted) {
        await updateRegionFocusPointsOnly();
      }
      // Otherwise, polling is handled by parent view's status polling
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

const stopPolling = () => {
  pollingActive = false;
  console.log('[FocusCurve] Polling stopped');
};

// Watch for chart active state changes
watch(
  () => props.autoFocusChartActive,
  async (isActive) => {
    if (isActive && props.isTabActive) {
      // Chart became active while tab is visible - reinitialize
      console.log('[FocusCurve] Chart activated - reinitializing');
      // Destroy old instance if it exists
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      // Wait for canvas to be in DOM
      await nextTick();
      // Fetch and initialize chart data
      await updateAberrationInspectorData();
    } else if (!isActive) {
      // Chart deactivated (e.g., cleared) - cleanup
      console.log('[FocusCurve] Chart deactivated - cleaning up');
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    }
  }
);

// Watch for AF completion to fetch final data
watch(
  () => props.autoFocusCompleted,
  async (isCompleted) => {
    if (isCompleted && props.isTabActive) {
      console.log('[FocusCurve] AutoFocus completed - fetching final data');
      try {
        // Fetch final focus data and measurements
        if (props.onUpdateFinalFocusData) {
          await props.onUpdateFinalFocusData();
        }
        if (props.onUpdateTiltMeasurements) {
          await props.onUpdateTiltMeasurements();
        }
        // Update chart with final data
        const data = await props.getRegionFocusPoints();
        if (data && data.regionFocusPoints) {
          let finalFocusPoints = null;
          if (props.finalFocusData && props.finalFocusData.RegionFinalFocusPoints) {
            try {
              finalFocusPoints = convertFinalFocusPointsToChartFormat(
                props.finalFocusData.RegionFinalFocusPoints
              );
            } catch (err) {
              console.error('[FocusCurve] Error converting final focus points:', err);
            }
          }
          updateFocusCurveChart(data.regionFocusPoints, finalFocusPoints);
        }
      } catch (err) {
        console.error('[FocusCurve] Error fetching final data on completion:', err);
      }
    }
  }
);

// Watch for tab activation/deactivation
watch(
  () => props.isTabActive,
  async (isActive) => {
    if (isActive) {
      // Wait for canvas to be rendered in DOM
      await nextTick();
      console.log('[FocusCurve] Tab activated - starting polling');
      // Clear old chart instance
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      // Update chart and start polling
      await updateAberrationInspectorData();
      startPolling();
    } else {
      // Stop polling when leaving tab
      console.log('[FocusCurve] Tab deactivated - stopping polling');
      stopPolling();
      // Destroy chart to free resources
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    }
  },
  { immediate: true }
);

// Cleanup on unmount
onBeforeUnmount(() => {
  stopPolling();
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>
