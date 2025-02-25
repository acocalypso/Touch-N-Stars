<template>
  <div class="container flex items-center justify-center">
    <div class="container max-w-md">
      <h5 class="text-xl font-bold mb-4">{{ $t('components.framing.search.title') }}</h5>

      <div class="text-black mx-auto">
        <input
          type="text"
          v-model="searchQuery"
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
import apiService from '@/services/apiService';
import { useStellariumStore } from '@/store/stellariumStore';
import { ref } from 'vue';
import { degreesToHMS, degreesToDMS } from '@/utils/utils';

const stellariumStore = useStellariumStore();
const searchQuery = ref('');
const targetSearchResult = ref([]);

async function fetchTargetSearch() {
  if (searchQuery.value.trim() === '') {
    targetSearchResult.value = [];
    return;
  }
  try {
    const data = await apiService.searchNGC(searchQuery.value, 10);
    if (Array.isArray(data)) {
      targetSearchResult.value = data;
    } else {
      console.log("Die API hat kein Array zurückgegeben, 'targetSearchResult' wird geleert.");
      targetSearchResult.value = [];
    }
  } catch (error) {
    console.log('Fehler beim Laden der Vorschläge:', error);
    targetSearchResult.value = [];
  }
}

function selectTarget(item) {
  stellariumStore.search.RAangle = item.RA;
  stellariumStore.search.DECangle = item.Dec;
  stellariumStore.search.RAangleString = degreesToHMS(item.RA);
  stellariumStore.search.DECangleString = degreesToDMS(item.Dec);
  targetSearchResult.value = [];
  console.log('Ausgewähltes Objekt:', item);
}
</script>
