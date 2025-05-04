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

const props = defineProps({
  name: {
    type: String,
    default: 'Unknown',
  },
  ra: {
    type: Number,
  },
  dec: {
    type: Number,
  },
  raString: {
    type: String,
  },
  decString: {
    type: String,
  },
  rotation: {
    type: Number,
    default: 0,
  },
});

async function saveTarget() {
  console.log('saveTarget');

  const Name = props.name;
  const Ra = props.ra;
  const Dec = props.dec;
  const RaString = props.raString;
  const DecString = props.decString;
  const Rotation = props.rotation;

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
