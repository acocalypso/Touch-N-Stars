<template>
  <div class="flex gap-1">
    <button
      @click="syncCoordinates"
      :disabled="
        framingStore.isSlewing ||
        framingStore.isSlewingAndCentering ||
        framingStore.isRotating ||
        props.disabled
      "
      class="default-button-cyan px-5"
    >
      <span v-if="framingStore.isSlewing" class="loader mr-2"></span>
      <p v-if="label">{{ label }}</p>
      <p v-else>{{ $t('components.slewAndCenter.slew') }}</p>
    </button>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useI18n } from 'vue-i18n';
import apiService from '@/services/apiService';


const store = apiStore();
const framingStore = useFramingStore();
const { t } = useI18n();

const props = defineProps({
  raAngle: Number,
  decAngle: Number,
  label: String,
  disabled: Boolean,
});



async function syncCoordinates() {

  const response = await apiService.mountAction(`sync?ra=${props.raAngle}&dec=${props.decAngle}`);
  console.log(response);

}
</script>

<style scoped>

</style>
