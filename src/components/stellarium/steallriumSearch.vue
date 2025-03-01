<template>
  <div class="container flex items-center justify-center">
    <div class="container max-w-md">
      <h5 class="text-xl font-bold mb-4">{{ $t('components.framing.search.title') }}</h5>

      <div class="text-black mx-auto">
        <input
          type="text"
          v-model="searchQuery"
          ref="searchInput"
          @input="fetchTargetSearch"
          class="w-full p-2 border border-gray-300 rounded"
          :placeholder="$t('components.framing.search.placeholder')"
        />
        <!-- Überprüfe, ob targetSearchResult ein Array ist und Elemente hat -->
        <ul
          v-if="Array.isArray(targetSearchResult) && targetSearchResult.length > 0"
          class="bg-white border border-gray-300 rounded mt-1 z-10"
        >
          <li
            v-for="(item, index) in targetSearchResult"
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
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, defineExpose } from 'vue';
import apiService from '@/services/apiService';
import { useStellariumStore } from '@/store/stellariumStore';
import { degreesToHMS, degreesToDMS, rad2deg } from '@/utils/utils';

const stellariumStore = useStellariumStore();
const searchQuery = ref('');
const targetSearchResult = ref([]);
const searchInput = ref(null);

const celestialBodies = [
  { Name: 'Sun', Type: 'Star' },
  { Name: 'Mercury', Type: 'Planet' },
  { Name: 'Venus', Type: 'Planet' },
  { Name: 'Moon', Type: 'Moon' },
  { Name: 'Mars', Type: 'Planet' },
  { Name: 'Jupiter', Type: 'Planet' },
  { Name: 'Saturn', Type: 'Planet' },
  { Name: 'Uranus', Type: 'Planet' },
  { Name: 'Neptune', Type: 'Planet' },
  { Name: 'Pluto', Type: 'Planet' }
];

async function fetchTargetSearch() {
  if (searchQuery.value.trim() === '') {
    targetSearchResult.value = [];
    return;
  }
  try {
    const data = await apiService.searchNGC(searchQuery.value, 10);
    let results = Array.isArray(data) ? data : [];

    // Planeten zur Liste hinzufügen, falls sie dem Suchbegriff entsprechen
    const celestialBodiesResults = celestialBodies.filter(body =>
      body.Name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );

    targetSearchResult.value = [...results, ...celestialBodiesResults];
  } catch (error) {
    console.log('Fehler beim Laden der Vorschläge:', error);
    targetSearchResult.value = [];
  }
}

async function selectTarget(item) {
  if (item.Type) {
    console.log('Planet' + item.Name);

    const stel = stellariumStore.stel;
    const planetInfo = stel.getObj(`NAME ${item.Name}`).getInfo('pvo', stel.observer);
    const cirs = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', planetInfo[0]);
    const ra = stel.anp(stel.c2s(cirs)[0]); // RA in Radian
    const dec = stel.anpm(stel.c2s(cirs)[1]); // Dec in Radian
    item.RA = rad2deg(ra);
    item.Dec = rad2deg(dec);
  }

  stellariumStore.search.RAangle = item.RA;
  stellariumStore.search.DECangle = item.Dec;
  stellariumStore.search.RAangleString = degreesToHMS(item.RA);
  stellariumStore.search.DECangleString = degreesToDMS(item.Dec);
  targetSearchResult.value = [];
  console.log('Ausgewähltes Objekt:', item);
}

// Funktion zum Fokussieren des Suchfelds, wenn es eingeblendet wird
async function focusSearchInput() {
  await nextTick();
  searchInput.value?.focus();
}

// Expose function for parent component
defineExpose({ focusSearchInput });

</script>
