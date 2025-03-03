<template>
  <div class="stellarium-container">
    <!-- Canvas für Stellarium -->
    <canvas ref="stelCanvas" class="stellarium-canvas"></canvas>

    <!-- Mount position icon overlay -->
    <div
      v-if="mountVisible && mountIconPosition"
      :style="{
        position: 'absolute',
        left: `${mountIconPosition.x}px`,
        top: `${mountIconPosition.y}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 10,
      }"
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M7.5 0C7.77614 0 8 0.223858 8 0.5V1.80687C10.6922 2.0935 12.8167 4.28012 13.0068 7H14.5C14.7761 7 15 7.22386 15 7.5C15 7.77614 14.7761 8 14.5 8H12.9888C12.7094 10.6244 10.6244 12.7094 8 12.9888V14.5C8 14.7761 7.77614 15 7.5 15C7.22386 15 7 14.7761 7 14.5V13.0068C4.28012 12.8167 2.0935 10.6922 1.80687 8H0.5C0.223858 8 0 7.77614 0 7.5C0 7.22386 0.223858 7 0.5 7H1.78886C1.98376 4.21166 4.21166 1.98376 7 1.78886V0.5C7 0.223858 7.22386 0 7.5 0ZM8 12.0322V9.5C8 9.22386 7.77614 9 7.5 9C7.22386 9 7 9.22386 7 9.5V12.054C4.80517 11.8689 3.04222 10.1668 2.76344 8H5.5C5.77614 8 6 7.77614 6 7.5C6 7.22386 5.77614 7 5.5 7H2.7417C2.93252 4.73662 4.73662 2.93252 7 2.7417V5.5C7 5.77614 7.22386 6 7.5 6C7.77614 6 8 5.77614 8 5.5V2.76344C10.1668 3.04222 11.8689 4.80517 12.054 7H9.5C9.22386 7 9 7.22386 9 7.5C9 7.77614 9.22386 8 9.5 8H12.0322C11.7621 10.0991 10.0991 11.7621 8 12.0322Z"
          fill="#FF5500"
          stroke="#FFFFFF"
          stroke-width="0.5"
        />
      </svg>
    </div>

    <!-- Button für das Suchfeld (Lupe) -->
    <button
      @click="toggleSearch"
      class="absolute top-3 right-3 p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
    >
      <MagnifyingGlassIcon class="w-7 h-7 text-white" />
    </button>

    <!-- Mount Controls -->
    <div class="absolute bottom-3 right-3 flex gap-2">
      <button
        @click="toggleMountIcon"
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
        :class="{ 'bg-cyan-600': mountVisible }"
        title="Toggle mount position indicator"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M7.5 0C7.77614 0 8 0.223858 8 0.5V1.80687C10.6922 2.0935 12.8167 4.28012 13.0068 7H14.5C14.7761 7 15 7.22386 15 7.5C15 7.77614 14.7761 8 14.5 8H12.9888C12.7094 10.6244 10.6244 12.7094 8 12.9888V14.5C8 14.7761 7.77614 15 7.5 15C7.22386 15 7 14.7761 7 14.5V13.0068C4.28012 12.8167 2.0935 10.6922 1.80687 8H0.5C0.223858 8 0 7.77614 0 7.5C0 7.22386 0.223858 7 0.5 7H1.78886C1.98376 4.21166 4.21166 1.98376 7 1.78886V0.5C7 0.223858 7.22386 0 7.5 0Z"
            fill="white"
          />
        </svg>
      </button>
      <button
        @click="syncViewToMount"
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
        title="Center view on mount position"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="white"
            stroke-width="2"
          />
          <path d="M12 8V16" stroke="white" stroke-width="2" />
          <path d="M8 12H16" stroke="white" stroke-width="2" />
        </svg>
      </button>
      <button
        @click="toggleAutoSync"
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
        :class="{ 'bg-cyan-600': autoSyncEnabled }"
        title="Toggle auto-sync view with mount"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C13.1798 4 14.3037 4.26571 15.3067 4.7356"
            stroke="white"
            stroke-width="2"
          />
          <path d="M16 8L20 4M20 4L16 0M20 4H13" stroke="white" stroke-width="2" />
        </svg>
      </button>
    </div>

    <!-- Overlay für das Suchfeld -->
    <div
      v-if="isSearchVisible"
      class="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 p-4 rounded-lg shadow-lg text-white w-80"
    >
      <steallriumSearch ref="searchComponent" />
    </div>

    <!-- Overlay für das ausgewählte Objekt -->
    <div
      v-if="selectedObject"
      class="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white p-4 rounded-lg shadow-lg min-w-[250px]"
    >
      <h3 class="text-lg font-semibold">
        {{ $t('components.stellarium.selected_object.title') }}:
      </h3>
      <ul class="mt-2">
        <li v-for="(name, index) in selectedObject" :key="index" class="text-sm">
          {{ name }}
        </li>
      </ul>
      <p class="mt-2 text-sm">
        {{ $t('components.stellarium.selected_object.ra') }}: {{ selectedObjectRa }}
      </p>
      <p class="text-sm">
        {{ $t('components.stellarium.selected_object.dec') }}: {{ selectedObjectDec }}
      </p>
      <button
        @click="setFramingCoordinates"
        class="mt-3 px-4 py-2 w-full bg-gray-700 hover:bg-gray-600 rounded-lg shadow-md"
      >
        {{ $t('components.stellarium.selected_object.button_framing') }}
      </button>
    </div>

    <!-- Mount position overlay -->
    <div
      v-if="!isSearchVisible && showMountInfo"
      class="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white p-4 rounded-lg shadow-lg min-w-[250px]"
    >
      <h3 class="text-lg font-semibold">{{ $t('components.stellarium.mount_position.title') }}:</h3>
      <p class="mt-2 text-sm">
        {{ $t('components.stellarium.selected_object.ra') }}: {{ mountRa }}
      </p>
      <p class="text-sm">{{ $t('components.stellarium.selected_object.dec') }}: {{ mountDec }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import { utcToMJD, mjdToUTC, degreesToHMS, degreesToDMS, rad2deg } from '@/utils/utils';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { useFramingStore } from '@/store/framingStore';
import { useStellariumStore } from '@/store/stellariumStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useRouter } from 'vue-router';
import steallriumSearch from '@/components/stellarium/steallriumSearch.vue';
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline';

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
const wasmPath = '/stellarium/stellarium-web-engine.wasm';
const isSearchVisible = ref(false);
const searchComponent = ref(null);
const mountPositionInterval = ref(null);
const mountRa = ref('--');
const mountDec = ref('--');
const mountRaDeg = ref(null);
const mountDecDeg = ref(null);
const mountIconPosition = ref(null);
const mountVisible = ref(true);
const autoSyncEnabled = ref(false);
const showMountInfo = ref(true);

// Toggle mount icon visibility
function toggleMountIcon() {
  mountVisible.value = !mountVisible.value;
}

// Toggle auto-sync with mount
function toggleAutoSync() {
  autoSyncEnabled.value = !autoSyncEnabled.value;
}

// Manually sync view to mount position
function syncViewToMount() {
  if (mountRaDeg.value !== null && mountDecDeg.value !== null) {
    moveToRaDec(mountRaDeg.value, mountDecDeg.value, 1, 50);
  }
}

// Update the position of the mount icon on screen
function updateMountIconPosition() {
  if (!stellariumStore.stel || mountRaDeg.value === null || mountDecDeg.value === null) {
    return;
  }

  const stel = stellariumStore.stel;
  const ra_rad = mountRaDeg.value * stel.D2R;
  const dec_rad = mountDecDeg.value * stel.D2R;

  // Convert celestial coordinates to screen coordinates
  const icrfVec = stel.s2c(ra_rad, dec_rad);
  const observedVec = stel.convertFrame(stel.observer, 'ICRF', 'OBSERVED', icrfVec);

  // Check if the point is visible (above horizon)
  const alt = stel.c2s(observedVec)[1];
  if (alt < 0) {
    // Object is below horizon
    mountIconPosition.value = null;
    return;
  }

  // Get screen coordinates (projected point)
  const proj = stel.core.proj.project(observedVec);
  if (proj[2] <= 0) {
    // Object is not in current view
    mountIconPosition.value = null;
    return;
  }

  // Convert normalized coordinates to screen pixels
  const canvasWidth = stelCanvas.value.clientWidth;
  const canvasHeight = stelCanvas.value.clientHeight;
  const x = ((proj[0] + 1) / 2) * canvasWidth;
  const y = (1 - (proj[1] + 1) / 2) * canvasHeight;

  mountIconPosition.value = { x, y };
}

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

function moveToRaDec(ra_deg, dec_deg, duration_sec = 2.0, zoom_deg = 20) {
  if (!stellariumStore.stel) {
    console.error('Stellarium instance is not ready yet.');
    return;
  }
  const stel = stellariumStore.stel;

  const ra_rad = ra_deg * stel.D2R;
  const dec_rad = dec_deg * stel.D2R;

  const icrfVec = stel.s2c(ra_rad, dec_rad);
  const observedVec = stel.convertFrame(stel.observer, 'ICRF', 'OBSERVED', icrfVec);

  stel.lookAt(observedVec, duration_sec);
  stel.zoomTo(zoom_deg * stel.D2R, duration_sec);
}

watch(
  () => stellariumStore.search.DECangleString,
  (newValue) => {
    console.log('selectedObject:', newValue);
    moveToRaDec(stellariumStore.search.RAangle, stellariumStore.search.DECangle);
    stellariumStore.search.DECangleString = '';
  }
);

// Animation frame for updating mount icon position
let animationFrameId = null;
const updateLoop = () => {
  if (mountVisible.value && stellariumStore.stel) {
    updateMountIconPosition();
  }
  animationFrameId = requestAnimationFrame(updateLoop);
};

onMounted(async () => {
  // Start animation loop for mount icon position updates
  animationFrameId = requestAnimationFrame(updateLoop);

  // Schritt 1) Stellarium-Web-Engine-Skript dynamisch laden
  const script = document.createElement('script');
  script.src = '/stellarium/stellarium-web-engine.js';

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

          // Beobachter-Standort setzen (Koordinaten müssen in Radian sein):
          stel.core.observer.latitude = store.profileInfo.AstrometrySettings.Latitude * stel.D2R;
          stel.core.observer.longitude = store.profileInfo.AstrometrySettings.Longitude * stel.D2R;
          stel.core.observer.elevation = store.profileInfo.AstrometrySettings.Elevation;

          console.log('Aktuelle Beobachterposition:');
          console.log('Breitengrad:', stel.core.observer.latitude);
          console.log('Längengrad:', stel.core.observer.longitude);
          console.log('Höhe:', stel.core.observer.elevation);

          // eslint-disable-next-line
          function setTime(hour, minute) {
            const now = new Date();
            // Setze die gewünschte Uhrzeit (lokale Zeit)
            now.setHours(hour, minute, 0, 0);
            const utcTime = new Date(now.getTime());
            // Konvertiere UTC-Zeit in Modified Julian Date (MJD)
            const mjd = utcToMJD(utcTime);
            console.log('MJD:', mjd);
            console.log('UTC:', mjdToUTC(mjd));
            // Setze die Stellarium-Zeit
            stel.core.observer.utc = mjd;
          }
          //setTime(21, 0);
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
          core.landscapes.addDataSource({ url: baseUrl + 'landscapes/guereins', key: 'guereins' });
          core.milkyway.addDataSource({ url: baseUrl + 'surveys/milkyway' });
          core.minor_planets.addDataSource({ url: baseUrl + 'mpcorb.dat', key: 'mpc_asteroids' });
          core.planets.addDataSource({ url: baseUrl + 'surveys/sso/moon', key: 'moon' });
          core.planets.addDataSource({ url: baseUrl + 'surveys/sso/sun', key: 'sun' });
          core.planets.addDataSource({ url: baseUrl + 'surveys/sso', key: 'default' });
          // core.comets.addDataSource({ url: baseUrl + 'CometEls.txt', key: 'mpc_comets' });
          // core.satellites.addDataSource({ url: baseUrl + 'tle_satellite.jsonl.gz', key: 'jsonl/sat',});

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

          // Falls Koordinaten aus dem Store kommen
          if (framingStore.RAangle && framingStore.DECangle) {
            moveToRaDec(framingStore.RAangle, framingStore.DECangle, 1, 50);
          } else if (stellariumStore.search.RAangle && stellariumStore.search.DECangle) {
            moveToRaDec(stellariumStore.search.RAangle, stellariumStore.search.DECangle, 1, 50);
          }

          // Start polling mount position
          mountPositionInterval.value = setInterval(async () => {
            if (stellariumStore.stel) {
              try {
                const response = await apiService.mountAction('info');
                if (response.Success) {
                  const ra = response.Response.RightAscension;
                  const dec = response.Response.Declination;

                  // Update displayed coordinates
                  mountRa.value = degreesToHMS(ra);
                  mountDec.value = degreesToDMS(dec);
                  mountRaDeg.value = ra;
                  mountDecDeg.value = dec;

                  // Move Stellarium view only if auto-sync is enabled
                  if (autoSyncEnabled.value) {
                    moveToRaDec(ra, dec, 1, 50);
                  }
                }
              } catch (error) {
                console.error('Error fetching mount position:', error);
              }
            }
          }, 5000);
        },
      });
    } catch (err) {
      console.error('Fehler bei Fetch oder StelWebEngine:', err);
    }
  };
  document.head.appendChild(script);
});

onBeforeUnmount(() => {
  // Clean up intervals and animation frames
  if (mountPositionInterval.value) {
    clearInterval(mountPositionInterval.value);
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
.stellarium-container {
  position: fixed;
  top: 10;
  left: 0;
  width: 100vw;
  height: 87vh;
  z-index: 0;
}

.stellarium-canvas {
  width: 100%;
  height: 100%;
}
</style>
