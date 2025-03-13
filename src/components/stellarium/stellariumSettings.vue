<template>
    <div class="absolute top-3 left-3">

    <div
      class=" max-w-48 flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="constellationsLinesVisible" class="text-gray-400">
        {{ $t('components.sequence.monitor.settings.showGuiderAfGraph') }}
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
      class=" max-w-48 flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="azimuthalLinesVisible" class="text-gray-400">
        {{ $t('components.sequence.monitor.settings.showGuiderAfGraph') }}
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
      class=" max-w-48 flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="equatorialLinesVisible" class="text-gray-400">
        {{ $t('components.sequence.monitor.settings.showGuiderAfGraph') }}
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
      class=" max-w-48 flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="meridianLinesVisible" class="text-gray-400">
        {{ $t('components.sequence.monitor.settings.showGuiderAfGraph') }}
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
      class=" max-w-48 flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="eclipticLinesVisible" class="text-gray-400">
        {{ $t('components.sequence.monitor.settings.showGuiderAfGraph') }}
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
      class=" max-w-48 flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="atmosphereVisible" class="text-gray-400">
        {{ $t('components.sequence.monitor.settings.showGuiderAfGraph') }}
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
      class=" max-w-48 flex flex-row items-center justify-between w-full border border-gray-500 p-2 rounded-lg"
    >
      <label for="landscapesVisible" class="text-gray-400">
        {{ $t('components.sequence.monitor.settings.showGuiderAfGraph') }}
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





</template>

<script setup>
import { useStellariumStore } from '@/store/stellariumStore';
import { useSettingsStore } from '@/store/settingsStore';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { watch, onMounted } from 'vue';


const stellariumStore = useStellariumStore();
const settingsStore = useSettingsStore();

function updateStellariumCore() {
  if (stellariumStore.stel) {
    const core = stellariumStore.stel.core;

    core.constellations.lines_visible = settingsStore.stellarium.constellationsLinesVisible;
    core.constellations.labels_visible = settingsStore.stellarium.constellationsLinesVisible;
    core.lines.azimuthal.visible = settingsStore.stellarium.azimuthalLinesVisible;
    core.lines.equatorial.visible = settingsStore.stellarium.equatorialLinesVisible;
    core.lines.meridian.visible = settingsStore.stellarium.meridianLinesVisible;
    core.lines.ecliptic.visible = settingsStore.stellarium.eclipticLinesVisible;
    core.atmosphere.visible = settingsStore.stellarium.atmosphereVisible;
    core.landscapes.visible = settingsStore.stellarium.landscapesVisible;

    console.log('Stellarium settings updated:', settingsStore.stellarium.constellationsLinesVisible);
  }
}
// Reagieren auf Änderungen im settingsStore.stellarium
watch(
  () => settingsStore.stellarium,
  updateStellariumCore,
  { deep: true } // Sorgt dafür, dass auch Änderungen an verschachtelten Werten erkannt werden
);
onMounted(() => {
  updateStellariumCore();
});


</script>
