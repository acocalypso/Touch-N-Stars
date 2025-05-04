<template>
  <div>
    <!-- Modal Trigger -->
    <button
      @click="isModalOpen = true"
      class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md z-10"
    >
      <StarIcon class="w-6 h-6 text-white" />
    </button>
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      @click.self="isModalOpen = false"
    >
      <div
        class="bg-gray-800 text-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        @click.stop
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">{{ $t('components.sequence.info.header') }}</h2>
          <button @click="isModalOpen = false" class="text-white hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <table v-if="favTargetsStore.favoriteTargets.length" class="w-full">
          <thead>
            <tr class="text-left">
              <th>Name</th>
              <th>RA (°)</th>
              <th>DEC (°)</th>
              <th>Load</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="target in favTargetsStore.favoriteTargets" :key="target.name">
              <td>{{ target.Name }}</td>
              <td>{{ target.RaString }}</td>
              <td>{{ target.DecString }}</td>
              <td >
                <button @click="loadTarget(target)">
                  <CheckIcon
                    class="w-4 h-4"
                    :class="selectedTargetId === target.Id ? 'text-green-500' : ''"
                  />
                </button>
              </td>
              <td >
                <button @click="removeTarget(target.Id)">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else>Keine Favoriten gespeichert.</p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue';
import { useFavTargetStore } from '@/store/favTargetsStore';
import { useFramingStore } from '@/store/framingStore';
import { TrashIcon, CheckIcon, StarIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const framingStore = useFramingStore();
const favTargetsStore = useFavTargetStore();
const selectedTargetId = ref(null);
const isModalOpen = ref(false);

function loadTarget(target) {
  console.log('laden');
  framingStore.RAangle = target.Ra;
  framingStore.DECangle = target.Dec;
  framingStore.RAangleString = target.RaString;
  framingStore.DECangleString = target.DecString;
  framingStore.rotationAngle = target.Rotation ?? 0;
  framingStore.selectedItem = {
    Name: target.Name,
    RA: target.Ra,
    Dec: target.Dec,
  };
  selectedTargetId.value = target.Id;
}

function removeTarget(id) {
  console.log('Remove', id);
  favTargetsStore.removeFavorite(id);
}

onMounted(() => {
  favTargetsStore.loadFavorites();
});
</script>
