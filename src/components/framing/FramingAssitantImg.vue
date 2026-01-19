<template>
  <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
    <div
      class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
    ></div>
  </div>
  <div v-else>
    <div
      id="fov"
      class="border relative overflow-hidden"
      :style="{
        width: `${framingStore.containerSize}px`,
        height: `${framingStore.containerSize}px`,
        position: 'relative',
      }"
      ref="containerRef"
    >
      <!-- TargetPic als Hintergrund -->
      <img class="absolute inset-0" :src="targetPic" />

      <!-- Verschiebbares / drehbares Ziel-Element (nur für Moveable Tracking) -->
      <div
        ref="targetRef"
        :style="{
          width: `${framingStore.camWidth}px`,
          height: `${framingStore.camHeight}px`,
          transform: `translate(${x}px, ${y}px) rotate(${rotationAngleVisu}deg)`,
          zIndex: 2,
        }"
      ></div>

      <!-- FOV und Rotation Steuerung (oben rechts) -->
      <div class="absolute top-3 right-3 z-10 flex gap-2">
        <!-- FOV Steuerung -->
        <div
          class="bg-gray-800/90 border border-gray-600 rounded-lg p-2 flex items-center space-x-2"
        >
          <button
            @click="adjustFov(-0.5)"
            class="w-8 h-8 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm font-bold transition-colors flex items-center justify-center"
          >
            -
          </button>
          <span class="text-xs text-gray-300 font-medium min-w-[2.5rem] text-center"
            >{{ framingStore.fov.toFixed(1) }}°</span
          >
          <button
            @click="adjustFov(0.5)"
            class="w-8 h-8 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm font-bold transition-colors flex items-center justify-center"
          >
            +
          </button>
        </div>
        <!-- Rotation Anzeige -->
        <div
          class="bg-gray-800/90 border min-w-14 border-gray-600 rounded-lg px-3 py-2 flex items-center justify-center"
        >
          <span class="text-xs text-gray-300 font-medium"
            >{{ Math.round(framingStore.rotationAngle) }}°</span
          >
        </div>
      </div>

      <!-- Moveable-->
      <Moveable
        ref="moveableRef"
        :target="targetRef"
        :draggable="true"
        :rotatable="true"
        @drag="onDrag"
        @rotate="onRotate"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import Moveable from 'vue3-moveable';
import { useFramingStore } from '@/store/framingStore';
import { useSettingsStore } from '@/store/settingsStore';
import apiService from '@/services/apiService';

const framingStore = useFramingStore();
const settingsStore = useSettingsStore();
const isLoading = ref(true);
const targetPic = ref(null);
const scaleDegPerPixel = ref(0.004); // Grad pro Pixel
const cameraFovX = ref(0); // Echter Kamera-FOV in Grad (fest)
const cameraFovY = ref(0); // Echter Kamera-FOV in Grad (fest)
const baseRA = framingStore.RAangle;
const baseDec = framingStore.DECangle;
const x = ref(0);
const y = ref(0);
const containerRef = ref(null);
const targetRef = ref(null);
const moveableRef = ref(null);
const rotationAngleVisu = ref(0);

onMounted(async () => {
  await fetchFramingInfo();

  // Einmalig echten Kamera-FOV berechnen (basierend auf Hardware)
  calculateRealCameraFov();

  // Init rotationAngleVisu
  rotationAngleVisu.value = 360 - framingStore.rotationAngle;

  // Container-Größe berechnen (maximal nutzen)
  const smallerDimension = Math.min(window.innerWidth - 20, window.innerHeight - 200);
  const roundedDimension = Math.floor(smallerDimension / 100) * 100;
  framingStore.containerSize = roundedDimension;

  // Sinnvollen Start-FOV nur beim allerersten Laden berechnen
  if (!framingStore.initialFovSet) {
    // Nur beim ersten Öffnen des Framing Assistants
    ensureReasonableStartFov();
    framingStore.initialFovSet = true;
  }

  // Container anpassen falls nötig (OHNE FOV zu ändern)
  adjustContainerIfNeeded();

  // Kamera-Box Größe basierend auf User-FOV berechnen
  updateCameraBoxSize();

  // Bild abrufen
  await getTargetPic();

  // Kamera immer in die Mitte setzen, da das Bild bereits mit den richtigen Koordinaten geladen wird
  x.value = framingStore.containerSize / 2 - framingStore.camWidth / 2;
  y.value = framingStore.containerSize / 2 - framingStore.camHeight / 2;

  // Position im Store speichern
  framingStore.cameraX = x.value;
  framingStore.cameraY = y.value;
  framingStore.cameraRelativeX = 0.5;
  framingStore.cameraRelativeY = 0.5;

  // Resize Event-Listener hinzufügen
  window.addEventListener('resize', handleWindowResize);

  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 500));
  isLoading.value = false;
});

// Cleanup beim Unmount
onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize);
});

// Window Resize Handler
let resizeTimeout;
function handleWindowResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const smallerDimension = Math.min(window.innerWidth - 20, window.innerHeight - 200);
    const roundedDimension = Math.floor(smallerDimension / 100) * 100;

    if (roundedDimension !== framingStore.containerSize) {
      framingStore.containerSize = roundedDimension;
      updateCameraBoxSize();
      updateMoveable();
    }
  }, 300);
}

// FOV-Watcher: Nur Bild und Kamera-Box aktualisieren (KEINE Komponenten-Reload)
watch(
  () => framingStore.fov,
  async (newFov, oldFov) => {
    if (cameraFovX.value > 0 && newFov !== oldFov) {
      // Kamera-Box-Größe neu berechnen
      updateCameraBoxSize();

      // Rechteck in der Mitte des Containers positionieren
      x.value = framingStore.containerSize / 2 - framingStore.camWidth / 2;
      y.value = framingStore.containerSize / 2 - framingStore.camHeight / 2;

      // Position im Store speichern (absolut und relativ)
      framingStore.cameraX = x.value;
      framingStore.cameraY = y.value;
      framingStore.cameraRelativeX = 0.5;
      framingStore.cameraRelativeY = 0.5;

      // Nur Hintergrundbild neu laden (mit Debounce)
      debouncedImageReload();

      // Moveable manuell aktualisieren damit der blaue Rahmen neu gerendert wird
      updateMoveable();
    }
  }
);

// Rotation-Watcher: Moveable-Rahmen aktualisieren wenn Winkel sich ändert
watch(
  () => framingStore.rotationAngle,
  (newAngle) => {
    rotationAngleVisu.value = 360 - newAngle;
    updateMoveable();
  }
);

let imageReloadTimeout;
function debouncedImageReload() {
  clearTimeout(imageReloadTimeout);
  imageReloadTimeout = setTimeout(async () => {
    await getTargetPic();
  }, 300);
}

// Moveable-Komponente manuell aktualisieren
function updateMoveable() {
  if (moveableRef.value) {
    // Kurz warten bis DOM-Updates abgeschlossen sind
    nextTick(() => {
      moveableRef.value.updateRect();
    });
  }
}

// Einmalig den echten Kamera-FOV berechnen (basierend auf Hardware)
function calculateRealCameraFov() {
  const sensorWidthPx = framingStore.framingInfo.CameraWidth;
  const sensorHeightPx = framingStore.framingInfo.CameraHeight;
  const pixelSizeM = framingStore.framingInfo.CameraPixelSize / 1_000_000;
  const focalLengthM = framingStore.framingInfo.FocalLength / 1000;

  // Sensor-Größe
  const sensorWidthM = sensorWidthPx * pixelSizeM;
  const sensorHeightM = sensorHeightPx * pixelSizeM;

  // Echter Kamera-FOV in Grad (fest, ändert sich nie)
  cameraFovX.value = 2 * rad2deg(Math.atan(sensorWidthM / 2 / focalLengthM));
  cameraFovY.value = 2 * rad2deg(Math.atan(sensorHeightM / 2 / focalLengthM));
}

// Kamera-Box Größe basierend auf User-gewähltem Hintergrund-FOV berechnen
function updateCameraBoxSize() {
  // Skalierung basierend auf User-gewähltem Hintergrund-FOV
  scaleDegPerPixel.value = framingStore.fov / framingStore.containerSize;

  // Kamera-Box in Pixeln (basierend auf echtem Kamera-FOV)
  const fovPxX = cameraFovX.value / scaleDegPerPixel.value;
  const fovPxY = cameraFovY.value / scaleDegPerPixel.value;

  framingStore.camWidth = fovPxX;
  framingStore.camHeight = fovPxY;
}

// Sinnvollen Start-FOV sicherstellen damit Kamera sichtbar ist
function ensureReasonableStartFov() {
  // Erst mal grob testen mit aktuellem FOV
  updateCameraBoxSize();

  // Wenn Kamera-Box mehr als 70% des Containers ausfüllt, FOV vergrößern
  const maxCamSize = Math.max(framingStore.camWidth, framingStore.camHeight);
  const maxAllowedSize = framingStore.containerSize * 0.7; // 70% des Containers

  // Nur anpassen wenn FOV wirklich zu klein ist UND kleiner als ein vernünftiger Mindestwert
  if (maxCamSize > maxAllowedSize && framingStore.fov < 5) {
    // Berechne benötigten FOV für sinnvolle Kamera-Größe (50% des Containers)
    const targetCamSize = framingStore.containerSize * 0.5;
    const scaleFactor = maxCamSize / targetCamSize;
    const requiredFov = framingStore.fov * scaleFactor;

    const newFov = Math.max(requiredFov, framingStore.fov * 1.5, 5); // Mindestens 5° oder 1.5x aktueller FOV

    framingStore.fov = Math.round(newFov * 10) / 10; // Auf 0.1 runden
  }
}

// Container anpassen falls Kamera-Box nicht passt (OHNE User-FOV zu ändern)
function adjustContainerIfNeeded() {
  // Zuerst mit aktuellem FOV testen
  updateCameraBoxSize();

  const minContainerSize = Math.max(framingStore.camWidth, framingStore.camHeight) + 100;

  if (framingStore.containerSize < minContainerSize) {
    // Container vergrößern statt FOV zu ändern
    const newSize = Math.ceil(minContainerSize / 100) * 100; // Auf 100er runden
    const maxSize = Math.min(window.innerWidth, window.innerHeight - 200);

    if (newSize <= maxSize) {
      framingStore.containerSize = newSize;
    }
    // User kann bewusst kleine FOV-Werte wählen, auch wenn die Kamera groß wird
  }
}

let dragDebounceTimeout;
let rotateDebounceTimeout;

// Drag-Event von Moveable
function onDrag(e) {
  x.value += e.delta[0];
  y.value += e.delta[1];

  // Begrenzung: nicht über Container hinausragen
  if (x.value < 0) x.value = 0;
  if (y.value < 0) y.value = 0;
  if (x.value > framingStore.containerSize - framingStore.camWidth)
    x.value = framingStore.containerSize - framingStore.camWidth;
  if (y.value > framingStore.containerSize - framingStore.camHeight)
    y.value = framingStore.containerSize - framingStore.camHeight;

  // Position im Store speichern für Reload-Persistenz
  framingStore.cameraX = x.value;
  framingStore.cameraY = y.value;

  // Relative Position berechnen und speichern (für bessere Wiederherstellung)
  const centerX = x.value + framingStore.camWidth / 2;
  const centerY = y.value + framingStore.camHeight / 2;
  framingStore.cameraRelativeX = centerX / framingStore.containerSize;
  framingStore.cameraRelativeY = centerY / framingStore.containerSize;

  // Debounced RA/DEC Berechnung
  clearTimeout(dragDebounceTimeout);
  dragDebounceTimeout = setTimeout(() => {
    calculateRaDec();
  }, 300);
}

// Rotate event from Moveable with debounce
function onRotate(e) {
  // Normalize angle to 0-360 range
  // Clockwise: 0 → 360
  // Counter-clockwise: 360 → 0
  const normalizedAngle = ((e.rotate % 360) + 360) % 360;
  framingStore.rotationAngle = (360 - normalizedAngle) % 360;
  rotationAngleVisu.value = normalizedAngle;
  //console.log( 'framingStore.rotationAngle',  framingStore.rotationAngle)

  // Debounced Berechnung
  clearTimeout(rotateDebounceTimeout);
  rotateDebounceTimeout = setTimeout(() => {
    calculateRaDec();
  }, 300);
}

async function getTargetPic() {
  try {
    const ra = framingStore.RAangle;
    const dec = framingStore.DECangle;
    const width = framingStore.containerSize;
    const height = framingStore.containerSize;
    const fov = framingStore.fov;
    const useCache = settingsStore.framing.useNinaCache;

    updateCameraBoxSize();

    if (targetPic.value) {
      URL.revokeObjectURL(targetPic.value);
    }
    targetPic.value = await apiService.searchTargetPic(width, height, fov, ra, dec, useCache);
  } catch (error) {
    console.error('Error fetching image:', error);
  }
}

async function fetchFramingInfo() {
  try {
    const data = await apiService.framingAction('info');
    framingStore.framingInfo = data.Response;
  } catch (error) {
    console.error('Error fetching FramingInfo:', error);
  }
}

function calculateRaDec() {
  // Center des Ziel-Rechtecks
  const targetCenterX = x.value + framingStore.camWidth / 2;
  const targetCenterY = y.value + framingStore.camHeight / 2;

  // Container-Mitte
  const center = framingStore.containerSize / 2;

  // Abweichung in Pixel
  const deltaX = targetCenterX - center;
  const deltaY = center - targetCenterY;

  // Offset DEC
  const offsetDec = deltaY * scaleDegPerPixel.value;

  // RA-Korrektur (cos(dec))
  let cosDec = Math.cos((baseDec * Math.PI) / 180);
  if (Math.abs(cosDec) < 1e-8) cosDec = 1e-8;
  const offsetRA = (deltaX * scaleDegPerPixel.value) / cosDec;

  // Aktuelle Koords
  const currentRA = baseRA - offsetRA;
  const currentDec = baseDec + offsetDec;

  // Als String speichern
  framingStore.RAangleString = degreesToHMS(currentRA);
  framingStore.DECangleString = degreesToDMS(currentDec);

  framingStore.RAangle = currentRA;
  framingStore.DECangle = currentDec;
}

function degreesToHMS(deg) {
  const totalHours = deg / 15;
  const h = Math.floor(totalHours);
  const remainingHours = totalHours - h;
  const totalMinutes = remainingHours * 60;
  const m = Math.floor(totalMinutes);
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;

  const hStr = String(h);
  const mStr = String(m).padStart(2, '0');
  const sStr = s.toFixed(1).padStart(4, '0');

  return `${hStr}:${mStr}:${sStr}`;
}
function degreesToDMS(deg) {
  const sign = deg < 0 ? '-' : '+';
  deg = Math.abs(deg);
  const d = Math.floor(deg);
  const remainingDeg = deg - d;
  const totalMinutes = remainingDeg * 60;
  const m = Math.floor(totalMinutes);
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;

  const dStr = String(d).padStart(2, '0');
  const mStr = String(m).padStart(2, '0');
  const sStr = s.toFixed(1).padStart(4, '0');

  return `${sign}${dStr}:${mStr}:${sStr}`;
}
function rad2deg(rad) {
  return rad * (180 / Math.PI);
}

// FOV Anpassung mit +/- Buttons
function adjustFov(delta) {
  const newValue = parseFloat(framingStore.fov) + delta;
  framingStore.fov = Math.max(0.1, Math.min(180, Math.round(newValue * 10) / 10));
}
</script>

<style scoped></style>
