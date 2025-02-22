<template>
  <div>
    <canvas
      ref="stelCanvas"
      style="width: 100%; height: 600px; border: 1px solid #ccc;"
    ></canvas>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

// Referenz auf das Canvas-Element
const stelCanvas = ref(null);

onMounted(() => {
  // 1) Script dynamisch laden
  const script = document.createElement('script');
  // Pfad zu deiner stellarium-web-engine.js (im "public/stellarium/"-Ordner)
  script.src = '/stellarium/stellarium-web-engine.js';

  script.onload = () => {
    if (!window.StelWebEngine) {
      console.error('StelWebEngine globales Objekt nicht gefunden!');
      return;
    }

    // 2) Engine initialisieren
    //    Pfad zur .wasm-Datei und dein Canvas-Element angeben
    //    onReady-Callback, um Datenquellen hinzuzufügen
    window.StelWebEngine({
      wasmFile: '/stellarium/stellarium-web-engine.wasm',
      canvas: stelCanvas.value,

      onReady(stel) {
        console.log('Stellarium ready!', stel);

        // 3) Datenquellen hinzufügen, damit der Himmel sichtbar wird.
        //    In diesem Beispiel nehmen wir an, dass du unter /stellarium-data/
        //    die Ordner stars/, dso/, surveys/, landscapes/ usw. abgelegt hast.
        const core = stel.core;
        const baseUrl = '/stellarium-data/';

        // Sterne
        core.stars.addDataSource({ url: baseUrl + 'stars' });
        // DSOs
        core.dsos.addDataSource({ url: baseUrl + 'dso' });
        // Milchstraße
        core.milkyway.addDataSource({ url: baseUrl + 'surveys/milkyway' });
        // Landschaft (z. B. "guereins")
        core.landscapes.addDataSource({
          url: baseUrl + 'landscapes/guereins',
          key: 'guereins',
        });

        // 4) Ein paar Einstellungen vornehmen, z. B. Sternbilder-Linien an/aus
        core.constellations.lines_visible = true;
        core.constellations.labels_visible = true;
        core.atmosphere.visible = true;
        core.landscapes.visible = true;

        // Optional: Beobachter-Standort setzen
        // z.B. Berlin:
        // stel.core.observer.latitude = 52.5200;
        // stel.core.observer.longitude = 13.4050;

        // Hier kannst du beliebige weitere Optionen / Datensets hinzufügen.
      },
    });
  };

  document.head.appendChild(script);
});
</script>

<style scoped>
/* optionales Styling */
</style>
