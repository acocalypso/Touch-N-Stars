<template>
  <div class="rotator-page">
    <SubNav
      :items="[
        { name: t('components.rotator.title'), value: 'showRotator' },
        { name: t('components.rotator.settings.title'), value: 'showSettings' },
      ]"
      v-model:activeItem="currentTab"
    >
      <template #icon-showRotator>
        <EyeIcon class="w-4 h-4" />
      </template>
      <template #icon-showSettings>
        <Cog6ToothIcon class="w-4 h-4" />
      </template>
    </SubNav>

    <div class="text-left mb-2">
      <h1 class="text-xl text-center font-bold">{{ $t('components.rotator.title') }}</h1>
    </div>
    <div
      v-if="!store.rotatorInfo.Connected"
      class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
    >
      <p class="text-red-400 font-medium text-center">
        {{ $t('components.rotator.please_connect_rotator') }}
      </p>
    </div>
    <div v-else class="container flex items-center justify-center">
      <div class="container max-w-md landscape:max-w-xl">
        <!-- Rotator Tab -->
        <Transition name="slide-in" mode="out-in">
          <div v-if="currentTab === 'showRotator'" key="rotator">
            <div>
              <infoRotator class="grid grid-cols-2 landscape:grid-cols-3" />
            </div>
            <div
              class="mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
            >
              <strong>{{ $t('components.rotator.control') }}</strong>
              <controlRotator />
            </div>
          </div>
        </Transition>

        <!-- Settings Tab -->
        <Transition name="slide-in" mode="out-in">
          <div v-if="currentTab === 'showSettings'" class="mt-4" key="settings">
            <RotatorSettingsPanel />
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EyeIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline';
import controlRotator from '@/components/rotator/controlRotator.vue';
import infoRotator from '@/components/rotator/infoRotator.vue';
import RotatorSettingsPanel from '@/components/rotator/RotatorSettingsPanel.vue';
import SubNav from '@/components/SubNav.vue';
import { apiStore } from '@/store/store';

const { t } = useI18n();
const store = apiStore();
const currentTab = ref('showRotator');
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
