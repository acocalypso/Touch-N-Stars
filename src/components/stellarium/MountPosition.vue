<template>

</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { apiStore } from '@/store/store';
import { useStellariumStore } from '@/store/stellariumStore';
const stellariumStore = useStellariumStore();

const raDegree = ref(0);
const decDegree = ref(0);
const mountLayer = ref(null);
const mountCircle = ref(null);

const store = apiStore();

watch(
  () => [store.mountInfo.Coordinates.RADegrees, store.mountInfo.Coordinates.Dec],
  ([newRa, newDec]) => {
    handleMountUpdate(newRa, newDec);
  }
);

// 5) RA/Dec => 3D-Kugel-Koords
function vec3_from_sphe(ra_degree, dec_degree, outArray) {
  const radRA = (ra_degree * Math.PI) / 180;
  const radDec = (dec_degree * Math.PI) / 180;
  const cosDec = Math.cos(radDec);

  outArray[0] = Math.cos(radRA) * cosDec;
  outArray[1] = Math.sin(radRA) * cosDec;
  outArray[2] = Math.sin(radDec);
}

// 6) Kreis auf RA/Dec aktualisieren
function updateCirclePos(raDeg, decDeg) {
  if (!mountCircle.value) return;
  const posArr = mountCircle.value.pos;

  vec3_from_sphe(raDeg, decDeg, posArr);
  mountCircle.value.pos = posArr;

  // Größe/Farbe
  mountCircle.value.color = [0, 1, 0, 0.25];
  mountCircle.value.border_color = [1, 1, 1, 1];
  mountCircle.value.size = [0.03, 0.03];
}

function handleMountUpdate(raVal, decVal) {
  raDegree.value = parseFloat(raVal);
  decDegree.value = parseFloat(decVal);
  updateCirclePos(raDegree.value, decDegree.value);
}

onMounted(() => {
  if (!stellariumStore.stel) return;
  console.log('onMounted ---------------------------------------');
  mountLayer.value = stellariumStore.stel.createLayer({ id: 'mountLayer', z: 7, visible: true });
  mountCircle.value = stellariumStore.stel.createObj('circle', {
    id: 'mountCircle',
    model_data: {},
  });
  mountCircle.value.update();
  mountLayer.value.add(mountCircle.value);
  handleMountUpdate(store.mountInfo.Coordinates.RADegrees, store.mountInfo.Coordinates.Dec);

  // Optional: Kreis direkt "ins Bild" holen
  //stellariumStore.stel.core.selection = mountCircle.value
  //stellariumStore.stel.pointAndLock(mountCircle.value)
});
</script>

<style scoped>

</style>
