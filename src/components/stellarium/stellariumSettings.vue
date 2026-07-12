<template>
  <button
    @click="toggleControls"
    class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
    :class="{ 'bg-cyan-600': settingsVisible }"
  >
    <Cog6ToothIcon class="w-7 h-7" />
  </button>

  <Modal :show="settingsVisible" @close="settingsVisible = false" zIndex="z-40">
    <template #header>
      <h3>{{ $t('components.stellarium.settings.title') }}</h3>
    </template>
    <template #body>
      <!-- Settings Container with conditional grid layout -->
      <div :class="settingsContainerClasses">
        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="constellationsLinesVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.constellations_lines_visible') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.constellationsLinesVisible =
                  !settingsStore.stellarium.constellationsLinesVisible
              "
              :status-value="settingsStore.stellarium.constellationsLinesVisible"
            />
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="azimuthalLinesVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.azimuthal_lines_visible') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.azimuthalLinesVisible =
                  !settingsStore.stellarium.azimuthalLinesVisible
              "
              :status-value="settingsStore.stellarium.azimuthalLinesVisible"
            />
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="equatorialLinesVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.equatorial_lines_visible') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.equatorialLinesVisible =
                  !settingsStore.stellarium.equatorialLinesVisible
              "
              :status-value="settingsStore.stellarium.equatorialLinesVisible"
            />
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="meridianLinesVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.meridian_lines_visible') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.meridianLinesVisible =
                  !settingsStore.stellarium.meridianLinesVisible
              "
              :status-value="settingsStore.stellarium.meridianLinesVisible"
            />
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="eclipticLinesVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.ecliptic_lines_visible') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.eclipticLinesVisible =
                  !settingsStore.stellarium.eclipticLinesVisible
              "
              :status-value="settingsStore.stellarium.eclipticLinesVisible"
            />
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="atmosphereVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.atmosphere_visible') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.atmosphereVisible =
                  !settingsStore.stellarium.atmosphereVisible
              "
              :status-value="settingsStore.stellarium.atmosphereVisible"
            />
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="landscapesVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.landscapes_visible') }}
          </label>
          <div>
            <toggleButton
              @click="showLandscape"
              :status-value="settingsStore.stellarium.landscapesVisible"
            />
          </div>
        </div>

        <div
          v-if="rendererManaged"
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="hideBelowHorizon" class="text-gray-400">
            {{ $t('components.stellarium.settings.hide_below_horizon') }}
          </label>
          <div>
            <toggleButton
              @click="
                settingsStore.stellarium.hideBelowHorizon =
                  settingsStore.stellarium.hideBelowHorizon === false
              "
              :status-value="settingsStore.stellarium.hideBelowHorizon !== false"
            />
          </div>
        </div>

        <div
          v-if="settingsStore.stellarium.landscapesVisible"
          class="w-full border border-gray-500 p-2 rounded-lg col-span-full"
        >
          <label for="landscapeSourceMode" class="text-gray-400 block mb-1">
            {{ $t('components.stellarium.settings.landscape_source_mode') }}
          </label>
          <select
            id="landscapeSourceMode"
            v-model="landscapeSourceSelection"
            class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
          >
            <option value="default">
              {{ $t('components.stellarium.settings.landscape_source_default') }}
            </option>
            <option value="neutral">
              {{ $t('components.stellarium.settings.landscape_source_neutral') }}
            </option>
            <option
              v-for="landscapeOption in listedLandscapeOptions"
              :key="landscapeOption.value"
              :value="landscapeOption.value"
            >
              {{
                $t('components.stellarium.settings.landscape_option_label', {
                  title: landscapeOption.title,
                })
              }}
            </option>
            <option value="custom">
              {{ $t('components.stellarium.settings.landscape_source_custom') }}
            </option>
          </select>

          <div
            v-if="settingsStore.stellarium.landscapeSourceMode === 'custom'"
            class="mt-2 grid gap-2"
          >
            <div>
              <label for="customLandscapeUrl" class="text-gray-400 block mb-1 text-sm">
                {{ $t('components.stellarium.settings.custom_landscape_url') }}
              </label>
              <input
                id="customLandscapeUrl"
                v-model="settingsStore.stellarium.customLandscapeUrl"
                type="text"
                class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                :placeholder="$t('components.stellarium.settings.custom_landscape_url_placeholder')"
              />
            </div>

            <div>
              <label for="customLandscapeKey" class="text-gray-400 block mb-1 text-sm">
                {{ $t('components.stellarium.settings.custom_landscape_key') }}
              </label>
              <input
                id="customLandscapeKey"
                v-model="settingsStore.stellarium.customLandscapeKey"
                type="text"
                class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                :placeholder="$t('components.stellarium.settings.custom_landscape_key_placeholder')"
              />
            </div>
          </div>

          <div class="mt-3 flex justify-end">
            <button
              class="px-3 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!landscapeSourceDirty"
              @click="saveLandscapeSourceSettings"
            >
              {{ $t('general.save') }}
            </button>
          </div>

          <div class="mt-3 border border-gray-600 rounded-lg p-2 bg-gray-800/40">
            <div class="flex items-center justify-between gap-2">
              <p class="text-gray-300 text-sm font-medium">
                {{ $t('components.stellarium.settings.available_landscapes') }}
              </p>
              <button
                type="button"
                class="px-2 py-1 rounded border border-gray-500 bg-gray-700 hover:bg-gray-600 text-xs text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="landscapeListLoading"
                @click="fetchAvailableLandscapes"
              >
                {{ $t('common.refresh') }}
              </button>
            </div>

            <div class="mt-2 text-sm">
              <p v-if="landscapeListLoading" class="text-gray-400">{{ $t('common.loading') }}</p>
              <p v-else-if="landscapeListError" class="text-red-400">{{ landscapeListError }}</p>
              <p
                v-else-if="landscapeListLoaded && availableLandscapes.length === 0"
                class="text-gray-400"
              >
                {{ $t('components.stellarium.settings.no_landscapes_available') }}
              </p>

              <ul v-else class="space-y-2 max-h-52 overflow-y-auto pr-1">
                <li
                  v-for="(landscape, index) in availableLandscapes"
                  :key="`${landscape.folderName || 'unknown'}-${landscape.serviceUrl || index}`"
                  class="rounded border border-gray-700 bg-gray-900/60 p-2"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-gray-100 font-medium truncate">
                      {{
                        landscape.title ||
                        landscape.folderName ||
                        $t('components.stellarium.settings.untitled_landscape')
                      }}
                    </p>
                    <span
                      class="text-[10px] px-2 py-0.5 rounded-full"
                      :class="
                        landscape.hasAllsky
                          ? 'bg-green-900 text-green-200'
                          : 'bg-yellow-900 text-yellow-200'
                      "
                    >
                      {{
                        landscape.hasAllsky
                          ? $t('components.stellarium.settings.has_allsky')
                          : $t('components.stellarium.settings.no_allsky')
                      }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-400 mt-1 break-all">
                    {{ $t('components.stellarium.settings.folder_name_label') }}:
                    {{ landscape.folderName || '—' }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1 break-all">
                    {{ $t('components.stellarium.settings.service_url_label') }}:
                    {{ landscape.serviceUrl || '—' }}
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          class="flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
        >
          <label for="dsosVisible" class="text-gray-400">
            {{ $t('components.stellarium.settings.dsos_visible') }}
          </label>
          <div>
            <toggleButton
              @click="settingsStore.stellarium.dsosVisible = !settingsStore.stellarium.dsosVisible"
              :status-value="settingsStore.stellarium.dsosVisible"
            />
          </div>
        </div>

        <div
          v-if="rendererManaged"
          class="w-full border border-gray-500 p-3 rounded-lg col-span-full grid gap-3"
        >
          <div>
            <p class="text-gray-200 font-medium">
              {{ $t('components.stellarium.settings.brightness_filters') }}
            </p>
            <p class="text-xs text-gray-400">
              {{ $t('components.stellarium.settings.magnitude_limit_hint') }}
            </p>
          </div>

          <label class="grid gap-1" for="starMagnitudeLimit">
            <span class="flex justify-between gap-2 text-sm text-gray-300">
              <span>{{ $t('components.stellarium.settings.star_magnitude_limit') }}</span>
              <output>{{ formatMagnitudeLimit(starMagnitudeLimit) }}</output>
            </span>
            <input
              id="starMagnitudeLimit"
              v-model.number="starMagnitudeLimit"
              type="range"
              min="-2"
              max="6.5"
              step="0.1"
              class="w-full h-11 accent-cyan-500"
            />
          </label>

          <label class="grid gap-1" for="galaxyMagnitudeLimit">
            <span class="flex justify-between gap-2 text-sm text-gray-300">
              <span>{{ $t('components.stellarium.settings.galaxy_magnitude_limit') }}</span>
              <output>{{ formatMagnitudeLimit(galaxyMagnitudeLimit) }}</output>
            </span>
            <input
              id="galaxyMagnitudeLimit"
              v-model.number="galaxyMagnitudeLimit"
              type="range"
              min="-2"
              max="30"
              step="0.5"
              class="w-full h-11 accent-cyan-500"
            />
          </label>

          <label class="grid gap-1" for="deepSkyMagnitudeLimit">
            <span class="flex justify-between gap-2 text-sm text-gray-300">
              <span>{{ $t('components.stellarium.settings.dso_magnitude_limit') }}</span>
              <output>{{ formatMagnitudeLimit(deepSkyMagnitudeLimit) }}</output>
            </span>
            <input
              id="deepSkyMagnitudeLimit"
              v-model.number="deepSkyMagnitudeLimit"
              type="range"
              min="-2"
              max="30"
              step="0.5"
              class="w-full h-11 accent-cyan-500"
            />
          </label>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { useStellariumStore } from '@/store/stellariumStore';
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { watch, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';
import { useOrientation } from '@/composables/useOrientation';
import Modal from '@/components/helpers/Modal.vue';
import apiService from '@/services/apiService';

const props = defineProps({
  rendererManaged: {
    type: Boolean,
    default: false,
  },
});
const { t } = useI18n();
const stellariumStore = useStellariumStore();
const settingsStore = useSettingsStore();
const settingsVisible = ref(false);
const landscapeSourceDirty = ref(false);
const availableLandscapes = ref([]);
const landscapeListLoading = ref(false);
const landscapeListLoaded = ref(false);
const landscapeListError = ref('');

function normalizeLandscapePath(path) {
  return String(path || '')
    .trim()
    .replace(/\/+$/g, '')
    .toLowerCase();
}

const listedLandscapeOptions = computed(() => {
  return availableLandscapes.value
    .filter((item) => {
      const folder = String(item?.folderName || '').toLowerCase();
      return Boolean(folder) && folder !== 'gray' && folder !== 'guereins';
    })
    .map((item) => {
      const folderName = item.folderName;
      const title = item.title || folderName;
      return {
        value: `listed:${folderName}`,
        title,
        folderName,
        serviceUrl: item.serviceUrl,
      };
    });
});

function applyListedLandscapeSelection(folderName) {
  const selected = listedLandscapeOptions.value.find((option) => option.folderName === folderName);
  if (!selected) return;

  settingsStore.stellarium.landscapeSourceMode = 'custom';
  settingsStore.stellarium.customLandscapeUrl = selected.serviceUrl || `landscapes/${folderName}`;
  settingsStore.stellarium.customLandscapeKey = folderName || 'custom';
}

const landscapeSourceSelection = computed({
  get() {
    const mode = settingsStore.stellarium.landscapeSourceMode;
    if (mode === 'default' || mode === 'neutral') {
      return mode;
    }

    if (mode === 'custom') {
      const customUrl = normalizeLandscapePath(settingsStore.stellarium.customLandscapeUrl);
      const customKey = String(settingsStore.stellarium.customLandscapeKey || '')
        .trim()
        .toLowerCase();

      const listedMatch = listedLandscapeOptions.value.find((option) => {
        const optionUrl = normalizeLandscapePath(option.serviceUrl);
        const optionFolder = String(option.folderName || '')
          .trim()
          .toLowerCase();

        return (
          (customUrl && optionUrl && customUrl === optionUrl) ||
          (customKey && optionFolder && customKey === optionFolder)
        );
      });

      if (listedMatch) {
        return listedMatch.value;
      }

      return 'custom';
    }

    return 'default';
  },
  set(value) {
    if (value === 'default' || value === 'neutral' || value === 'custom') {
      settingsStore.stellarium.landscapeSourceMode = value;
      return;
    }

    if (typeof value === 'string' && value.startsWith('listed:')) {
      const folderName = value.slice('listed:'.length);
      applyListedLandscapeSelection(folderName);
    }
  },
});

function toggleControls() {
  const opening = !settingsVisible.value;
  settingsVisible.value = opening;
  if (opening && !landscapeListLoaded.value && !landscapeListLoading.value) {
    void fetchAvailableLandscapes();
  }
}

function requestStellariumRefresh() {
  if (props.rendererManaged) return;
  const event = new CustomEvent('refresh-stellarium');
  window.dispatchEvent(event);
}

function saveLandscapeSourceSettings() {
  requestStellariumRefresh();
  landscapeSourceDirty.value = false;
}

function showLandscape() {
  settingsStore.stellarium.landscapesVisible = !settingsStore.stellarium.landscapesVisible;
  requestStellariumRefresh();
}

async function fetchAvailableLandscapes() {
  landscapeListLoading.value = true;
  landscapeListError.value = '';

  try {
    const response = await apiService.listStellariumLandscapes();
    if (response?.success === true) {
      const rawItems = Array.isArray(response.landscapes) ? response.landscapes : [];
      availableLandscapes.value = rawItems.map((item) => ({
        folderName: item?.folderName ?? item?.FolderName ?? '',
        title: item?.title ?? item?.Title ?? '',
        serviceUrl: item?.serviceUrl ?? item?.ServiceUrl ?? '',
        hasAllsky: item?.hasAllsky ?? item?.HasAllsky ?? false,
      }));
    } else {
      availableLandscapes.value = [];
      landscapeListError.value =
        response?.message || t('components.stellarium.settings.landscape_list_load_failed');
    }
  } catch (error) {
    const responseMessage = error?.response?.data?.message || error?.response?.data?.error;
    landscapeListError.value =
      responseMessage ||
      error?.message ||
      t('components.stellarium.settings.landscape_list_load_failed');
    availableLandscapes.value = [];
  } finally {
    landscapeListLoading.value = false;
    landscapeListLoaded.value = true;
  }
}

// Check if in landscape mode
const { isLandscape } = useOrientation();

// Settings container classes for grid layout
const settingsContainerClasses = computed(() => ({
  // Portrait mode - single column
  'flex flex-col gap-1': !isLandscape.value,
  // Landscape mode - two columns
  'grid grid-cols-2 gap-2': isLandscape.value,
}));

function formatMagnitudeLimit(value) {
  return value === 30 ? t('components.stellarium.settings.magnitude_limit_auto') : value.toFixed(1);
}

function createMagnitudeModel(key, fallback, minimum, maximum) {
  return computed({
    get() {
      const value = Number(settingsStore.stellarium[key]);
      return Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, value)) : fallback;
    },
    set(value) {
      settingsStore.stellarium[key] = Math.max(minimum, Math.min(maximum, Number(value)));
    },
  });
}

const starMagnitudeLimit = createMagnitudeModel('starMagnitudeLimit', 6.5, -2, 6.5);
const galaxyMagnitudeLimit = createMagnitudeModel('galaxyMagnitudeLimit', 30, -2, 30);
const deepSkyMagnitudeLimit = createMagnitudeModel('deepSkyMagnitudeLimit', 30, -2, 30);

watch(
  () => [
    settingsStore.stellarium.constellationsLinesVisible,
    settingsStore.stellarium.azimuthalLinesVisible,
    settingsStore.stellarium.equatorialLinesVisible,
    settingsStore.stellarium.meridianLinesVisible,
    settingsStore.stellarium.eclipticLinesVisible,
    settingsStore.stellarium.atmosphereVisible,
    settingsStore.stellarium.landscapesVisible,
    settingsStore.stellarium.hideBelowHorizon,
    settingsStore.stellarium.dsosVisible,
  ],
  () => {
    if (!props.rendererManaged) stellariumStore.updateStellariumCore();
  }
);

watch(
  () => [
    settingsStore.stellarium.landscapeSourceMode,
    settingsStore.stellarium.customLandscapeUrl,
    settingsStore.stellarium.customLandscapeKey,
  ],
  () => {
    landscapeSourceDirty.value = true;
  }
);
</script>
<style scoped>
/* Scrollbar styling for landscape mode */
@media screen and (orientation: landscape) {
  .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 2px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.7);
  }
}

/* Responsive adjustments */
@media screen and (orientation: landscape) and (max-height: 600px) {
  /* For very short landscape screens */
  .max-h-\[80vh\] {
    max-height: 90vh !important;
  }
}
</style>
