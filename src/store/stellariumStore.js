import { defineStore } from 'pinia';
import { useSettingsStore } from './settingsStore';
import { resolveLandscapeSource } from './utils/stellariumLandscapeSource.js';

export const useStellariumStore = defineStore('stellariumStore', {
  state: () => ({
    stel: null,
    baseUrl: '',
    activeLandscapeSignature: '',
    lastSearchedName: '',
    search: {
      RAangle: 0,
      DECangle: 0,
      RAangleString: '',
      DECangleString: '',
    },
  }),
  actions: {
    updateStellariumCore() {
      const settingsStore = useSettingsStore();
      if (this.stel) {
        const core = this.stel.core;

        core.constellations.lines_visible = settingsStore.stellarium.constellationsLinesVisible;
        core.constellations.labels_visible = settingsStore.stellarium.constellationsLinesVisible;
        core.lines.azimuthal.visible = settingsStore.stellarium.azimuthalLinesVisible;
        core.lines.equatorial.visible = settingsStore.stellarium.equatorialLinesVisible;
        core.lines.meridian.visible = settingsStore.stellarium.meridianLinesVisible;
        core.lines.ecliptic.visible = settingsStore.stellarium.eclipticLinesVisible;
        core.atmosphere.visible = settingsStore.stellarium.atmosphereVisible;
        core.dsos.visible = settingsStore.stellarium.dsosVisible; // Deep Sky Objects (Messier, NGC, etc.)

        const landscapeConfig = resolveLandscapeSource(settingsStore.stellarium, this.baseUrl);
        core.landscapes.visible = landscapeConfig.visible;

        if (landscapeConfig.visible && landscapeConfig.source) {
          const nextLandscapeSignature = `${landscapeConfig.source.key}|${landscapeConfig.source.url}`;

          if (this.activeLandscapeSignature !== nextLandscapeSignature) {
            core.landscapes.addDataSource(landscapeConfig.source);
            this.activeLandscapeSignature = nextLandscapeSignature;
          }
        }

        console.log('Stellarium settings updated:');
      }
    },
  },
});
