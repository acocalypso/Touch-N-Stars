<template>
  <div class="stellarium-container">
    <!-- Canvas für Stellarium -->
    <canvas ref="stelCanvas" class="stellarium-canvas"></canvas>

    <!-- DateTime Control Component -->
    <stellariumDateTime />

    <!-- Button für das Suchfeld (Lupe) -->
    <button
      @click="toggleSearch"
      class="absolute top-3 right-3 p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
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
      class="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 p-4 rounded-lg shadow-lg text-white w-80"
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

    <!-- Credits-->
    <stellariumCredits />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/utils/utils';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useStellariumStore } from '@/store/stellariumStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useRouter } from 'vue-router';
import steallriumSearch from '@/components/stellarium/steallriumSearch.vue';
import stellariumDateTime from '@/components/stellarium/stellariumDateTime.vue';
import stellariumMount from '@/components/stellarium/stellariumMount.vue';
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import stellariumCredits from '@/components/stellarium/stellariumCredits.vue';
import SelectedObject from '@/components/stellarium/SelectedObject.vue';

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

// Funktion zum Ein-/Ausblenden des Suchfeldes
function toggleSearch() {
  isSearchVisible.value = !isSearchVisible.value;

  if (isSearchVisible.value) {
    selectedObject.value = null;
    nextTick(() => {
      searchComponent.value?.focusSearchInput();
    });
  }
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
  await apiService.applicatioTabSwitch('framing');
  await apiService.setFramingImageSource('SKYATLAS');
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
          console.log('Stellarium ist bereit!', stel);
          stellariumStore.stel = stel;
          console.log('Stellarium-Instanz:', stel.core);

          // Beobachter-Standort setzen (Koordinaten müssen in Radian sein):
          stel.core.observer.latitude = store.profileInfo.AstrometrySettings.Latitude * stel.D2R;
          stel.core.observer.longitude = store.profileInfo.AstrometrySettings.Longitude * stel.D2R;
          stel.core.observer.elevation = store.profileInfo.AstrometrySettings.Elevation;
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
          const port = settingsStore.connection.port || 5000;
          const baseUrl = `${protocol}://${host}:${port}/stellarium-data/`;
          const core = stel.core;

          //Daten hinzufügen
          core.stars.addDataSource({ url: baseUrl + 'stars' });
          core.skycultures.addDataSource({ url: baseUrl + 'skycultures/western', key: 'western' });
          core.dsos.addDataSource({ url: baseUrl + 'dso' });
          core.dss.addDataSource({ url: baseUrl + 'surveys/dss' });
          core.landscapes.addDataSource({ url: baseUrl + 'landscapes/guereins', key: 'guereins' });
          core.milkyway.addDataSource({ url: baseUrl + 'surveys/milkyway' });
          core.minor_planets.addDataSource({ url: baseUrl + 'mpcorb.dat', key: 'mpc_asteroids' });
          core.planets.addDataSource({ url: baseUrl + 'surveys/sso/moon', key: 'moon' });
          core.planets.addDataSource({ url: baseUrl + 'surveys/sso/sun', key: 'sun' });
          core.planets.addDataSource({ url: baseUrl + 'surveys/sso', key: 'default' });
          core.comets.addDataSource({ url: baseUrl + 'CometEls.txt', key: 'mpc_comets' });
          // core.satellites.addDataSource({url: baseUrl + 'tle_satellite.jsonl.gz',key: 'jsonl/sat', });

          // Sternbilder-Linien & Labels
          core.constellations.lines_visible = true;
          core.constellations.labels_visible = true;

          // Atmosphäre & Landschaft anschalten
          core.atmosphere.visible = true;
          core.landscapes.visible = true;

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
                console.log('Objekt-Informationen:', info);

                const pvo = info.getInfo('pvo', stel.observer);
                const cirs = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', pvo[0]);
                const ra = stel.anp(stel.c2s(cirs)[0]); // RA in Radian
                const dec = stel.anpm(stel.c2s(cirs)[1]); // Dec in Radian

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
  top: 10;
  left: 0;
  width: 100vw;
  height: calc(100dvh - 120px);
  z-index: 0;
}

.stellarium-canvas {
  width: 100%;
  height: 100%;
}
</style>
