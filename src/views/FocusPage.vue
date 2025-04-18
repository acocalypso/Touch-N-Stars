<template>
  <div class="text-left mb-2">
    <h1 class="text-xl text-center font-bold">{{ $t('components.focuser.title') }}</h1>
  </div>
  <div
    v-if="!store.focuserInfo.Connected"
    class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
  >
    <p class="text-red-400 font-medium text-center">
      {{ $t('components.focuser.please_connect_focuser') }}
    </p>
  </div>
  <div v-else class="container flex items-center justify-center">
    <div class="container max-w-md landscape:max-w-xl">
      <infoFocuser
        v-model="store.focuserInfo.Connected"
        class="grid grid-cols-2 landscape:grid-cols-3"
      />
      <div v-if="store.focuserInfo.Connected" class="flex flex-col text-left mt-4 ">
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
          <button
            class="default-button-cyan"
            @click="moveFocuser"
          >
            {{ $t('components.focuser.move') }}
          </button>
        </div>
        <div class="pt-1">
          <ButtonsFastChangePositon/>
        </div>
      </div>
        <div class="mt-4">
          <button
            v-if="!store.focuserAfInfo.autofocus_running"
            class="default-button-cyan"
            @click="startAutofocus"
          >
            {{ $t('components.focuser.start_autofocus') }}
          </button>
          <button
            v-else
            class="default-button-red"
            @click="stoppAutofocus"
          >
            {{ $t('components.focuser.cancel_autofocus') }}
          </button>
        </div>

        <div class="flex items-center space-x-3 mt-4">
          <div class="w-3 h-[1px] bg-gray-700"></div>
          <!-- kurze Linie -->
          <button
            @click="store.showAfGraph = !store.showAfGraph"
            class="w-7 h-7 bg-gray-700 active:bg-cyan-700 hover:bg-cyan-600 rounded-md border border-cyan-500/20 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-white transition-transform duration-300"
              :class="{ 'rotate-90': store.showAfGraph }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <p class="text-sm italic">{{ $t('components.focuser.autofocus_graph') }}</p>
          <div class="flex-grow h-[1px] bg-gray-700"></div>
          <!-- lange Linie -->
        </div>

        <div v-show="store.showAfGraph" class="mt-6">
          <!--AfStatus-->
          <div v-if="store.focuserAfInfo.autofocus_running || !delayShowGraph">
            <div>
              <AfShowGraph />
            </div>
            <div
              class="flex flex-col items-center mt-2 p-4 min-h-28 bg-gray-800/50 rounded-lg border border-gray-700/50"
            >
              <AfStatus />
            </div>
          </div>
          <div v-else-if="!store.focuserAfInfo.afError">
            <p class="mb-4 text-center">{{ $t('components.focuser.last_autofocus') }}</p>
            <AfFnishGraph class="flex-grow h-screen" />
          </div>
          <div v-else class="text-center text-red-600">
            <p>{{ $t('components.focuser.autofocus_error') }}</p>
            <p class="italic">{{ store.focuserAfInfo.afErrorText }}</p>
          </div>
        </div>
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
