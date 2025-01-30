<template>
  <div class="container flex items-center justify-center">
    <div class="container max-w-md">
      <h5 class="text-xl font-bold mb-4">{{ $t('components.framing.search.title') }}</h5>

      <div class="text-black mx-auto">
        <input
          type="text"
          v-model="framingStore.searchQuery"
          @input="fetchTargetSearch"
          class="w-full p-2 border border-gray-300 rounded"
          :placeholder="$t('components.framing.search.placeholder')"
        />
        <!-- Überprüfe, ob targetSearchResult ein Array ist und Elemente hat -->
        <ul
          v-if="
            Array.isArray(framingStore.targetSearchResult) &&
            framingStore.targetSearchResult.length > 0
          "
          class="bg-white border border-gray-300 rounded mt-1 z-10"
        >
          <li
            v-for="(item, index) in framingStore.targetSearchResult"
            :key="index"
            class="p-2 hover:bg-gray-200 cursor-pointer"
            @click="selectTarget(item)"
          >
            {{ item.Name }}
            <span v-if="item['Common names']"> ({{ item['Common names'] }})</span>
            <span v-if="item['M']"> (M {{ item['M'] }})</span>
          </li>
        </ul>
      </div>
      <div class="flex min-w-36 items-center border border-gray-500 p-1 mt-2 rounded-lg">
        <label for="DewHeater" class="text-sm mb-1 text-gray-400"
          >{{ $t('components.framing.useNinaCache') }}
        </label>
        <div class="flex ml-auto items-center space-x-2">
          <controlUseNinaCache class="p-2" />
        </div>
      </div>

      <!-- Ausgewählter Eintrag -->
      <div
        v-if="framingStore.selectedItem"
        class="grid grid-cols-2 mt-4 p-4 border border-gray-700 rounded shadow"
      >
        <div class="text-xs">
          <p v-if="framingStore.selectedItem['Common names']">
            <strong>Name:</strong> {{ framingStore.selectedItem['Common names'] }}
          </p>
          <p><strong>NGC:</strong> {{ framingStore.selectedItem.Name }}</p>
          <p v-if="framingStore.selectedItem.M">
            <strong>M:</strong> M{{ framingStore.selectedItem.M }}
          </p>
        </div>
        <div>
          <TargetPic class="border border-gray-500 rounded-md" />
        </div>
      </div>
      <div v-if="true" class="mb-2 mt-1">
        <button
          v-if="framingStore.selectedItem && false"
          @click="framingStore.showFramingModal = true"
          class="default-button-cyan"
        >
          {{ $t('components.framing.openFraminingModal') }}
        </button>
      </div>
      <div>
        <slewAndCenter
          v-model:RAangleString="framingStore.RAangleString"
          v-model:DECangleString="framingStore.DECangleString"
        />
      </div>
    </div>
    <!-- Framing Modal -->
    <div
      v-if="framingStore.showFramingModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        class="bg-gray-900 rounded-lg p-4 overflow-y-auto max-h-[95vh] border border-gray-700 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50"
      >
        <FramingAssistangModal />
        <button
          @click="framingStore.showFramingModal = false"
          class="fixed sm:absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-gray-400 hover:text-white bg-gray-900 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import apiService from '@/services/apiService';
import slewAndCenter from '@/components/framing/slewAndCenter.vue';
import TargetPic from '@/components/framing/TargetPic.vue';
import controlUseNinaCache from '@/components/framing/controlUseNinaCache.vue';
import { useFramingStore } from '@/store/framingStore';
import { onMounted } from 'vue';
import FramingAssistangModal from '@/components/framing/FramingAssistangModal.vue';

const framingStore = useFramingStore();
async function fetchTargetSearch() {
  if (framingStore.searchQuery.trim() === '') {
    framingStore.targetSearchResult = [];
    return;
  }
  try {
    const data = await apiService.searchNGC(framingStore.searchQuery, 10);
    if (Array.isArray(data)) {
      framingStore.targetSearchResult = data;
      console.log('Suche: ', data);
    } else {
      console.warn("Die API hat kein Array zurückgegeben, 'targetSearchResult' wird geleert.");
      framingStore.targetSearchResult = [];
    }
  } catch (error) {
    console.error('Fehler beim Laden der Vorschläge:', error);
    framingStore.targetSearchResult = [];
  }
}

function selectTarget(item) {
  framingStore.searchQuery = item.Name || '';
  framingStore.targetSearchResult = [];
  framingStore.selectedItem = item;
  framingStore.RAangle = item.RA;
  framingStore.DECangle = item.Dec;
  framingStore.RAangleString = degreesToHMS(item.RA);
  framingStore.DECangleString = degreesToDMS(item.Dec);

  console.log('item', framingStore.selectedItem);
}

function degreesToHMS(deg) {
  // Schritt 1: Grad in Stunden umrechnen
  const totalHours = deg / 15;

  // Ganze Stunden ermitteln
  const h = Math.floor(totalHours);

  // Schritt 2: Minuten
  const remainingHours = totalHours - h;
  const totalMinutes = remainingHours * 60;
  const m = Math.floor(totalMinutes);

  // Schritt 3: Sekunden
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;

  // Formatierung (z. B. auf eine Nachkommastelle)
  const hStr = String(h).padStart(1, '0'); // Stunden dürfen ruhig einstellig bleiben
  const mStr = String(m).padStart(2, '0'); // Minuten zweistellig
  const sStr = s.toFixed(1).padStart(4, '0'); // Sekunden mit einer Nachkommastelle

  return `${hStr}:${mStr}:${sStr}`;
}
function degreesToDMS(deg) {
  console.log('degreesToDMS ', deg);
  // 1) Vorzeichen merken und Absolutwert nehmen
  const sign = deg < 0 ? '-' : '+';
  deg = Math.abs(deg);

  // 2) Ganze Grad
  const d = Math.floor(deg);

  // 3) Minuten
  const remainingDeg = deg - d;
  const totalMinutes = remainingDeg * 60;
  const m = Math.floor(totalMinutes);

  // 4) Sekunden
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;

  // 5) Formatierung
  //    a) Grad: max. zwei Ziffern, da DEC zwischen -90° und +90° liegt
  //    b) Minuten/Sekunden: jeweils zweistellig
  const dStr = String(d).padStart(2, '0');
  const mStr = String(m).padStart(2, '0');
  // Auf eine Nachkommastelle runden, z. B. 0.1"
  const sStr = s.toFixed(1).padStart(4, '0');

  // 6) Zusammenbauen: ±DD:MM:SS.s
  return `${sign}${dStr}:${mStr}:${sStr}`;
}

onMounted(() => {
  framingStore.height = 200;
  framingStore.width = 200;
  framingStore.fov = 2;
});
</script>

<style scoped></style>
