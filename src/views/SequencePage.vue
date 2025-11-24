<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6">
    <div class="fixed right-3 z-10" style="bottom: calc(env(safe-area-inset-bottom, 0px) + 48px)">
      <button
        @click="toggleEdit"
        class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md"
        :class="{ 'connected-glow': sequenceStore.sequenceEdit }"
        v-if="sequenceStore.sequenceIsEditable"
      >
        <PencilIcon class="icon" />
      </button>
    </div>

    <FavTargets
      :show-framning="false"
      class="fixed right-16 z-10"
      style="bottom: calc(env(safe-area-inset-bottom, 0px) + 48px)"
    />

    <controlSequence v-if="sequenceStore.sequenceIsLoaded" />
    <div class="max-w-6xl mx-auto lg:px-4">
      <div class="space-y-6 md:space-y-8">
        <!-- Added floating header effect -->
        <div class="backdrop-blur-sm bg-gray-800/50 rounded-xl p-4 shadow-xl">
          <LoadSequence />
          <transition name="slide-fade">
            <div v-show="currentTab === 'showSequenz'" class="space-y-6 md:space-y-8">
              <infoSequence />
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount } from 'vue';
import infoSequence from '@/components/sequence/infoSequence.vue';
import controlSequence from '@/components/sequence/controlSequence.vue';
import { useSequenceStore } from '@/store/sequenceStore';
import { ref } from 'vue';
import { PencilIcon } from '@heroicons/vue/24/outline';
import FavTargets from '@/components/favTargets/FavTargets.vue';
import LoadSequence from '@/components/sequence/LoadSequence.vue';

const currentTab = ref('showSequenz'); // Standardwert
const sequenceStore = useSequenceStore();

function toggleEdit() {
  sequenceStore.sequenceEdit = !sequenceStore.sequenceEdit;
  if (sequenceStore.sequenceEdit) {
    sequenceStore.stopFetching();
  } else {
    sequenceStore.startFetching();
  }
}
onBeforeUnmount(() => {
  sequenceStore.sequenceEdit = false;
  sequenceStore.startFetching();
});
</script>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.connected-glow {
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
}
</style>
