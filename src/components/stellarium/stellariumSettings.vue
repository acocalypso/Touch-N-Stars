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
          v-if="settingsStore.stellarium.landscapesVisible"
          class="w-full border border-gray-500 p-2 rounded-lg col-span-full"
        >
          <label for="landscapeSourceMode" class="text-gray-400 block mb-1">
            {{ $t('components.stellarium.settings.landscape_source_mode') }}
          </label>
          <select
            id="landscapeSourceMode"
            v-model="settingsStore.stellarium.landscapeSourceMode"
            class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
          >
            <option value="default">
              {{ $t('components.stellarium.settings.landscape_source_default') }}
            </option>
            <option value="neutral">
              {{ $t('components.stellarium.settings.landscape_source_neutral') }}
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
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { useStellariumStore } from '@/store/stellariumStore';
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { watch, ref, computed } from 'vue';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';
import { useOrientation } from '@/composables/useOrientation';
import Modal from '@/components/helpers/Modal.vue';

const stellariumStore = useStellariumStore();
const settingsStore = useSettingsStore();
const settingsVisible = ref(false);
const landscapeSourceDirty = ref(false);

function toggleControls() {
  settingsVisible.value = !settingsVisible.value;
}

function requestStellariumRefresh() {
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

// Check if in landscape mode
const { isLandscape } = useOrientation();

// Settings container classes for grid layout
const settingsContainerClasses = computed(() => ({
  // Portrait mode - single column
  'flex flex-col gap-1': !isLandscape.value,
  // Landscape mode - two columns
  'grid grid-cols-2 gap-2': isLandscape.value,
}));

watch(() => settingsStore.stellarium, stellariumStore.updateStellariumCore, { deep: true });

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
