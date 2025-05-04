<template>
  <button @click="saveTarget" class="default-button-cyan"><StarIcon /></button>
</template>
<script setup>
import { useFavTargetStore } from '@/store/favTargetsStore';
import { useFramingStore } from '@/store/framingStore';
import { StarIcon } from '@heroicons/vue/24/outline';
import { useToastStore } from '@/store/toastStore';

const framingStore = useFramingStore();
const favTargetsStore = useFavTargetStore();
const toastStore = useToastStore();

async function saveTarget() {
  console.log('saveTarget');

  if (!framingStore.selectedItem) {
    console.error('No target selected');
    return;
  }

  const Name = framingStore.selectedItem.Name;
  const Ra = framingStore.RAangle;
  const Dec = framingStore.DECangle;
  const RaString = framingStore.RAangleString;
  const DecString = framingStore.DECangleString;
  const Rotation = framingStore.rotationAngle || 0;

  const newTarget = {
    Name,
    Ra,
    Dec,
    RaString,
    DecString,
    Rotation,
  };

  toastStore.showToast({
    type: 'success',
    title: 'Save',
    message: 'Safe to fav',
  });

  favTargetsStore.addFavorite(newTarget);
  console.log('Name:', Name, 'RA:', Ra, 'Dec:', Dec, 'Rotation:', Rotation);
}
</script>
