<template>
  <button @click="saveTarget" class="default-button-cyan"><StarIcon /></button>
</template>
<script setup>
import { useFavTargetStore } from '@/store/favTargetsStore';
import { useFramingStore } from '@/store/framingStore';
import { StarIcon } from '@heroicons/vue/24/outline';
import { useToastStore } from '@/store/toastStore';
import { useI18n } from 'vue-i18n';

const framingStore = useFramingStore();
const favTargetsStore = useFavTargetStore();
const toastStore = useToastStore();
const { t } = useI18n();

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
    title: t('components.fav_target.modal_save.titel'),
    message: t('components.fav_target.modal_save.message'),
  });

  favTargetsStore.addFavorite(newTarget);
  console.log('Name:', Name, 'RA:', Ra, 'Dec:', Dec, 'Rotation:', Rotation);
}
</script>
