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
</style><template>
  <div>
    <button
      @click="toggleControls"
      class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
      :class="{ 'bg-cyan-600': settingsVisible }"
    >
      <Cog6ToothIcon class="w-7 h-7" />
    </button>
  </div>
  <!-- Date/Time Control Panel -->
  <div
    v-if="settingsVisible"
    class="fixed inset-0 z-50 flex bg-transparent"
    :class="containerClasses"
    @click.self="settingsVisible = false"
  >
    <div
      v-if="settingsVisible"
      :class="modalClasses"
      class="flex flex-col gap-1 bg-black bg-opacity-90 backdrop-blur-sm p-4 rounded-lg shadow-lg text-white border border-gray-600"
    >
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
            @click="
              settingsStore.stellarium.landscapesVisible =
                !settingsStore.stellarium.landscapesVisible
            "
            :status-value="settingsStore.stellarium.landscapesVisible"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStellariumStore } from '@/store/stellariumStore';
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { watch, ref, computed } from 'vue';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';

const stellariumStore = useStellariumStore();
const settingsStore = useSettingsStore();
const settingsVisible = ref(false);

function toggleControls() {
  settingsVisible.value = !settingsVisible.value;
}

// Check if in landscape mode
const isLandscape = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth > window.innerHeight;
  }
  return false;
});

// Container positioning classes
const containerClasses = computed(() => ({
  // Portrait mode - centered, top
  'items-start justify-center pt-24': !isLandscape.value,
  // Landscape mode - left side, centered vertically
  'items-center justify-start pl-4': isLandscape.value,
}));

// Modal positioning classes
const modalClasses = computed(() => ({
  // Portrait mode - auto width
  'w-72': !isLandscape.value,
  // Landscape mode - responsive width, max height
  'w-80 max-h-[80vh] overflow-y-auto': isLandscape.value,
}));

watch(() => settingsStore.stellarium, stellariumStore.updateStellariumCore, { deep: true });
</script>