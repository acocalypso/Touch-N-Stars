<template>
  <div>
    <button @click="showModal = true" class="default-button-cyan">
      <HeartIcon class="w-7 h-7" />
    </button>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-gray-800 text-gray-300 p-4 m-8 rounded-lg max-w-xl max-h-[80vh] min-h-48 min-w-72 overflow-y-auto"
      >
        <h3 class="text-lg font-semibold mb-4">
          {{ t('components.fav_target.enter_name') }}
        </h3>
        <input
          v-model="nameInput"
          type="text"
          class="w-full h-10 default-input"
        />
        <div class="flex justify-end mt-4 space-x-2">
          <button @click="confirmSave" class="default-button-cyan">
            {{ t('common.confirm') }}
          </button>
          <button @click="showModal = false" class="default-button-red">
            {{ t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useFavTargetStore } from '@/store/favTargetsStore';
import { HeartIcon } from '@heroicons/vue/24/outline';
import { useI18n } from 'vue-i18n';

const favTargetsStore = useFavTargetStore();
const { t } = useI18n();

const props = defineProps({
  name: { type: String, default: 'Unknown' },
  ra: Number,
  dec: Number,
  raString: String,
  decString: String,
  rotation: { type: Number, default: 0 },
});

const showModal = ref(false);
const nameInput = ref(props.name);

function confirmSave() {
  if (!nameInput.value.trim()) return;
  console.log('rotation', props.rotation);

  const newTarget = {
    Name: nameInput.value.trim(),
    Ra: props.ra,
    Dec: props.dec,
    RaString: props.raString,
    DecString: props.decString,
    Rotation: props.rotation,
  };

  favTargetsStore.addFavorite(newTarget);

  showModal.value = false;
}
</script>
