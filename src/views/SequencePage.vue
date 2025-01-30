<template>
  <div v-if="!store.sequenceIsLoaded" class="pt-2">
    <div class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
      <p class="text-red-400 font-medium">{{ $t('components.sequence.noSequenceLoaded') }}</p>
    </div>
  </div>
  <div v-else class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6">
    <div class="max-w-6xl mx-auto lg:px-4">
      <div class="space-y-6 md:space-y-8">
        <!-- Added floating header effect -->
        <div class="backdrop-blur-sm bg-gray-800/50 rounded-xl p-4 shadow-xl">
          <controlSequence />
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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<script setup>
import infoSequence from '@/components/sequence/infoSequence.vue';
import controlSequence from '@/components/sequence/controlSequence.vue';
import { apiStore } from '@/store/store';
import { ref } from 'vue';

const currentTab = ref('showSequenz'); // Standardwert
const store = apiStore();
</script>
<style scoped></style>
