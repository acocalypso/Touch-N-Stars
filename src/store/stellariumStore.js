import { defineStore } from 'pinia';
import { useSettingsStore } from './settingsStore';

export const useStellariumStore = defineStore('stellariumStore', {
  state: () => ({
    stel: null,
    baseUrl: '',
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
        // core.landscapes.visible = settingsStore.stellarium.landscapesVisible;
        if (settingsStore.stellarium.landscapesVisible) {
          core.landscapes.addDataSource({
            url: this.baseUrl + 'landscapes/guereins',
            key: 'guereins',
          });
        } else {
          core.landscapes.addDataSource({ url: this.baseUrl + 'landscapes/gray', key: 'gray' });
        }
        core.landscapes.visible = true;

        console.log('Stellarium settings updated:');
      }
    },
  },
});
