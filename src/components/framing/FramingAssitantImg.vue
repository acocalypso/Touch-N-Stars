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

      <!-- Verschiebbares / drehbares Ziel-Element -->
      <div
        class="target"
        ref="targetRef"
        :style="{
          width: `${framingStore.camWidth}px`,
          height: `${framingStore.camHeight}px`,
          transform: `translate(${x}px, ${y}px) rotate(${-framingStore.rotationAngle}deg)`,
          zIndex: 2,
        }"
      ></div>

      <!-- Moveable-->
      <Moveable
        ref="moveableRef"
        :target="targetRef"
        :draggable="true"
        :rotatable="false"
        @drag="onDrag"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
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

onMounted(async () => {
  await fetchFramingInfo();

  // Einmalig echten Kamera-FOV berechnen (basierend auf Hardware)
  calculateRealCameraFov();

  // Container-Größe berechnen
  const smallerDimension = Math.min(window.innerWidth, window.innerHeight - 200);
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
  
  console.log('Kamera in Mitte positioniert - Bild wurde mit aktuellen RA/DEC-Koordinaten geladen');

  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 500));
  isLoading.value = false;
});

watch(
  () => framingStore.rotationAngle,
  () => {
    console.log('debounceRotateRange:', framingStore.rotationAngle);
    debounceRotateRange();
  }
);

// FOV-Watcher: Nur Bild und Kamera-Box aktualisieren (KEINE Komponenten-Reload)
watch(
  () => framingStore.fov,
  async (newFov, oldFov) => {
    if (cameraFovX.value > 0 && newFov !== oldFov) {
      // Alte Kamera-Position relativ zum Container merken
      const oldCenterX = x.value + framingStore.camWidth / 2;
      const oldCenterY = y.value + framingStore.camHeight / 2;
      const relativeCenterX = oldCenterX / framingStore.containerSize;
      const relativeCenterY = oldCenterY / framingStore.containerSize;
      
      // Kamera-Box-Größe neu berechnen
      updateCameraBoxSize();
      
      // Kamera-Position basierend auf relativer Position neu berechnen
      const newCenterX = relativeCenterX * framingStore.containerSize;
      const newCenterY = relativeCenterY * framingStore.containerSize;
      x.value = newCenterX - framingStore.camWidth / 2;
      y.value = newCenterY - framingStore.camHeight / 2;
      
      // Position innerhalb Container halten
      x.value = Math.max(0, Math.min(x.value, framingStore.containerSize - framingStore.camWidth));
      y.value = Math.max(0, Math.min(y.value, framingStore.containerSize - framingStore.camHeight));
      
      // Position im Store speichern (absolut und relativ)
      framingStore.cameraX = x.value;
      framingStore.cameraY = y.value;
      
      const centerX = x.value + framingStore.camWidth / 2;
      const centerY = y.value + framingStore.camHeight / 2;
      framingStore.cameraRelativeX = centerX / framingStore.containerSize;
      framingStore.cameraRelativeY = centerY / framingStore.containerSize;
      
      // Nur Hintergrundbild neu laden (mit Debounce)
      debouncedImageReload();
      
      // Moveable manuell aktualisieren damit der blaue Rahmen neu gerendert wird
      updateMoveable();
    }
  }
);

let imageReloadTimeout;
function debouncedImageReload() {
  clearTimeout(imageReloadTimeout);
  imageReloadTimeout = setTimeout(async () => {
    console.log('Lade nur Hintergrundbild neu für FOV:', framingStore.fov);
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


let debounceTimeout;
function debounceRotateRange() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    rotateByRange();
  }, 500); // Wartezeit in Millisekunden
}
function rotateByRange() {
  const normalizedAngle = framingStore.rotationAngle % 360; // Sicherstellen, dass der Wert im Bereich 0-360 bleibt
  moveableRef.value.request('rotatable', { rotate: normalizedAngle }, true);
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
  
  console.log(`Echter Kamera-FOV: ${cameraFovX.value.toFixed(2)}° x ${cameraFovY.value.toFixed(2)}°`);
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
  
  console.log(`Kamera-Box: ${fovPxX.toFixed(1)}px x ${fovPxY.toFixed(1)}px bei FOV ${framingStore.fov}°`);
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
    
    console.log(`Einmalige FOV-Anpassung: ${framingStore.fov}° → ${newFov.toFixed(2)}° für bessere Sichtbarkeit`);
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
      console.log(`Container vergrößert auf ${newSize}px für Kamera-FOV ${cameraFovX.value.toFixed(2)}°`);
    } else {
      // Warnung ausgeben aber FOV NICHT mehr automatisch ändern
      console.warn(`Kamera-FOV ${cameraFovX.value.toFixed(2)}° ist sehr groß für verfügbaren Bildschirmplatz. Container: ${framingStore.containerSize}px, benötigt: ${minContainerSize}px`);
      // User kann bewusst kleine FOV-Werte wählen, auch wenn die Kamera groß wird
    }
  }
}

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

  calculateRaDec();
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
    console.error('Fehler beim Abrufen des Bildes:', error);
  }
}

async function fetchFramingInfo() {
  try {
    const data = await apiService.framingAction('info');
    framingStore.framingInfo = data.Response;
  } catch (error) {
    console.error('Fehler beim Abrufen des FramingInfo:', error);
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
</script>

<style scoped>
.target {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px dashed red;
}
</style>
