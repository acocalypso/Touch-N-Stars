<template>
  <div class="filterwheel-page">
    <SubNav
      :items="[
        { name: t('components.filterwheel.title'), value: 'showFilterwheel' },
        { name: t('components.filterwheel.settings.title'), value: 'showSettings' },
      ]"
      v-model:activeItem="currentTab"
    />
    <div class="container py-16 flex items-center justify-center">
      <div class="container max-w-md landscape:max-w-xl">
        <h5 class="text-xl text-center font-bold text-white mb-4">
          {{ $t('components.filterwheel.title') }}
        </h5>
        <div
          v-if="!store.filterInfo.Connected"
          class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p class="text-red-400 font-medium text-center">
            {{ $t('components.filterwheel.please_connect_filterwheel') }}
          </p>
        </div>

        <Transition name="slide-in" mode="out-in">
          <div
            v-if="currentTab === 'showFilterwheel' && store.filterInfo.Connected"
            key="filterwheel-tab"
          >
            <div>
              <InfoFilterwheel class="grid grid-cols-2 landscape:grid-cols-3 mt-4" />
            </div>

            <div
              class="mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
            >
              <strong>{{ $t('components.filterwheel.filter') }}</strong>
              <changeFilter />
            </div>
          </div>
        </Transition>

        <Transition name="slide-in" mode="out-in">
          <div v-if="currentTab === 'showSettings'" key="settings-tab">
            <div
              class="mt-4 border border-gray-700 rounded-lg shadow-lg bg-gradient-to-br from-gray-800 to-gray-900"
            >
              <div class="container pl-5 pb-5 pr-5">
                <div class="mt-5">
                  <FilterSettings />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import changeFilter from '@/components/filterwheel/changeFilter.vue';
import InfoFilterwheel from '@/components/filterwheel/InfoFilterwheel.vue';
import FilterSettings from '@/components/filterwheel/settings/FilterSettings.vue';
import SubNav from '@/components/SubNav.vue';
import { apiStore } from '@/store/store';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const store = apiStore();
const currentTab = ref('showFilterwheel');
</script>

<style scoped>
.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-in-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-in-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-in-enter-to,
.slide-in-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
