<template>
  <div class="stellarium-container" :class="containerClasses">
    <!-- Canvas für Stellarium -->
    <canvas ref="stelCanvas" class="stellarium-canvas"></canvas>

    <!-- Button für das Suchfeld (Lupe) -->
    <button
      @click="toggleSearch"
      :class="searchButtonClasses"
      class="absolute p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
    >
      <MagnifyingGlassIcon class="w-6 h-6 text-white" />
    </button>

    <!-- Mount Position Component -->
    <stellariumMount
      v-if="stellariumStore.stel && store.mountInfo.Connected"
      ref="mountComponent"
      :canvasRef="stelCanvas"
      :isSearchVisible="isSearchVisible"
    />

    <!-- Overlay für das Suchfeld -->
    <div
      v-if="isSearchVisible"
      :class="searchModalClasses"
      class="absolute bg-black bg-opacity-80 p-4 rounded-lg shadow-lg text-white w-80"
      style="z-index: 100"
    >
      <steallriumSearch ref="searchComponent" />
    </div>

    <!-- Overlay für das ausgewählte Objekt -->
    <SelectedObject
      v-if="selectedObject"
      :selectedObject="selectedObject"
      :selectedObjectRa="selectedObjectRa"
      :selectedObjectDec="selectedObjectDec"
      :selectedObjectRaDeg="selectedObjectRaDeg"
      :selectedObjectDecDeg="selectedObjectDecDeg"
      @setFramingCoordinates="setFramingCoordinates"
    />
    <div
      :class="controlsClasses"
      class="fixed flex gap-2 bg-black bg-opacity-90 p-2 rounded-full stellarium-controls"
      style="bottom: calc(env(safe-area-inset-bottom, 0px) + 48px)"
    >
      <stellariumCredits />
      <stellariumSettings />

      <!-- Clock -->
      <stellariumClock v-if="stellariumStore.stel" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/utils/utils';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useStellariumStore } from '@/store/stellariumStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Capacitor } from '@capacitor/core';
import { useRouter } from 'vue-router';
import steallriumSearch from '@/components/stellarium/steallriumSearch.vue';
import stellariumMount from '@/components/stellarium/stellariumMount.vue';
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import stellariumCredits from '@/components/stellarium/stellariumCredits.vue';
import SelectedObject from '@/components/stellarium/SelectedObject.vue';
import stellariumSettings from '@/components/stellarium/stellariumSettings.vue';
import stellariumClock from '@/components/stellarium/stellariumClock.vue';

const store = apiStore();
const framingStore = useFramingStore();
const stellariumStore = useStellariumStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const stelCanvas = ref(null);
const selectedObject = ref(null);
const selectedObjectRa = ref(null);
const selectedObjectDec = ref(null);
const selectedObjectRaDeg = ref(null);
const selectedObjectDecDeg = ref(null);
const wasmPath = '/stellarium-js/stellarium-web-engine.wasm';
const isSearchVisible = ref(false);
const searchComponent = ref(null);
const mountComponent = ref(null);

// Check if in landscape mode
const isLandscape = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth > window.innerHeight;
  }
  return false;
});

// Container classes for responsive layout
const containerClasses = computed(() => ({
  'stellarium-portrait': !isLandscape.value,
  'stellarium-landscape': isLandscape.value,
}));

// Controls positioning classes
const controlsClasses = computed(() => ({
  'left-2': !isLandscape.value, // Portrait: left side
  'left-2': isLandscape.value, // Landscape: left side (changed from right to left)
}));

// Search button positioning classes
const searchButtonClasses = computed(() => ({
  'top-24 right-3': !isLandscape.value, // Portrait: below navigation
  'top-3 right-3': isLandscape.value, // Landscape: top right
}));

// Search modal positioning classes
const searchModalClasses = computed(() => ({
  'top-28 left-1/2 transform -translate-x-1/2': !isLandscape.value, // Portrait: below navigation, centered
  'top-16 right-4': isLandscape.value, // Landscape: lower position, right side
}));

// Funktion zum Ein-/Ausblenden des Suchfeldes
function toggleSearch(event) {
  // Prevent default behavior if event is provided
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Platform detection for iOS-specific handling using Capacitor
  const isIOS = Capacitor.getPlatform() === 'ios';

  // For iOS, first clear any existing selection to avoid UI conflicts
  if (isIOS && selectedObject.value) {
    selectedObject.value = null;
  }

  // Use a small delay on iOS to prevent layout issues
  setTimeout(
    () => {
      isSearchVisible.value = !isSearchVisible.value;

      if (isSearchVisible.value) {
        selectedObject.value = null;

        if (isIOS) {
          // For iOS, add extra delay to ensure UI is ready
          setTimeout(() => {
            searchComponent.value?.focusSearchInput();
          }, 100);
        } else {
          nextTick(() => {
            searchComponent.value?.focusSearchInput();
          });
        }
      }
    },
    isIOS ? 50 : 0
  );
}

// Framing-Koordinaten
function setFramingCoordinates() {
  framingStore.RAangleString = selectedObjectRa.value;
  framingStore.DECangleString = selectedObjectDec.value;
  framingStore.RAangle = selectedObjectRaDeg.value;
  framingStore.DECangle = selectedObjectDecDeg.value;
  framingStore.selectedItem = selectedObject.value;
  console.log('Set Framing Coordinates');
  store.mount.currentTab = 'showSlew';
  console.log('store.mount.currentTab', store.mount.currentTab);
  router.push('/mount');
}

watch(
  () => stellariumStore.search.DECangleString,
  (newValue) => {
    console.log('selectedObject:', newValue);
    stellariumStore.search.DECangleString = '';
  }
);

onMounted(async () => {
  //NINA vorbereiten
  await store.fetchProfilInfos();

  // Schritt 1) Stellarium-Web-Engine-Skript dynamisch laden
  const script = document.createElement('script');
  script.src = '/stellarium-js/stellarium-web-engine.js';
  console.log('Stellarium-Web-Engine-Skript wird geladen...');

  script.onload = async () => {
    if (!window.StelWebEngine) {
      console.error('StelWebEngine globales Objekt nicht gefunden!');
      return;
    }

    try {
      const response = await fetch(wasmPath);
      if (!response.ok) {
        throw new Error(`Fehler beim Laden der WASM-Datei: ${response.statusText}`);
      }
      const wasmArrayBuffer = await response.arrayBuffer();
      console.log('WASM-Datei erfolgreich geladen. Größe (Byte):', wasmArrayBuffer.byteLength);

      window.StelWebEngine({
        wasmFile: wasmPath,

        canvas: stelCanvas.value,
        onReady(stel) {
          console.log('Stellarium ist bereit!');
          stellariumStore.stel = stel;

          // Beobachter-Standort setzen (Koordinaten müssen in Radian sein):
          stel.core.observer.latitude = store.profileInfo.AstrometrySettings.Latitude * stel.D2R;
          stel.core.observer.longitude = store.profileInfo.AstrometrySettings.Longitude * stel.D2R;
          stel.core.observer.elevation = store.profileInfo.AstrometrySettings.Elevation;

          console.log('zeit', stel.core.observer.utc);
          //stel.core.observer.tt = 0
          console.log('Aktuelle Beobachterposition:');
          console.log(
            'Breitengrad:',
            stel.core.observer.latitude,
            store.profileInfo.AstrometrySettings.Latitude
          );
          console.log(
            'Längengrad:',
            stel.core.observer.longitude,
            store.profileInfo.AstrometrySettings.Longitude
          );
          console.log('Höhe:', stel.core.observer.elevation);

          // Zeitgeschwindigkeit auf 1 setzen
          stel.core.time_speed = 1;

          // Schritt 3) Datenquellen (Kataloge) hinzufügen
          //IP und Port vom Plugin ermitteln
          const protocol = settingsStore.backendProtocol || 'http';
          const host = settingsStore.connection.ip || window.location.hostname;
          const port = settingsStore.connection.port || window.location.port;
          const baseUrl = `${protocol}://${host}:${port}/stellarium-data/`;
          stellariumStore.baseUrl = baseUrl;
          const core = stel.core;

          //Daten hinzufügen
          core.stars.addDataSource({ url: baseUrl + 'stars' });
          core.skycultures.addDataSource({ url: baseUrl + 'skycultures/western', key: 'western' });
          core.dsos.addDataSource({ url: baseUrl + 'dso' });
          core.dss.addDataSource({ url: baseUrl + 'surveys/dss' });
          //core.landscapes.addDataSource({ url: baseUrl + 'landscapes/guereins', key: 'guereins' });
          //core.landscapes.addDataSource({ url: baseUrl + 'landscapes/gray', key: 'guereins' });
          core.milkyway.addDataSource({ url: baseUrl + 'surveys/milkyway' });
          core.minor_planets.addDataSource({ url: baseUrl + 'mpcorb.dat', key: 'mpc_asteroids' });
          core.planets.addDataSource({ url: baseUrl + 'surveys/sso/moon', key: 'moon' });
          core.planets.addDataSource({ url: baseUrl + 'surveys/sso/sun', key: 'sun' });
          core.planets.addDataSource({ url: baseUrl + 'surveys/sso', key: 'default' });
          core.comets.addDataSource({ url: baseUrl + 'CometEls.txt', key: 'mpc_comets' });
          // core.satellites.addDataSource({url: baseUrl + 'tle_satellite.jsonl.gz',key: 'jsonl/sat', });

          stellariumStore.updateStellariumCore();

          // Schritt 4) Selektion beobachten
          stel.change((obj, attr) => {
            if (attr === 'selection') {
              const selection = core.selection;
              if (!selection) {
                // Abwahl
                selectedObject.value = null;
                console.log('Keine Auswahl (abgewählt).');
                return;
              }
              if (stel.core.selection) {
                isSearchVisible.value = false;
                const selectedDesignations = stel.core.selection.designations();
                selectedObject.value = selectedDesignations;
                console.log('Objekt-Bezeichnungen:', selectedDesignations);
                const info = stel.core.selection;
                //console.log('Objekt-Informationen:', info);

                const raDec = info.getInfo('RADEC');
                console.log(raDec);
                //const cirs = stel.convertFrame(stel.observer, 'ICRF', 'ICRF', raDec);
                const radecCIRS = stel.c2s(raDec);
                console.log('radecCIRS', radecCIRS);
                const ra = stel.anp(radecCIRS[0]); // RA in Radian
                const dec = stel.anpm(radecCIRS[1]); // Dec in Radian

                console.log(ra, dec);

                selectedObjectRa.value = degreesToHMS(rad2deg(ra));
                selectedObjectDec.value = degreesToDMS(rad2deg(dec));
                selectedObjectRaDeg.value = rad2deg(ra);
                selectedObjectDecDeg.value = rad2deg(dec);
              }
            }
          });
        },
      });
    } catch (err) {
      console.error('Fehler bei Fetch oder StelWebEngine:', err);
    }
  };
  document.head.appendChild(script);
});
onBeforeUnmount(() => {
  if (stellariumStore.stel) {
    console.log('Stellarium wird zerstört...');

    // Entferne die Stellarium-Instanz
    stellariumStore.stel = null;

    // Lösche das Canvas-Element (optional, falls nötig)
    if (stelCanvas.value) {
      stelCanvas.value.width = 0;
      stelCanvas.value.height = 0;
    }

    console.log('Stellarium erfolgreich beendet.');
  }
});
</script>

<style scoped>
.stellarium-container {
  position: fixed;
  z-index: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Portrait Mode - Original Style */
.stellarium-portrait {
  top: 0;
  left: 0;
  width: 100vw;
  height: calc(
    100dvh - 82px - 1.5rem - env(safe-area-inset-bottom, 0px)
  ); /* Navigation + Smaller Status Bar Gap */
}

/* Landscape Mode - Adjusted for left navigation */
.stellarium-landscape {
  top: 0;
  left: 6rem; /* Start after left navigation (changed from left: 0) */
  width: calc(100vw - 6rem); /* Account for left navigation (changed from - 5rem) */
  height: calc(100dvh - 2rem - env(safe-area-inset-bottom, 0px)); /* Smaller Status Bar Gap */
}

/* Tablet Landscape Anpassungen */
@media screen and (orientation: landscape) and (max-width: 1024px) {
  .stellarium-landscape {
    left: 8rem !important; /* Start after left navigation (changed from left: 0) */
    width: calc(100vw - 8rem) !important; /* Account for left navigation (changed from - 4.5rem) */
    height: calc(100dvh - 2rem - env(safe-area-inset-bottom, 0px)) !important;
  }
}

/* Controls positioning - position on left side away from left navigation */
@media screen and (orientation: landscape) {
  .stellarium-controls.left-2 {
    left: 7rem !important; /* Move away from left navigation (changed from right: 6rem) */
  }
}

@media screen and (orientation: landscape) and (max-width: 1024px) {
  .stellarium-controls.left-2 {
    left: 9rem !important; /* Adjust for tablet navigation width (changed from right: 5.5rem) */
  }
}

/* Remove Safe Area Support for left/right - only keep basic positioning */
.stellarium-portrait {
  top: 0;
  height: calc(
    100dvh - 82px - 1.5rem - env(safe-area-inset-bottom, 0px)
  );
}

/* Mobile Portrait spezifische Anpassungen */
@media (max-width: 480px) and (orientation: portrait) {
  .stellarium-portrait {
    height: calc(
      100dvh - env(safe-area-inset-bottom, 0px)
    ); /* Navigation + Smaller Status Bar Gap */
  }
}

.stellarium-canvas {
  width: 100%;
  height: 100%;
}
</style>