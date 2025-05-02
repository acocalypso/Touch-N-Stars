<template>
  <template>

    <div v-if="false"> 
      <h2>Favoriten</h2>
      <ul v-if=" useFavTargetStore.favoriteTargets.length">
        <li v-for="target in  useFavTargetStore.favoriteTargets" :key="target.name">
          {{ target.name }} – RA: {{ target.ra }}°, DEC: {{ target.dec }}°
        </li>
      </ul>
      <p v-else>Keine Favoriten gespeichert.</p>
    </div>
    <button @click="saveTarget" class="default-button-cyan">neu speichern</button>
  </template>
</template>
<script setup>
import { computed } from 'vue';
import { useFavTargetStore } from '@/store/favTargetsStore';
import { useFramingStore } from '@/store/framingStore';

const framingStore = useFramingStore();
const favTargetsStore = useFavTargetStore();

async function setSequenceTarget() {
  console.log('Setting sequence target');

  if (!framingStore.selectedItem) {
    console.error('No target selected');
    return;
  }

  const name = framingStore.selectedItem.Name;
  const ra = framingStore.RAangle;
  const dec = framingStore.DECangle;
  const rotation = framingStore.rotationAngle;

  const newTarget = {
    name: framingStore.selectedItem.Name,
    ra: framingStore.RAangle,
    dec: framingStore.DECangle,
    rotation: framingStore.rotationAngle,
  };

  const saveTarget = () => {
    favTargetsStore.addFavorite(newTarget);
  };

  console.log('Name:', name, 'RA:', ra, 'Dec:', dec, 'Rotation:', rotation);
}
</script>
