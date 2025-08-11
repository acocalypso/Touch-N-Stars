<template>
  <div class="wrapper">
    <!-- Hauptbild: wird responsiv skaliert -->
    <img
      ref="imageRef"
      :src="cameraStore.imageData"
      alt="Captured Image"
      class="main-image"
      @load="onImageLoad"
    />

    <!-- Verschiebbare Box (Target) -->
    <div
      ref="targetRef"
      class="target-box"
      :style="{
        left: position.x + 'px',
        top: position.y + 'px',
        width: boxSize + 'px',
        height: boxSize + 'px',
      }"
    ></div>

    <!-- Moveable-Komponente -->
    <Moveable
      ref="moveableRef"
      :target="targetRef"
      :draggable="true"
      :rotatable="false"
      :snappable="false"
      @drag="onDrag"
    />

    <!-- Anzeige der berechneten RA/Dec -->
    <div v-if="marker.ra !== null && marker.dec !== null" class="info-box">
      <div>RA: {{ marker.ra }}</div>
      <div>Dec: {{ marker.dec }}</div>
    </div>
  </div>
  <div class="flex flex-col md:flex-row py-1 gap-1">
    <div class="flex-1">
      <ButtonSlewCenterRotate
        class="w-full"
        :raAngle="newRa"
        :decAngle="newDec"
        @finished="slewAndCenterFinished"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Moveable from 'vue3-moveable';
import { useCameraStore } from '@/store/cameraStore';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { wait, degreesToHMS, degreesToDMS } from '@/utils/utils.js';
import apiService from '@/services/apiService';
import ButtonSlewCenterRotate from '../mount/ButtonSlewCenterRotate.vue';

const cameraStore = useCameraStore();
const framingStore = useFramingStore();
const store = apiStore();
const settingsStore = useSettingsStore();

const baseRA = ref(100.0); // RA in Grad für Bildzentrum
const baseDec = ref(20.0); // Dec in Grad für Bildzentrum
const cameraRotationDeg = ref(15.0); // Kamera-Rotation in Grad
const scaleDegPerPixel = ref(0.004); // Grad pro Pixel

// Refs für DOM-Elemente
const imageRef = ref(null);
const targetRef = ref(null);
const moveableRef = ref(null);

// Position & Größe der Target-Box
const position = ref({ x: 0, y: 0 });
const boxSize = 50; // px
let resizeObserver = null;

// Letzte berechnete RA/Dec
const marker = ref({
  ra: null,
  dec: null,
});
const newRa = ref(0);
const newDec = ref(0);

onMounted(async () => {
  await fetchFramingInfo();

  window.addEventListener('resize', onWindowResize);

  // Beobachtet die Bildgröße
  resizeObserver = new ResizeObserver(() => {
    console.log('Bildgröße hat sich geändert!');
    onWindowResize();
  });

  if (imageRef.value) {
    resizeObserver.observe(imageRef.value);
  }

  baseRA.value = cameraStore.plateSolveResult.Coordinates.RADegrees;
  baseDec.value = cameraStore.plateSolveResult.Coordinates.Dec;
  cameraRotationDeg.value = cameraStore.plateSolveResult.PositionAngle;
  scaleDegPerPixel.value = cameraStore.plateSolveResult.Pixscale / 3600;

  console.log(
    baseRA.value,
    baseDec.value,
    'Winkel:',
    cameraRotationDeg.value,
    scaleDegPerPixel.value
  );

  nextTick(() => {
    centerTargetBox();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
});
async function fetchFramingInfo() {
  try {
    const data = await apiService.framingAction('info');
    framingStore.framingInfo = data.Response;
  } catch (error) {
    console.error('Fehler beim Abrufen des FramingInfo:', error);
  }
}

async function slewAndCenterFinished() {
  console.log('slewAndCenter finished!');
  await wait(500);
  cameraStore.capturePhoto(
    apiService,
    settingsStore.camera.exposureTime,
    settingsStore.camera.gain,
    settingsStore.camera.useSolve
  );
  cameraStore.imageData = '';
  cameraStore.slewModal = false;
}

function onImageLoad() {
  centerTargetBox();
}

async function onWindowResize() {
  centerTargetBox();
  // RA/Dec Koordinaten neu berechnen
  calculateRaDec();
  await nextTick();
  // 4. Moveable neu rendern
  if (moveableRef.value) {
    moveableRef.value.updateRect();
  }
}

function centerTargetBox() {
  const rect = imageRef.value?.getBoundingClientRect();
  if (!rect) return;

  position.value.x = rect.width / 2 - boxSize / 2;
  position.value.y = rect.height / 2 - boxSize / 2;
  calculateRaDec();
}

function onDrag(e) {
  // e.delta → Verschiebung seit dem letzten Drag in px
  position.value.x += e.delta[0];
  position.value.y += e.delta[1];

  // Box in Bildgrenzen halten (optional)
  keepTargetInBounds();

  // RA/Dec neu berechnen
  calculateRaDec();
}

/**
 * Box an die Bildgrenzen anpassen
 */
function keepTargetInBounds() {
  const rect = imageRef.value?.getBoundingClientRect();
  if (!rect) return;

  const w = rect.width;
  const h = rect.height;

  // Klemmen
  if (position.value.x < 0) position.value.x = 0;
  if (position.value.y < 0) position.value.y = 0;
  if (position.value.x > w - boxSize) position.value.x = w - boxSize;
  if (position.value.y > h - boxSize) position.value.y = h - boxSize;
}

/**
 * calculateRaDec():
 * Ermittelt RA/Dec basierend auf Box-Position + Rotation.
 */
async function calculateRaDec() {
  const rect = imageRef.value?.getBoundingClientRect();
  if (!rect) return;

  let sensorWidth = store.cameraInfo.XSize;
  let sensorHeight = store.cameraInfo.YSize;

  sensorWidth = -1;

  if (sensorWidth === -1) {
    console.log('DLSR erkannt');
    await fetchFramingInfo();
    sensorWidth = framingStore.framingInfo.CameraWidth;
    sensorHeight = framingStore.framingInfo.CameraHeight;
  }

  const displayedWidth = rect.width;
  const ratioX = sensorWidth / displayedWidth;
  const displayedHeight = rect.height;
  const ratioY = sensorHeight / displayedHeight;

  console.log(
    `Chipgröße org in Pixeln: ${Math.round(store.cameraInfo.XSize)} x ${Math.round(store.cameraInfo.YSize)}`
  );

  // Bildmitte
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // Mittelpunkt der Box
  const boxCenterX = position.value.x + boxSize / 2;
  const boxCenterY = position.value.y + boxSize / 2;

  // dx, dy relativ zur Bildmitte (dx nach rechts positiv, dy nach oben positiv)
  let dx = boxCenterX - centerX;
  let dy = centerY - boxCenterY; // invertiert

  // Kamera-Rotationswinkel (in Radiant umrechnen)
  const theta = (cameraRotationDeg.value * Math.PI) / 180;

  // Drehung der Verschiebung (dx, dy) um den Winkel theta
  const rotatedDx = dx * Math.cos(theta) - dy * Math.sin(theta);
  const rotatedDy = dx * Math.sin(theta) + dy * Math.cos(theta);

  const scaleDegPerPixelX = scaleDegPerPixel.value * ratioX;
  const scaleDegPerPixelY = scaleDegPerPixel.value * ratioY;

  // Offset DEC
  const offsetDec = rotatedDy * scaleDegPerPixelX;

  // RA-Korrektur (cos(dec))
  let cosDec = Math.cos((baseDec.value * Math.PI) / 180);
  if (Math.abs(cosDec) < 1e-8) cosDec = 1e-8;
  const offsetRA = (rotatedDx * scaleDegPerPixelY) / cosDec;

  // Final: RA, Dec
  const ra = baseRA.value - offsetRA;
  const dec = baseDec.value + offsetDec;

  newRa.value = ra;
  newDec.value = dec;

  marker.value.ra = degreesToHMS(ra);
  marker.value.dec = degreesToDMS(dec);
  //console.log('RA', ra);
  //console.log('Dec', dec);
}
</script>

<style scoped>
.wrapper {
  /* Begrenze die Breite auf 80% der Viewport-Breite, 
     max. 800px, zentriere optional via margin */

  width: 90vw;
  margin: 0 auto;
  position: relative;
}

.main-image {
  width: 100%;
  height: auto;
  display: block;
}

.target-box {
  position: absolute;
  cursor: move;
  user-select: none;
}

.box-text {
  margin: auto;
  color: red;
  font-size: 10px;
  text-align: center;
}

.info-box {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 8px;
  color: #fff;
  border-radius: 4px;
  font-size: 0.9rem;
}

.loader {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
