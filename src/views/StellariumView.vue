<template>
  <div class="stellarium-container">
    <!-- Canvas für Stellarium -->
    <canvas ref="stelCanvas" class="stellarium-canvas"></canvas>

    <!-- Overlay für das Suchfeld -->
    <div class="search-overlay">
      <steallriumSearch />
    </div>

    <!-- Overlay für das ausgewählte Objekt -->
    <div v-if="selectedObject" class="selected-object-overlay">
      <h3>Ausgewähltes Objekt:</h3>
      <ul>
        <li v-for="(name, index) in selectedObject" :key="index">
          {{ name }}
        </li>
      </ul>
      <p>Rektaszension: {{ selectedObjectRa }}</p>
      <p>Deklination: {{ selectedObjectDec }}</p>
      <button @click="setFramingCoordinates" class="p-3 bg-gray-600">go to Framing</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { utcToMJD, mjdToUTC, degreesToHMS, degreesToDMS, rad2deg } from '@/utils/utils';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useStellariumStore } from '@/store/stellariumStore';
import { useRouter } from 'vue-router';
import steallriumSearch from '@/components/stellarium/steallriumSearch.vue';

const store = apiStore();
const framingStore = useFramingStore();
const stellariumStore = useStellariumStore();
const router = useRouter();
const stelCanvas = ref(null);
const selectedObject = ref(null);
const selectedObjectRa = ref(null);
const selectedObjectDec = ref(null);
const selectedObjectRaDeg = ref(null);
const selectedObjectDecDeg = ref(null);
const stelInstance = ref(null);

onMounted(() => {
  // Schritt 1) Stellarium-Web-Engine-Skript dynamisch laden
  const script = document.createElement('script');
  script.src = '/stellarium/stellarium-web-engine.js';

  script.onload = () => {
    if (!window.StelWebEngine) {
      console.error('StelWebEngine globales Objekt nicht gefunden!');
      return;
    }

    // Schritt 2) Engine starten
    window.StelWebEngine({
      wasmFile: '/stellarium/stellarium-web-engine.wasm',
      canvas: stelCanvas.value,
      onReady(stel) {
        console.log('Stellarium ist bereit!', stel);
        stelInstance.value = stel;

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
          // Setze die Stellarium-Zeit auf die richtige UTC-Zeit
          console.log('UTC:', stel.core.observer.utc);
          stel.core.observer.utc = mjd;
        }
        //setTime(19, 30); //Zume testen

        // Schritt 3) Datenquellen (Kataloge) hinzufügen
        const core = stel.core;
        const baseUrl = '/stellarium-data/';

        core.stars.addDataSource({ url: baseUrl + 'stars' });
        core.skycultures.addDataSource({ url: baseUrl + 'skycultures/western', key: 'western' });
        core.dsos.addDataSource({ url: baseUrl + 'dso' });
        core.landscapes.addDataSource({ url: baseUrl + 'landscapes/guereins', key: 'guereins' });
        core.milkyway.addDataSource({ url: baseUrl + 'surveys/milkyway' });
        core.minor_planets.addDataSource({ url: baseUrl + 'mpcorb.dat', key: 'mpc_asteroids' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/moon', key: 'moon' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso/sun', key: 'sun' });
        core.planets.addDataSource({ url: baseUrl + 'surveys/sso', key: 'default' });
        //core.comets.addDataSource({ url: baseUrl + 'CometEls.txt', key: 'mpc_comets' });
        // core.satellites.addDataSource({url: baseUrl + 'tle_satellite.jsonl.gz', key: 'jsonl/sat',});

        // Zeitgeschwindigkeit auf 1 setzen
        stel.core.time_speed = 1;

        //Sternbilder-Linien & Labels
        core.constellations.lines_visible = true;
        core.constellations.labels_visible = true;

        // Atmosphäre & Landschaft anschalten
        core.atmosphere.visible = true;
        core.landscapes.visible = true;

        /*        var mars = stel.getObj("NAME Mars");
        if (mars) {
          console.log("Mars gefunden:", mars);
          stel.pointAndLock(mars, 2.0); 
        } else {
          console.log("Mars nicht gefunden.");
        } */
        // eslint-disable-next-line
        function searchObject(query) {
          if (!query) return null;

          console.log(` Suche nach: ${query}`);
          var obj = stel.getObj(query) || stel.getObj('NAME ' + query);
          if (obj) {
            console.log(' Objekt direkt gefunden:', obj);
            return obj;
          }
        }
        if (framingStore.RAangle && framingStore.DECangle) {
          moveToRaDec(framingStore.RAangle, framingStore.DECangle, 1, 50);
        } else if (stellariumStore.search.RAangle && stellariumStore.search.DECangle) {
          moveToRaDec(stellariumStore.search.RAangle, stellariumStore.search.DECangle, 1, 50);
        }
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
              const selectedDesignations = stel.core.selection.designations();
              selectedObject.value = selectedDesignations;
              console.log(' Objekt-Bezeichnungen:', selectedDesignations);
              const info = stel.core.selection;
              console.log('Objekt-Informationen:', info);
              const pvo = info.getInfo('pvo', stel.observer); // Heliozentrische Position
              const cirs = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', pvo[0]); // Umrechnung ins CIRS-System
              const ra = stel.anp(stel.c2s(cirs)[0]); // RA in Radian
              const dec = stel.anpm(stel.c2s(cirs)[1]); // Dec in Radian
              selectedObjectRa.value = degreesToHMS(rad2deg(ra));
              selectedObjectDec.value = degreesToDMS(rad2deg(dec));
              selectedObjectRaDeg.value = rad2deg(ra);
              selectedObjectDecDeg.value = rad2deg(dec);
              console.log('auswahl RA (Radian):', ra);
              console.log('auswahl Dec (Radian):', dec);
              console.log('auswahl RA (deg):', rad2deg(ra));
              console.log('auswahl dec (deg):', rad2deg(dec));
              console.log('auswahl RA (hms):', degreesToHMS(rad2deg(ra)));
              console.log('auswahl dec (dms):', degreesToDMS(rad2deg(dec)));
            }
          }
        });
      },
    });
  };
  document.head.appendChild(script);
});

function setFramingCoordinates() {
  framingStore.RAangleString = selectedObjectRa.value;
  framingStore.DECangleString = selectedObjectDec.value;
  framingStore.RAangle = selectedObjectRaDeg.value;
  framingStore.DECangle = selectedObjectDecDeg.value;
  framingStore.selectedItem = selectedObject.value;
  console.log('Set Framing Coordinates');
  store.mount.currentTab = 'showSlew';
  console.log(' store.mount.currentTab', store.mount.currentTab);
  router.push('/mount');
}

function moveToRaDec(ra_deg, dec_deg, duration_sec = 2.0, zoom_deg = 20) {
  if (!stelInstance.value) {
    console.error('Stellarium instance is not ready yet.');
    return;
  }
  const stel = stelInstance.value;
  stel.getObj('NAME Mars').getInfo('pvo', stel.observer); //Workaround um die Standordberechnungen zu erzwingen. Ich habe noch keine andere Möglichkeit gefunden.

  const ra_rad = ra_deg * stel.D2R;
  const dec_rad = dec_deg * stel.D2R;

  // Schritt 1: ICRF-Koordinaten als 3D-Vektor erzeugen
  const icrfVec = stel.s2c(ra_rad, dec_rad);
  // Schritt 2: ICRF-Vektor ins OBSERVED-System umrechnen
  const observedVec = stel.convertFrame(stel.observer, 'ICRF', 'OBSERVED', icrfVec);
  // Schritt 3: Kamera bewegen
  stel.lookAt(observedVec, duration_sec);
  //Zoomen
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
</script>

<style scoped>
.stellarium-container {
  position: fixed;
  top: 10;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
}

.stellarium-canvas {
  width: 100%;
  height: 100%;
}

.selected-object-overlay {
  position: fixed;
  top: 140px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  min-width: 250px;
  z-index: 100;
}
.search-overlay {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  border-radius: 8px;
  color: white;
  min-width: 300px;
}
</style>
