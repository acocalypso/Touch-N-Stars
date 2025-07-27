<template>
  <div class="container flex items-center justify-center">
    <div class="container max-w-md">
      <h5 class="text-xl text-gray-300 font-bold mb-4">
        {{ $t('components.framing.search.title') }}
      </h5>

      <div class="text-black mx-auto">
        <input
          type="text"
          v-model="searchQuery"
          ref="searchInput"
          @input="fetchTargetSearch"
          class="default-input h-10 w-full"
          :placeholder="$t('components.framing.search.placeholder')"
        />
        <!-- Überprüfe, ob targetSearchResult ein Array ist und Elemente hat -->
        <ul
          v-if="Array.isArray(targetSearchResult) && targetSearchResult.length > 0"
          class="default-select mt-1 z-10"
        >
          <li
            v-for="(item, index) in targetSearchResult"
            :key="index"
            class="p-2 hover:bg-blue-700 cursor-pointer"
            @click="selectTarget(item)"
          >
            {{ item.Name }}
            <span v-if="item['Common names']"> ({{ item['Common names'] }})</span>
            <span v-if="item['M']"> (M {{ item['M'] }})</span>
            <span v-if="item.Type === 'Comet'" class="text-green-400"> (Komet)</span>
            <span v-if="item.Type === 'Planet'" class="text-blue-400"> (Planet)</span>
            <span v-if="item.Type === 'StellariumObject'" class="text-yellow-400"> (Objekt)</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, defineExpose } from 'vue';
import apiService from '@/services/apiService';
import { useStellariumStore } from '@/store/stellariumStore';
import { rad2deg } from '@/utils/utils';
import { Capacitor } from '@capacitor/core';

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
  { Name: 'Pluto', Type: 'Planet' },
];

async function fetchTargetSearch() {
  if (searchQuery.value.trim() === '') {
    targetSearchResult.value = [];
    return;
  }
  try {
    const data = await apiService.searchNGC(searchQuery.value, 10);
    let results = Array.isArray(data) ? data : [];

    // Planeten mit Stellarium-Objekten suchen
    const celestialBodiesResults = [];
    if (stellariumStore.stel) {
      for (const body of celestialBodies) {
        if (body.Name.toLowerCase().includes(searchQuery.value.toLowerCase())) {
          try {
            const obj = stellariumStore.stel.getObj(`NAME ${body.Name}`);
            if (obj && obj.designations && obj.designations().length > 0) {
              celestialBodiesResults.push({
                Name: body.Name,
                Type: body.Type,
                StellariumObj: obj,
              });
            } else {
              // Fallback für Planeten ohne Stellarium-Objekt
              celestialBodiesResults.push(body);
            }
          } catch (error) {
            // Fallback für Planeten ohne Stellarium-Objekt
            celestialBodiesResults.push(body);
          }
        }
      }
    } else {
      // Fallback wenn Stellarium nicht verfügbar
      celestialBodiesResults.push(
        ...celestialBodies.filter((body) =>
          body.Name.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      );
    }

    // Stellarium-Suche für Kometen und andere Objekte
    const stellariumResults = [];
    if (stellariumStore.stel) {
      try {
        console.log('Searching for:', searchQuery.value);

        // Erweiterte Kometen-Suche mit verschiedenen Formaten
        const searchTerms = [
          searchQuery.value,
          `C/${searchQuery.value}`,
          `P/${searchQuery.value}`,
          `D/${searchQuery.value}`,
          searchQuery.value.toUpperCase(),
        ];

        // Spezifische Kometen-Namen für direkte Suche
        if (searchQuery.value.toLowerCase() === 'a3') {
          searchTerms.push(`C/2023 A3`, `C/2023 A3 (Tsuchinshan-ATLAS)`, `Tsuchinshan-ATLAS`);
        }
        if (searchQuery.value.toLowerCase() === 'nishimura') {
          searchTerms.push(`C/2023 P1`, `C/2023 P1 (Nishimura)`);
        }
        if (searchQuery.value.toLowerCase() === 'leonard') {
          searchTerms.push(`C/2021 A1`, `C/2021 A1 (Leonard)`);
        }
        if (searchQuery.value.toLowerCase() === 'halley') {
          searchTerms.push(`1P/Halley`, `P/Halley`);
        }
        // Allgemeine Kometen-Suche
        if (searchQuery.value.includes('2023') || searchQuery.value.includes('C/2023')) {
          searchTerms.push(`C/2023 A1`, `C/2023 A2`, `C/2023 A3`, `C/2023 P1`, `C/2023 H2`);
        }
        if (searchQuery.value.includes('2024') || searchQuery.value.includes('C/2024')) {
          searchTerms.push(`C/2024 G3`, `C/2024 S1`);
        }

        console.log('Search terms:', searchTerms);

        for (const searchTerm of searchTerms) {
          try {
            const obj = stellariumStore.stel.getObj(searchTerm);
            console.log(`Searching for "${searchTerm}":`, obj);

            if (obj && obj.designations && obj.designations().length > 0) {
              const designations = obj.designations();
              const objName = designations[0].replace(/^NAME /, '');
              console.log('Found object:', objName, designations);

              // Prüfe ob das Objekt dem Suchbegriff entspricht
              if (objName.toLowerCase().includes(searchQuery.value.toLowerCase())) {
                stellariumResults.push({
                  Name: objName,
                  Type: objName.match(/^[CPD]\//) ? 'Comet' : 'StellariumObject',
                  StellariumObj: obj,
                });
              }
            }
          } catch (objError) {
            console.log(`No object found for "${searchTerm}"`);
          }
        }

        // Fallback: Bekannte Kometen hinzufügen wenn Stellarium-Suche fehlschlägt
        if (stellariumResults.length === 0) {
          console.log('No stellarium results, trying fallback comet list...');
          
          // Liste bekannter Kometen für Fallback
          const knownComets = [
            { name: 'C/2023 A3 (Tsuchinshan-ATLAS)', aliases: ['a3', 'tsuchinshan', 'atlas', '2023 a3', 'c/2023 a3'] },
            { name: 'C/2021 A1 (Leonard)', aliases: ['leonard', '2021 a1', 'c/2021 a1'] },
            { name: '1P/Halley', aliases: ['halley', '1p/halley', 'p/halley'] },
            { name: 'C/2023 P1 (Nishimura)', aliases: ['nishimura', '2023 p1', 'c/2023 p1'] },
            { name: 'C/2024 G3 (ATLAS)', aliases: ['2024 g3', 'c/2024 g3'] },
            { name: 'C/2024 S1 (ATLAS)', aliases: ['2024 s1', 'c/2024 s1'] },
            { name: '109P/Swift-Tuttle', aliases: ['swift-tuttle', '109p', 'swift tuttle'] },
            { name: '55P/Tempel-Tuttle', aliases: ['tempel-tuttle', '55p', 'tempel tuttle'] },
            { name: '81P/Wild', aliases: ['wild', '81p'] },
          ];
          
          const searchLower = searchQuery.value.toLowerCase().trim();
          
          for (const comet of knownComets) {
            // Prüfe ob der Suchbegriff im Namen oder in den Aliassen enthalten ist
            const nameMatch = comet.name.toLowerCase().includes(searchLower);
            const aliasMatch = comet.aliases.some(alias => 
              alias.includes(searchLower) || searchLower.includes(alias)
            );
            
            if (nameMatch || aliasMatch) {
              console.log('Found fallback comet:', comet.name);
              
              // Versuche das Objekt in Stellarium zu finden
              try {
                let obj = null;
                const searchVariants = [comet.name, `NAME ${comet.name}`];
                
                for (const variant of searchVariants) {
                  try {
                    obj = stellariumStore.stel.getObj(variant);
                    if (obj) break;
                  } catch (e) {
                    // Weiter versuchen
                  }
                }
                
                stellariumResults.push({
                  Name: comet.name,
                  Type: 'Comet',
                  StellariumObj: obj, // Kann null sein, wird dann als Koordinaten-Objekt behandelt
                });
              } catch (error) {
                console.log('Could not find stellarium object for:', comet.name);
                // Füge trotzdem hinzu, auch ohne Stellarium-Objekt
                stellariumResults.push({
                  Name: comet.name,
                  Type: 'Comet',
                  StellariumObj: null,
                });
              }
            }
          }
        }
        
        // Versuche auch direkte Suche mit Stellarium's Suchfunktion
        try {
          const comets = stellariumStore.stel.core.comets;
          console.log('Comets module available:', !!comets);
          
          if (comets && comets.listObjs) {
            try {
              const cometList = comets.listObjs(stellariumStore.stel.core.observer, 20, () => true);
              console.log('Found comets with listObjs:', cometList.length);
              
              for (const comet of cometList) {
                if (comet.designations) {
                  const designations = comet.designations();
                  for (const designation of designations) {
                    const name = designation.replace(/^NAME /, '');
                    if (name.toLowerCase().includes(searchQuery.value.toLowerCase())) {
                      console.log('Found matching comet via listObjs:', name);
                      // Prüfe ob schon vorhanden
                      const exists = stellariumResults.some(r => r.Name === name);
                      if (!exists) {
                        stellariumResults.push({
                          Name: name,
                          Type: 'Comet',
                          StellariumObj: comet,
                        });
                      }
                      break;
                    }
                  }
                }
                if (stellariumResults.length >= 10) break;
              }
            } catch (listError) {
              console.log('listObjs error:', listError);
            }
          }
        } catch (searchError) {
          console.log('Comet search error:', searchError);
        }

        console.log('Final stellarium results:', stellariumResults);
      } catch (stellariumError) {
        console.log('Stellarium search error:', stellariumError);
      }
    }

    // Duplikate entfernen - Priorität: celestialBodies > stellariumResults
    const allResults = [...results, ...celestialBodiesResults];

    // Nur Stellarium-Ergebnisse hinzufügen, die nicht bereits als Planeten gefunden wurden
    const planetNames = celestialBodiesResults.map((item) => item.Name.toLowerCase());
    const uniqueStellarium = stellariumResults.filter(
      (item) => !planetNames.includes(item.Name.toLowerCase())
    );

    targetSearchResult.value = [...allResults, ...uniqueStellarium];
  } catch (error) {
    console.log('Fehler beim Laden der Vorschläge:', error);
    targetSearchResult.value = [];
  }
}

async function selectTarget(item) {
  // Immediately blur input field to dismiss keyboard on iOS
  if (searchInput.value) {
    searchInput.value.blur();
  }

  // Clear search results immediately to prevent further user interaction
  targetSearchResult.value = [];

  // Platform detection for iOS-specific handling using Capacitor
  const isIOS = Capacitor.getPlatform() === 'ios';

  // Extended delay for iOS to ensure keyboard is fully dismissed
  const delayTime = isIOS ? 300 : 10;

  // Wrap the complex operations in setTimeout to prevent iOS UI thread blocking
  setTimeout(async () => {
    try {
      const stel = stellariumStore.stel;
      let observedVec;

      // Handle Stellarium objects (Comets, Planets and other objects found in Stellarium)
      if (item.StellariumObj) {
        console.log('Stellarium Object:', item.Name);
        // Direktes Auswählen des Stellarium-Objekts
        stel.core.selection = item.StellariumObj;
        stel.pointAndLock(item.StellariumObj);
        console.log('Ausgewähltes Stellarium-Objekt:', item);
        return;
      }

      // Handle Comets without StellariumObj (fallback mode)
      if (item.Type === 'Comet' && !item.StellariumObj) {
        console.log('Fallback Comet (no stellarium object):', item.Name);
        
        // Zeige eine Meldung, dass der Komet nicht gefunden wurde
        alert(`Der Komet "${item.Name}" wurde in der aktuellen Stellarium-Datenbank nicht gefunden. Möglicherweise ist er nicht sichtbar oder die Daten sind nicht geladen.`);
        return;
      }

      // Handle legacy Planets without StellariumObj (fallback)
      if (item.Type && (item.Type === 'Planet' || item.Type === 'Star' || item.Type === 'Moon')) {
        console.log('Legacy Planet/Object:', item.Name);

        const planetInfo = stel.getObj(`NAME ${item.Name}`).getInfo('pvo', stel.observer);
        const cirs = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', planetInfo[0]);
        const ra = stel.anp(stel.c2s(cirs)[0]); // RA in Radian
        const dec = stel.anpm(stel.c2s(cirs)[1]); // Dec in Radian
        item.RA = rad2deg(ra);
        item.Dec = rad2deg(dec);
      }

      // Handle coordinate-based objects (NGC, etc.)
      const ra_rad = item.RA * stel.D2R;
      const dec_rad = item.Dec * stel.D2R;
      const icrfVec = stel.s2c(ra_rad, dec_rad);
      //stel.getObj('NAME Mars').getInfo('pvo', stel.observer); //!!!Workaround damit die Daten richtig berechnet werden NICHT LÖSCHEN
      observedVec = stel.convertFrame(stel.observer, 'ICRF', 'CIRS', icrfVec);

      // For iOS, we'll use a two-phase approach to update the UI
      if (isIOS) {
        // Phase 1: Create circle but don't select yet
        const targetCircle = stellariumStore.stel.createObj('circle', {
          id: 'targetCircle',
          pos: observedVec,
          color: [0, 0, 0, 0.1],
          size: [0.05, 0.05], // Größe der Markierung
        });

        // Phase 2: Set selection with additional delay
        setTimeout(() => {
          try {
            targetCircle.pos = observedVec;
            targetCircle.update();
            stel.core.selection = targetCircle;
            stel.pointAndLock(targetCircle);
            console.log('Ausgewähltes Objekt:', item);
          } catch (error) {
            console.error('Error in phase 2 selection:', error);
          }
        }, 200);
      } else {
        // Non-iOS devices use the original approach
        const targetCircle = stellariumStore.stel.createObj('circle', {
          id: 'targetCircle',
          pos: observedVec,
          color: [0, 0, 0, 0.1],
          size: [0.05, 0.05], // Größe der Markierung
        });

        targetCircle.pos = observedVec;
        targetCircle.update();
        stel.core.selection = targetCircle;
        stel.pointAndLock(targetCircle);
        console.log('Ausgewähltes Objekt:', item);
      }
    } catch (error) {
      console.error('Error selecting target:', error);
    }
  }, delayTime);
}

// Funktion zum Fokussieren des Suchfelds, wenn es eingeblendet wird
async function focusSearchInput() {
  // Platform detection for iOS-specific handling using Capacitor
  const isIOS = Capacitor.getPlatform() === 'ios';

  await nextTick();

  if (isIOS) {
    // On iOS, add a delay before focusing to prevent UI issues
    setTimeout(() => {
      searchInput.value?.focus();
    }, 150);
  } else {
    searchInput.value?.focus();
  }
}

// Expose function for parent component
defineExpose({ focusSearchInput });
</script>
