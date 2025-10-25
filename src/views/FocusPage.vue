<template>
  <div
    class="focus-page"
    :style="
      (cameraStore.imageData && store.focuserAfInfo.autofocus_running) || !delayShowGraph
        ? `background-image: url(${cameraStore.imageData}); background-size: cover; background-position: center; background-repeat: no-repeat;`
        : ''
    "
  >
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
        <div v-if="store.focuserInfo.Connected" class="flex flex-col text-left mt-4">
          <div class="border border-gray-400/50 p-3 rounded-md">
            <MoveFocuser />
            <div class="pt-2">
              <ButtonsFastChangePositon />
            </div>
          </div>
          <div class="mt-4 flex gap-2 items-center">
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
              :disabled="sequenceStore.sequenceRunning"
            >
              {{ $t('components.focuser.cancel_autofocus') }}
            </button>
            <button
              v-if="store.focuserAfInfo.autofocus_running"
              @click="showImageModal = true"
              class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md hover:bg-cyan-600 transition-colors"
              title="Show Image"
            >
              <PhotoIcon class="w-6 h-6" />
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
  </div>

  <!-- Image Modal -->
  <ImageModal
    :showModal="showImageModal"
    :imageData="cameraStore.imageData"
    :isLoading="false"
    @close="showImageModal = false"
  />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiService from '@/services/apiService';
import { useSequenceStore } from '@/store/sequenceStore';
import infoFocuser from '@/components/focuser/infoFocuser.vue';
import AfFnishGraph from '@/components/focuser/AfFnishGraph.vue';
import { apiStore } from '@/store/store';
import { useCameraStore } from '@/store/cameraStore';
import AfStatus from '@/components/focuser/AfStatus.vue';
import AfShowGraph from '@/components/focuser/AfShowGraph.vue';
import ButtonsFastChangePositon from '@/components/focuser/ButtonsFastChangePositon.vue';
import MoveFocuser from '@/components/focuser/MoveFocuser.vue';
import ImageModal from '@/components/helpers/imageModal.vue';
import { PhotoIcon } from '@heroicons/vue/24/outline';

const store = apiStore();
const cameraStore = useCameraStore();
const sequenceStore = useSequenceStore();
const position = ref(0);
const delayShowGraph = ref(true);
const showImageModal = ref(false);

async function startAutofocus() {
  try {
    await apiService.focuserAfAction('start');
    store.afTimestampLastStart = Date.now(); // Setze den Zeitstempel des letzten Starts
    store.afCurveData = []; // Leere die Kurvendaten
  } catch (error) {
    console.error('Error during autofocus', error);
  }
}
async function stoppAutofocus() {
  try {
    await apiService.focuserAfAction('stopp');
  } catch (error) {
    console.error('Error during autofocus', error);
  }
}

onMounted(() => {
  position.value = store.focuserInfo.Position || 100;
});

watch(
  () => store.focuserAfInfo.autofocus_running,
  (newVal, oldVal) => {
    console.log('Autofocus Running changed:', oldVal, '->', newVal);
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
