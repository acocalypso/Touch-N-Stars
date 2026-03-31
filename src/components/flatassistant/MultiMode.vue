<template>
  <div class="flex flex-col w-full max-w-md space-y-3 mt-4">
    <!-- Global settings -->
    <div
      class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5 space-y-3"
    >
      <!-- Mode selector -->
      <div class="flex flex-row w-full items-center">
        <label class="text-sm text-gray-300 mr-3 shrink-0">{{ $t('components.flatassistant.mode') }}</label>
        <select v-model="state.selectedMode" class="default-select h-10 ml-auto w-48">
          <option value="AutoExposure">{{ $t('components.flatassistant.auto_exposure') }}</option>
          <option value="AutoBrightness">{{ $t('components.flatassistant.auto_brightness') }}</option>
          <option value="SkyFlat">{{ $t('components.flatassistant.skyflat') }}</option>
        </select>
      </div>

      <!-- Keep Closed -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-300">{{ $t('components.flatassistant.keep_closed') }}</span>
        <toggleButton
          :statusValue="state.keepClosed"
          @update:statusValue="state.keepClosed = $event"
        />
      </div>
    </div>

    <!-- Filter list -->
    <template v-if="store.filterInfo.Connected && store.filterInfo.AvailableFilters?.length">
      <div
        v-for="filter in store.filterInfo.AvailableFilters"
        :key="filter.Id"
        class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-4 space-y-3"
      >
        <!-- Filter header with toggle -->
        <div
          class="flex items-center justify-between"
          :class="isActive(filter.Id) ? 'cursor-pointer' : ''"
          @click.self="isActive(filter.Id) && toggleExpand(filter.Id)"
        >
          <div
            class="flex items-center gap-2 flex-1 min-w-0"
            @click="isActive(filter.Id) && toggleExpand(filter.Id)"
          >
            <!-- Chevron (only when active) -->
            <svg
              v-if="isActive(filter.Id)"
              class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
              :class="isExpanded(filter.Id) ? 'rotate-90' : ''"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="text-sm font-medium text-white truncate">{{ filter.Name }}</span>
          </div>
          <toggleButton
            :statusValue="isActive(filter.Id)"
            @update:statusValue="toggleFilter(filter.Id, $event)"
          />
        </div>

        <!-- Settings (only when active AND expanded) -->
        <div v-if="isActive(filter.Id) && isExpanded(filter.Id)" class="space-y-2 pt-2 border-t border-gray-700">
          <!-- Count -->
          <NumberInputPicker
            v-model="state.filterConfigs[filter.Id].count"
            :label="$t('components.flatassistant.count')"
            labelKey="components.flatassistant.count"
            :min="1"
            :max="9999"
            :step="1"
            :decimalPlaces="0"
            :inputId="`count-${filter.Id}`"
          />

          <!-- Gain: dropdown if camera has gain list, otherwise free input -->
          <div
            v-if="store.cameraInfo.Gains?.length > 0"
            class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg"
          >
            <label class="text-xs mr-3 mb-1 text-gray-200">
              {{ $t('components.camera.gain_iso') }}
            </label>
            <select
              v-model.number="state.filterConfigs[filter.Id].gain"
              class="default-select ml-auto h-8 w-28"
            >
              <option v-for="value in store.cameraInfo.Gains" :key="value" :value="value">
                {{ value }}
              </option>
            </select>
          </div>
          <NumberInputPicker
            v-else
            v-model="state.filterConfigs[filter.Id].gain"
            :label="$t('components.camera.gain_iso')"
            labelKey="components.camera.gain_iso"
            :min="0"
            :max="9999"
            :step="1"
            :decimalPlaces="0"
            :inputId="`gain-${filter.Id}`"
          />

          <!-- Offset -->
          <NumberInputPicker
            v-model="state.filterConfigs[filter.Id].offset"
            :label="$t('components.camera.offset')"
            labelKey="components.camera.offset"
            :min="0"
            :max="9999"
            :step="1"
            :decimalPlaces="0"
            :inputId="`offset-${filter.Id}`"
          />

          <!-- Binning -->
          <div
            v-if="(store.cameraInfo?.BinningModes?.length || 0) > 1"
            class="flex flex-row w-full items-center min-w-28 border border-gray-500 p-1 rounded-lg"
          >
            <label class="text-xs mr-3 mb-1 text-gray-400">
              {{ $t('components.camera.binning_mode') }}
            </label>
            <select
              v-model="state.filterConfigs[filter.Id].binning"
              class="default-select ml-auto h-8 w-28"
            >
              <option
                v-for="mode in store.cameraInfo.BinningModes"
                :key="mode.Name"
                :value="mode.Name"
              >
                {{ mode.Name }}
              </option>
            </select>
          </div>

          <!-- AutoExposure specific -->
          <template v-if="state.selectedMode === 'AutoExposure'">
            <NumberInputPicker
              v-model="state.filterConfigs[filter.Id].minExposure"
              :label="$t('components.flatassistant.min_exposure_time')"
              labelKey="components.flatassistant.min_exposure_time"
              :min="0.001"
              :max="3600"
              :step="0.01"
              :decimalPlaces="3"
              :inputId="`minExp-${filter.Id}`"
            />
            <NumberInputPicker
              v-model="state.filterConfigs[filter.Id].maxExposure"
              :label="$t('components.flatassistant.max_exposure_time')"
              labelKey="components.flatassistant.max_exposure_time"
              :min="0.001"
              :max="3600"
              :step="1"
              :decimalPlaces="1"
              :inputId="`maxExp-${filter.Id}`"
            />
            <NumberInputPicker
              v-model="state.filterConfigs[filter.Id].brightness"
              :label="$t('components.flatassistant.brightness')"
              labelKey="components.flatassistant.brightness"
              :min="0"
              :max="100"
              :step="1"
              :decimalPlaces="0"
              :inputId="`brightness-${filter.Id}`"
            />
          </template>

          <!-- AutoBrightness specific -->
          <template v-else-if="state.selectedMode === 'AutoBrightness'">
            <NumberInputPicker
              v-model="state.filterConfigs[filter.Id].exposureTime"
              :label="$t('components.flatassistant.exposure_time')"
              labelKey="components.flatassistant.exposure_time"
              :min="0.001"
              :max="3600"
              :step="0.1"
              :decimalPlaces="1"
              :inputId="`expTime-${filter.Id}`"
            />
            <NumberInputPicker
              v-model="state.filterConfigs[filter.Id].minBrightness"
              :label="$t('components.flatassistant.min_brightness')"
              labelKey="components.flatassistant.min_brightness"
              :min="0"
              :max="65535"
              :step="100"
              :decimalPlaces="0"
              :inputId="`minBright-${filter.Id}`"
            />
            <NumberInputPicker
              v-model="state.filterConfigs[filter.Id].maxBrightness"
              :label="$t('components.flatassistant.max_brightness')"
              labelKey="components.flatassistant.max_brightness"
              :min="0"
              :max="65535"
              :step="100"
              :decimalPlaces="0"
              :inputId="`maxBright-${filter.Id}`"
            />
          </template>

          <!-- SkyFlat specific -->
          <template v-else-if="state.selectedMode === 'SkyFlat'">
            <NumberInputPicker
              v-model="state.filterConfigs[filter.Id].minExposure"
              :label="$t('components.flatassistant.min_exposure_time')"
              labelKey="components.flatassistant.min_exposure_time"
              :min="0.001"
              :max="3600"
              :step="0.01"
              :decimalPlaces="3"
              :inputId="`minExp-${filter.Id}`"
            />
            <NumberInputPicker
              v-model="state.filterConfigs[filter.Id].maxExposure"
              :label="$t('components.flatassistant.max_exposure_time')"
              labelKey="components.flatassistant.max_exposure_time"
              :min="0.001"
              :max="3600"
              :step="1"
              :decimalPlaces="1"
              :inputId="`maxExp-${filter.Id}`"
            />
          </template>

          <!-- Histogram settings (all modes) -->
          <NumberInputPicker
            v-model="state.filterConfigs[filter.Id].histogramMean"
            :label="$t('components.flatassistant.histogram_mean_target')"
            labelKey="components.flatassistant.histogram_mean_target"
            :min="0"
            :max="100"
            :step="1"
            :decimalPlaces="0"
            :inputId="`histMean-${filter.Id}`"
          />
          <NumberInputPicker
            v-model="state.filterConfigs[filter.Id].meanTolerance"
            :label="$t('components.flatassistant.mean_tolerance')"
            labelKey="components.flatassistant.mean_tolerance"
            :min="0"
            :max="100"
            :step="1"
            :decimalPlaces="0"
            :inputId="`meanTol-${filter.Id}`"
          />
        </div>
      </div>
    </template>

    <!-- No filter wheel -->
    <div
      v-else
      class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 p-4 text-center text-gray-400 text-sm"
    >
      {{ $t('components.flatassistant.multi_mode_no_filters') }}
    </div>

    <!-- Start / Stop -->
    <div v-show="flatsStore.status.State !== 'Running'">
      <button
        @click="startMultiMode"
        class="default-button-cyan"
        :disabled="state.activeFilterIds.length === 0"
      >
        {{ $t('components.flatassistant.start_multi_mode') }}
      </button>
    </div>
    <div v-show="flatsStore.status.State === 'Running'">
      <button @click="stopFlats" class="default-button-red">
        {{ $t('components.flatassistant.stop') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useFlatassistantStore } from '@/store/flatassistantStore';
import { useCameraStore } from '@/store/cameraStore';
import { useSettingsStore } from '@/store/settingsStore';
import NumberInputPicker from '@/components/helpers/NumberInputPicker.vue';
import toggleButton from '@/components/helpers/toggleButton.vue';

const store = apiStore();
const flatsStore = useFlatassistantStore();
const cameraStore = useCameraStore();
const settingsStore = useSettingsStore();

// Restore saved state or use defaults
const saved = settingsStore.flats.multiMode ?? {};

const state = reactive({
  selectedMode: saved.selectedMode ?? 'AutoExposure',
  keepClosed: saved.keepClosed ?? false,
  activeFilterIds: saved.activeFilterIds ? [...saved.activeFilterIds] : [],
  expandedFilterIds: saved.expandedFilterIds ? [...saved.expandedFilterIds] : [],
  filterConfigs: saved.filterConfigs ? { ...saved.filterConfigs } : {},
});

function defaultConfig() {
  return {
    count: 20,
    gain: store.profileInfo?.CameraSettings?.Gain ?? 100,
    offset: store.profileInfo?.CameraSettings?.Offset ?? 0,
    binning: cameraStore.binningMode ?? '1x1',
    histogramMean: 50,
    meanTolerance: 10,
    minExposure: 0.01,
    maxExposure: 20,
    brightness: 50,
    exposureTime: 2,
    minBrightness: 0,
    maxBrightness: 32000,
  };
}

function ensureFilterConfig(filterId) {
  if (!state.filterConfigs[filterId]) {
    state.filterConfigs[filterId] = defaultConfig();
  }
}

function isActive(filterId) {
  return state.activeFilterIds.includes(filterId);
}

function isExpanded(filterId) {
  return state.expandedFilterIds.includes(filterId);
}

function toggleExpand(filterId) {
  if (isExpanded(filterId)) {
    state.expandedFilterIds = state.expandedFilterIds.filter((id) => id !== filterId);
  } else {
    state.expandedFilterIds.push(filterId);
  }
}

function toggleFilter(filterId, value) {
  if (value) {
    ensureFilterConfig(filterId);
    if (!state.activeFilterIds.includes(filterId)) {
      state.activeFilterIds.push(filterId);
    }
    // Auto-expand when activating
    if (!state.expandedFilterIds.includes(filterId)) {
      state.expandedFilterIds.push(filterId);
    }
  } else {
    state.activeFilterIds = state.activeFilterIds.filter((id) => id !== filterId);
    state.expandedFilterIds = state.expandedFilterIds.filter((id) => id !== filterId);
  }
}

// Sync to settingsStore for session persistence
watch(
  state,
  () => {
    settingsStore.flats.multiMode = {
      selectedMode: state.selectedMode,
      keepClosed: state.keepClosed,
      activeFilterIds: [...state.activeFilterIds],
      expandedFilterIds: [...state.expandedFilterIds],
      filterConfigs: { ...state.filterConfigs },
    };
  },
  { deep: true }
);

async function startMultiMode() {
  const filters = state.activeFilterIds.map((filterId) => {
    const cfg = state.filterConfigs[filterId];
    const base = {
      filterId,
      count: cfg.count,
      gain: cfg.gain,
      offset: cfg.offset,
      binning: cfg.binning,
      histogramMean: cfg.histogramMean,
      meanTolerance: cfg.meanTolerance,
    };
    if (state.selectedMode === 'AutoExposure') {
      return {
        ...base,
        minExposure: cfg.minExposure,
        maxExposure: cfg.maxExposure,
        brightness: cfg.brightness,
      };
    } else if (state.selectedMode === 'AutoBrightness') {
      return {
        ...base,
        exposureTime: cfg.exposureTime,
        minBrightness: cfg.minBrightness,
        maxBrightness: cfg.maxBrightness,
      };
    } else {
      // SkyFlat
      return {
        ...base,
        minExposure: cfg.minExposure,
        maxExposure: cfg.maxExposure,
      };
    }
  });

  const payload = {
    mode: state.selectedMode,
    keepClosed: state.keepClosed,
    filters,
  };

  try {
    await apiService.flatMultiMode(payload);
  } catch (error) {
    console.error('Error starting multimode flats:', error);
  }
}

async function stopFlats() {
  try {
    await apiService.flatassistantAction('stop');
  } catch (error) {
    console.error('Error stopping flats:', error);
  }
}

onMounted(() => {
  // Ensure saved active filters still have configs (in case of partial save)
  state.activeFilterIds.forEach((id) => ensureFilterConfig(id));
});
</script>
