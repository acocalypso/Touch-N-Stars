<template>
  <div class="relative inline-block">
    <button
      class="flex items-center justify-center p-1 w-10 h-10 rounded-full mr-2 bg-gray-600 text-white border border-gray-400 z-top"
      @click="showConfiguration = !showConfiguration"
    >
      <Cog6ToothIcon class="w-6 h-6" />
    </button>

    <Teleport to="body">
      <div
        v-if="showConfiguration"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click="showConfiguration = false"
      >
        <div
          class="w-80 sm:w-96 bg-gray-900/95 border border-gray-600 rounded-lg shadow-xl p-4"
          @click.stop
        >
          <div class="flex items-center justify-between w-full mb-3 pb-2 border-b border-gray-700">
            <h2 class="text-lg font-semibold text-gray-100 tracking-tight">
              {{ t('plugins.livestack.configuration_title') }}
            </h2>
            <button class="text-gray-400 hover:text-gray-200" @click="showConfiguration = false">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>
          <div class="flex flex-col w-full gap-2">
            <div
              class="flex flex-row items-center gap-4 w-full min-w-28 border border-gray-500 p-2 rounded-lg bg-gray-800/70"
            >
              <label for="toggle_osc_components" class="flex-1 text-xs md:text-sm text-gray-200 pl-2">
                {{ t('plugins.livestack.show_rgb_only') }}
              </label>
              <toggleButton
                id="toggle_osc_components"
                @click="store.toogleShowFilters()"
                :status-value="!store.showFilters"
                class="ml-auto px-3 justify-center z-40"
              />
            </div>
            <div
              class="flex flex-row items-center gap-4 w-full min-w-28 border border-gray-500 p-2 rounded-lg bg-gray-800/70"
            >
              <label for="toggle_tracking_stacks" class="flex-1 text-xs md:text-sm text-gray-200 pl-2">
                {{ t('plugins.livestack.track_stack_updates') }}
              </label>
              <toggleButton
                id="toggle_tracking_stacks"
                @click="store.setTrackingStacks(!store.isTrackingStacks)"
                :status-value="store.isTrackingStacks"
                class="ml-auto px-3 justify-center z-40"
              />
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import toggleButton from '@/components/helpers/toggleButton.vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLivestackStore } from '../store/livestackStore.js';

const showConfiguration = ref(false);
const store = useLivestackStore();
const { t } = useI18n();
</script>
