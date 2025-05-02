<template>

    <div v-if="true">
      <h2>Favoriten</h2>
      <ul v-if="favTargetsStore.favoriteTargets.length">
        <li v-for="target in favTargetsStore.favoriteTargets" :key="target.name">
          {{ target.name }} – RA: {{ target.ra }}°, DEC: {{ target.dec }}°
          <button @click="removeTarget(target.name)">🗑️ Löschen</button>
          <button @click="loadTarget(target)">🎯 Laden</button>
        </li>
      </ul>
      <p v-else>Keine Favoriten gespeichert.</p>
    </div>
    <button @click="saveTarget" class="default-button-cyan">neu speichern</button>

</template>
<script setup>
import { useFavTargetStore } from '@/store/favTargetsStore';
import { useFramingStore } from '@/store/framingStore';
import { degreesToDMS, degreesToHMS } from '@/utils/utils';

const framingStore = useFramingStore();
const favTargetsStore = useFavTargetStore();

function loadTarget(target) {
  console.log('laden');
  framingStore.RAangle = target.ra;
  framingStore.DECangle = target.dec;
  framingStore.RAangleString = degreesToHMS(target.ra);
  framingStore.DECangleString = degreesToDMS(target.dec);
  framingStore.rotationAngle = target.rotation ?? 0;
  framingStore.selectedItem = {
      Name: target.name,
      RA:target.ra,
      Dec:target.dec,}
}

function removeTarget(name) {
  favTargetsStore.removeFavorite(name);
}

async function saveTarget() {
  console.log('saveTarget');

  if (!framingStore.selectedItem) {
    console.error('No target selected');
    return;
  }

  const name = framingStore.selectedItem.Name;
  const ra = framingStore.RAangle;
  const dec = framingStore.DECangle;
  const rotation = framingStore.rotationAngle;

  const newTarget = {
    name,
    ra,
    dec,
    rotation,
  };

  favTargetsStore.addFavorite(newTarget);
  console.log('Name:', name, 'RA:', ra, 'Dec:', dec, 'Rotation:', rotation);
}
</script>

