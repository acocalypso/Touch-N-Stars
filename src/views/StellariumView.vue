<template>
  <div class="stellarium-container">

    <!-- Canvas, in das Stellarium rendert -->
    <canvas
      ref="stelCanvas"
      class="stellarium-canvas"
      style="border: 1px solid #ccc;"
    ></canvas>



  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { utcToMJD, mjdToUTC, degreesToHMS, degreesToDMS, rad2deg } from '@/utils/utils';
import { apiStore } from '@/store/store';

const store = apiStore();
// Canvas-Referenz für Stellarium
const stelCanvas = ref(null);

// Reaktive Variable für das aktuell ausgewählte Objekt
const selectedObject = ref(null);

onMounted(() => {
  // Schritt 1) Stellarium-Web-Engine-Skript dynamisch laden
  const script = document.createElement('script');
  script.src = '/stellarium/stellarium-web-engine.js'; // Pfad anpassen falls nötig

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

        // Beobachter-Standort setzen (Koordinaten müssen in Radian sein):
        stel.core.observer.latitude = store.profileInfo.AstrometrySettings.Latitude * stel.D2R;
        stel.core.observer.longitude = store.profileInfo.AstrometrySettings.Longitude * stel.D2R;
        stel.core.observer.elevation = store.profileInfo.AstrometrySettings.Elevation;
        stel.core.time_speed = 1;

        console.log("Aktuelle Beobachterposition:");
        console.log("Breitengrad:", stel.core.observer.latitude);
        console.log("Längengrad:", stel.core.observer.longitude);
        console.log("Höhe:", stel.core.observer.elevation); 

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
        //setTime(18,30);
      

        // Schritt 3) Datenquellen (Kataloge) hinzufügen
        const core = stel.core;
        const baseUrl = '/stellarium-data/';
        console.log(' Füge Datenquellen hinzu...');

        core.stars.addDataSource({ url: baseUrl + 'stars' });
        core.dsos.addDataSource({ url: baseUrl + 'dso' });
        core.milkyway.addDataSource({ url: baseUrl + 'surveys/milkyway' });
        //Planeten & Monde hinzufügen
        core.landscapes.addDataSource({
          url: baseUrl + 'landscapes/guereins',
          key: 'guereins',
        });

                
        // Beispiel: Sternbilder-Linien & Labels
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
          console.log(" Objekt-Bezeichnungen:", stel.core.selection.designations());  // const obj = this.$stel.core.selection
          const info = stel.core.selection;
          const radec = info.getInfo('radec');
        
        }
        const merkur = stel.getObj("NAME Mercury");  // Merkur holen
        const pvo = merkur.getInfo('pvo', stel.observer); // Heliozentrische Position
        const cirs = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', pvo[0]); // Umrechnung ins CIRS-System

        const ra  = stel.anp(stel.c2s(cirs)[0]); // RA in Radian
        const dec = stel.anpm(stel.c2s(cirs)[1]); // Dec in Radian

        console.log("Merkur RA (Radian):", ra);
        console.log("Merkur Dec (Radian):", dec);

          }
        });
      },
    });
  };
  document.head.appendChild(script);
});
</script>

<style scoped>
.stellarium-container {
  margin: 1rem;
}

.stellarium-canvas {
  width: 100%;
  height: 600px;
}


</style>
