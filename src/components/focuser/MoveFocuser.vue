<template>
  <div class="container flex items-center justify-center">
    <div class="border border-gray-400/50 p-3 rounded-md">
      <div class="flex space-x-3 items-center">
        <label for="position" class="w-auto">{{ $t('components.focuser.new_position') }}</label>
        <input
          id="position"
          v-model.number="position"
          type="number"
          class="text-black px-4 h-10 w-full border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-700"
          placeholder="1"
          step="50"
        />
        <button class="default-button-cyan" @click="moveFocuser">
          {{ $t('components.focuser.move') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiService from '@/services/apiService';
import infoFocuser from '@/components/focuser/infoFocuser.vue';
import AfFnishGraph from '@/components/focuser/AfFnishGraph.vue';
import { apiStore } from '@/store/store';
import AfStatus from '@/components/focuser/AfStatus.vue';
import AfShowGraph from '@/components/focuser/AfShowGraph.vue';
import ButtonsFastChangePositon from '@/components/focuser/ButtonsFastChangePositon.vue';

const store = apiStore();
const position = ref(0);
const loading = ref(false);
const delayShowGraph = ref(true);

async function moveFocuser() {
  try {
    loading.value = true;
    await apiService.moveFocuser(position.value);
  } catch (error) {
    console.error('Fehler beim Bewegen des Fokussierers:', error);
  } finally {
    loading.value = false;
  }
}

async function startAutofocus() {
  try {
    await apiService.focuserAfAction('start');
    store.afTimestampLastStart = Date.now(); // Setze den Zeitstempel des letzten Starts
    store.afCurveData = []; // Leere die Kurvendaten
  } catch (error) {
    console.error('Fehler beim Autofokus', error);
  }
}
async function stoppAutofocus() {
  try {
    await apiService.focuserAfAction('stopp');
  } catch (error) {
    console.error('Fehler beim Autofokus', error);
  }
}

onMounted(() => {
  position.value = store.focuserInfo.Position || 100;
});

watch(
  () => store.focuserAfInfo.autofocus_running,
  (newVal, oldVal) => {
    console.log('Autofokus Running geändert:', oldVal, '->', newVal);
    if (!newVal) {
      delayShowGraph.value = false;
      setTimeout(() => {
        delayShowGraph.value = true;
      }, 5000);
    }
  }
);
</script>

<style scoped></style>
