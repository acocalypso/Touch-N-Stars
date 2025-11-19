<template>
  <div>
    <!-- Modal Trigger -->
    <button
      @click="isModalOpen = true"
      class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md z-10"
    >
      <HeartIcon class="w-6 h-6 text-white" />
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
          <h2 class="text-2xl font-bold">{{ $t('components.fav_target.titel') }}</h2>
          <button @click="isModalOpen = false" class="text-white hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <table
          v-if="favTargetsStore.favoriteTargets.length"
          class="w-full text-sm text-left border border-gray-600 overflow-hidden"
        >
          <thead class="bg-gray-700 text-gray-200">
            <tr>
              <th class="px-4 py-2">{{ $t('components.fav_target.table.name') }}</th>
              <th class="px-4 py-2 hidden sm:table-cell">
                {{ $t('components.fav_target.table.ra') }}
              </th>
              <th class="px-4 py-2 hidden sm:table-cell">
                {{ $t('components.fav_target.table.dec') }}
              </th>
              <th class="px-4 py-2">{{ $t('components.fav_target.table.rotation') }}</th>
              <th class="px-4 py-2" v-if="showFramning">
                {{ $t('components.fav_target.table.load') }}
              </th>
              <th class="px-4 py-2" v-if="showSeqTarget">
                {{ $t('components.fav_target.table.load') }}
              </th>
              <th class="px-4 py-2">{{ $t('components.fav_target.table.remove') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="target in favTargetsStore.favoriteTargets"
              :key="target.name"
              class="border-t border-gray-700 hover:bg-gray-700 transition-colors"
            >
              <td class="px-4 py-2">{{ target.Name }}</td>
              <td class="px-4 py-2 hidden sm:table-cell">{{ target.RaString }}</td>
              <td class="px-4 py-2 hidden sm:table-cell">{{ target.DecString }}</td>
              <td class="px-4 py-2">{{ target.Rotation }}</td>
              <td class="px-4 py-2" v-if="showFramning">
                <button @click="loadTarget(target)" class="hover:text-green-400">
                  <CheckIcon
                    class="w-4 h-4"
                    :class="selectedTargetId === target.Id ? 'text-green-500' : ''"
                  />
                </button>
              </td>
              <td class="px-4 py-2" v-if="showSeqTarget">
                <button @click="setSequenceTarget(target)" class="hover:text-green-400">
                  <CheckIcon
                    class="w-4 h-4"
                    :class="selectedTargetId === target.Id ? 'text-green-500' : ''"
                  />
                </button>
              </td>
              <td class="px-4 py-2">
                <button @click="removeTarget(target.Id)" class="hover:text-red-400">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <p v-else>{{ $t('components.fav_target.no_fav') }}</p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useFavTargetStore } from '@/store/favTargetsStore';
import { useFramingStore } from '@/store/framingStore';
import { useSequenceStore } from '@/store/sequenceStore';
import apiService from '@/services/apiService';
import { TrashIcon, CheckIcon, HeartIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { useToastStore } from '@/store/toastStore';
import { useI18n } from 'vue-i18n';

const framingStore = useFramingStore();
const favTargetsStore = useFavTargetStore();
const sequenceStore = useSequenceStore();
const selectedTargetId = ref(null);
const isModalOpen = ref(false);
const toastStore = useToastStore();
const { t } = useI18n();

const hasSequenceLoaded = computed(
  () =>
    sequenceStore.sequenceIsLoaded &&
    Array.isArray(sequenceStore.sequenceInfo) &&
    sequenceStore.sequenceInfo.length > 0
);

defineProps({
  showSeqTarget: {
    type: Boolean,
    default: true,
  },
  showFramning: {
    type: Boolean,
    default: true,
  },
});

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

async function setSequenceTarget(target) {
  console.log('Setting sequence target', target);

  const Name = target.Name;
  const Ra = target.Ra;
  const Dec = target.Dec;
  const Rotation = target.Rotation || 0;
  const Index = 0;

  console.log('Name:', Name, 'RA:', Ra, 'Dec:', Dec, 'Rotation:', Rotation);

  if (!hasSequenceLoaded.value) {
    console.error('No sequence loaded');
    toastStore.showToast({
      type: 'error',
      title: t('components.fav_target.modal_sequence.titel'),
      message: t('components.fav_target.modal_sequence_error.message'),
    });
    return;
  }
  try {
    await apiService.sequnceTargetSet(Name, Ra, Dec, Rotation, Index);
    console.log('Sequence target updated successfully.');
    toastStore.showToast({
      type: 'success',
      title: t('components.fav_target.modal_sequence.titel'),
      message: t('components.fav_target.modal_sequence_ok.message'),
    });
  } catch (error) {
    console.error('Error setting sequence target:', error);
    toastStore.showToast({
      type: 'error',
      title: t('components.fav_target.modal_sequence.titel'),
      message:
        error?.response?.data?.Message || t('components.fav_target.modal_sequence_error.message'),
    });
  }
}

onMounted(() => {
  favTargetsStore.loadFavorites();
});
</script>
