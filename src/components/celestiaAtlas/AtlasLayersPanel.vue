<template>
  <div class="grid grid-cols-2 gap-2">
    <button
      v-for="layer in layers"
      :key="layer.key"
      class="atlas-layer-chip"
      :class="{ 'is-on': isOn(layer) }"
      type="button"
      :aria-pressed="isOn(layer)"
      @click="toggle(layer)"
    >
      <span class="tns-dot" :class="isOn(layer) ? 'bg-accent' : 'bg-content-faint'" />
      <span class="min-w-0 flex-1 text-left leading-tight">
        {{ $t(`components.celestiaAtlas.settings.${layer.label}`) }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { useSettingsStore } from '@/store/settingsStore';

// Quick toggles for what is drawn on the sky. These are the settings a user flips while
// observing; everything rarer stays in the settings dialog. `defaultOn` marks the keys
// whose stored value is only false when explicitly switched off (missing === on).
const settingsStore = useSettingsStore();

const layers = [
  { key: 'constellationsLinesVisible', label: 'constellations_lines_visible' },
  { key: 'equatorialLinesVisible', label: 'equatorial_lines_visible' },
  { key: 'azimuthalLinesVisible', label: 'azimuthal_lines_visible' },
  { key: 'meridianLinesVisible', label: 'meridian_lines_visible' },
  { key: 'eclipticLinesVisible', label: 'ecliptic_lines_visible' },
  { key: 'dsosVisible', label: 'dsos_visible' },
  { key: 'skySurveyVisible', label: 'sky_survey_visible', defaultOn: true },
  { key: 'atmosphereVisible', label: 'atmosphere_visible' },
  { key: 'landscapesVisible', label: 'landscapes_visible' },
  { key: 'hideBelowHorizon', label: 'hide_below_horizon', defaultOn: true },
];

function isOn(layer) {
  const value = settingsStore.celestiaAtlas[layer.key];
  return layer.defaultOn ? value !== false : Boolean(value);
}

function toggle(layer) {
  settingsStore.celestiaAtlas[layer.key] = !isOn(layer);
}
</script>

<style scoped>
.atlas-layer-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: var(--spacing-touch);
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-content-muted);
  background: var(--color-surface-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-chip);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}
.atlas-layer-chip.is-on {
  color: var(--color-content);
  border-color: rgb(34 211 238 / 45%);
  background: rgb(34 211 238 / 10%);
}
</style>
