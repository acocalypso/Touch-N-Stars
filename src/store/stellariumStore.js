import { defineStore } from 'pinia';
import { useSettingsStore } from './settingsStore';
import { resolveLandscapeSource } from './utils/stellariumLandscapeSource.js';

const activeLandscapes = new WeakMap();

export const useStellariumStore = defineStore('stellariumStore', {
  state: () => ({
    stel: null,
    baseUrl: '',
    lastSearchedName: '',
    // Cached view direction/zoom/time so the view is preserved across
    // destroying and reloading the engine (v-if).
    savedView: null,
    search: {
      RAangle: 0,
      DECangle: 0,
      RAangleString: '',
      DECangleString: '',
    },
  }),
  actions: {
    // Reads the current view from the engine before it is destroyed.
    saveViewState(stel) {
      const engine = stel || this.stel;
      if (!engine || !engine.core) return;
      try {
        const core = engine.core;
        const observer = core.observer;
        this.savedView = {
          yaw: observer?.yaw,
          pitch: observer?.pitch,
          roll: observer?.roll,
          fov: core.fov,
          utc: observer?.utc,
        };
      } catch (e) {
        console.warn('Failed to save Stellarium view state:', e);
      }
    },

    // Restores a previously saved view after the engine has been reloaded.
    restoreViewState(stel) {
      const engine = stel || this.stel;
      if (!engine || !engine.core || !this.savedView) return;
      try {
        const core = engine.core;
        const observer = core.observer;
        const view = this.savedView;
        if (observer) {
          if (typeof view.yaw === 'number') observer.yaw = view.yaw;
          if (typeof view.pitch === 'number') observer.pitch = view.pitch;
          if (typeof view.roll === 'number') observer.roll = view.roll;
          if (typeof view.utc === 'number') observer.utc = view.utc;
        }
        if (typeof view.fov === 'number') core.fov = view.fov;
      } catch (e) {
        console.warn('Failed to restore Stellarium view state:', e);
      }
    },

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

          if (activeLandscapes.get(core) !== nextLandscapeSignature) {
            core.landscapes.addDataSource(landscapeConfig.source);
            activeLandscapes.set(core, nextLandscapeSignature);
          }
        }

        console.log('Stellarium settings updated:');
      }
    },
  },
});
