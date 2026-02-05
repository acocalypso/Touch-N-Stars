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
        core.dsos.visible = settingsStore.stellarium.dsosVisible; // Deep Sky Objects (Messier, NGC, etc.)
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
    async loadComets() {
      if (!this.stel) return;

      try {
        console.log('Fetching comet data...');
        const url =
          'https://github.com/acocalypso/Touch-N-Stars/releases/download/comets-list/comet.json';

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const comets = await response.json();
        console.log(`Loaded ${comets.length} comets.`);

        const stel = this.stel;

        comets.forEach((comet) => {
          // Convert RA/Dec (deg) to Radians
          const raRad = comet.ra_deg * stel.D2R;
          const decRad = comet.dec_deg * stel.D2R;

          // Create ICRF vector from RA/Dec
          const icrfVec = stel.s2c(raRad, decRad);

          // Convert from ICRF to CIRS frame (Current sky)
          const cirsVec = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', icrfVec);

          // Create marker
          const marker = stel.createObj('circle', {
            id: `comet_${comet.name.replace(/\s+/g, '_')}`,
            pos: cirsVec,
            color: [0.2, 0.8, 1, 0.7], // Cyan-ish
            size: [0.005, 0.005], // Small circle
            label: comet.name, // Try adding label
          });

          // If size expects array in view: size: [0.05, 0.05]
          // Let's stick to what was seen in View: size: [0.05, 0.05]
          // Actually, let's verify what View used. It used size: [0.05, 0.05]
          // If I want it to look like a comet, maybe a bit larger/fuzzy?
          // I will use similar style.

          // Note: createObj might return an object wrapper that I can update.
        });

        alert(`Successfully loaded ${comets.length} comets.`);
      } catch (error) {
        console.error('Error loading comets:', error);
        alert('Failed to load comets. Check console for details.');
      }
    },
  },
});
