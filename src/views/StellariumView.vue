<template>
  <div class="stellarium-container">
    <h1>Stellarium: Beispiel</h1>

    <!-- Canvas, in das Stellarium rendert -->
    <canvas
      ref="stelCanvas"
      class="stellarium-canvas"
      style="border: 1px solid #ccc;"
    ></canvas>

    <!-- Infobox zum ausgewählten Objekt -->
    <div v-if="selectedObject" class="object-info">
      <h2>Ausgewähltes Objekt</h2>
      <p>
        <strong>Name:</strong>
        {{ selectedObject.main_designation }}
      </p>
      <p>
        <strong>Helligkeit (Mag):</strong>
        <!-- Falls vmag vorhanden ist, auf zwei Nachkommastellen runden -->
        {{ selectedObject.vmag ? selectedObject.vmag.toFixed(2) : 'unbekannt' }}
      </p>
      <p>
        <strong>Typ:</strong>
        {{ selectedObject.type || 'unbekannt' }}
      </p>
      <!-- Weitere Felder kannst du ergänzen -->
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

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
        function setLocalTime() {
          const now = new Date();
          const utcNow = now.getTime() / 86400000 + 40587;
          stel.core.observer.utc = utcNow;
          console.log(`Lokale Zeit gesetzt: ${now.toLocaleString()} (MJD: ${utcNow})`);
        }
        //setLocalTime();
        function setLateNight() {
          const now = new Date();
          
          // Setze die gewünschte Uhrzeit (lokale Zeit)
          now.setHours(23, 30, 0, 0); // 23:30 Uhr (lokal)

          // Berechne die Zeitzonenverschiebung in Minuten und wandle sie in Millisekunden um
          const timezoneOffset = now.getTimezoneOffset() * 60000; // Minuten → Millisekunden
          console.log('timezoneOffset', timezoneOffset);
          // Korrigiere die Zeit auf UTC
          const utcTime = new Date(now.getTime() - timezoneOffset);

          // Konvertiere UTC-Zeit in Modified Julian Date (MJD)
          const mjd = utcTime.getTime() / 86400000 + 40587;

          // Setze die Stellarium-Zeit auf die richtige UTC-Zeit
          console.log('UTC:', stel.core.observer.utc);
          stel.core.observer.utc = mjd;


          console.log("Lokale Zeit gesetzt auf:", now.toLocaleString());
          console.log("Korrigierte UTC-Zeit:", utcTime.toISOString());
          console.log("Stellarium Zeit (MJD):", mjd);
        }
        setLateNight();
        
        console.log(" Stellarium UTC-MJD:", stel.core.observer.utc);


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

                // Optional: Beobachter-Standort setzen
        // z.B. Tacherting:
        stel.core.observer.latitude = 48.078611;
        stel.core.observer.longitude = 12.570556;
        stel.core.observer.elevation = 473;
        stel.core.time_speed = 1;

        console.log("Aktuelle Beobachterposition:");
        console.log("Breitengrad:", stel.core.observer.latitude);
        console.log("Längengrad:", stel.core.observer.longitude);
        console.log("Höhe:", stel.core.observer.elevation);


                
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
          console.log('radec: ', radec);
        } else {
          console.log(" Kein Objekt ausgewählt!");
        }

          }
        });
      },
    });
  };

  // Skript in den Head einfügen
  document.head.appendChild(script);
});
</script>

<style scoped>
.stellarium-container {
  margin: 1rem;
  /* Für Demo-Zwecke, kann man anpassen */
}

.stellarium-canvas {
  width: 100%;
  height: 600px;
}

/* Infobox für das ausgewählte Objekt */
.object-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #222;
  color: #eee;
  border-radius: 6px;
}
</style>
