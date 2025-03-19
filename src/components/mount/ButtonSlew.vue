<template>
  <div class="flex gap-1">
    <button
      @click="slew"
      :disabled="
        framingStore.isSlewing || framingStore.isSlewingAndCentering || framingStore.isRotating
      "
      class="default-button-cyan flex items-center justify-center disabled:opacity-50"
    >
      <span v-if="framingStore.isSlewing" class="loader mr-2"></span>
      <p v-if="label"> {{ label }}</p>
      <p v-else>{{ $t('components.slewAndCenter.slew') }}</p>
    </button>
    <button
      @click="framingStore.slewStop"
      v-if="store.mountInfo.Slewing"
      class="bg-red-900 rounded-md flex items-center justify-center w-16"
    >
      <StopCircleIcon class="w-8 h-8" />
    </button>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useI18n } from 'vue-i18n';
import { wait } from '@/utils/utils';
import { StopCircleIcon } from '@heroicons/vue/24/outline';

const store = apiStore();
const framingStore = useFramingStore();
const { t } = useI18n();

const props = defineProps({
  raAngle: Number,
  decAngle: Number,
  label: String,
});

async function unparkMount() {
  if (store.mountInfo.AtPark) {
    try {
      await apiService.mountAction('unpark');
      await wait(2000);
      console.log(t('components.mount.control.unpark'));
    } catch (error) {
      console.log(t('components.mount.control.errors.unpark'));
    }
  }
}

async function slew() {
  await unparkMount(); // Überprüfen und Entparken, falls erforderlich
  framingStore.slew(props.raAngle, props.decAngle);
}
</script>

<style scoped>
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
