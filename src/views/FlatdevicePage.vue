<template>
  <div>
    <SubNav
      :items="[
        { name: $t('components.flat.title'), value: 'showFlat' },
        { name: $t('components.flat.settings.title'), value: 'showSettings' },
      ]"
      v-model:activeItem="currentTab"
    >
      <template #icon-showFlat>
        <EyeIcon class="w-4 h-4" />
      </template>
      <template #icon-showSettings>
        <Cog6ToothIcon class="w-4 h-4" />
      </template>
    </SubNav>

    <div
      v-if="!store.flatdeviceInfo.Connected"
      class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
    >
      <p class="text-red-400 font-medium text-center">
        {{ $t('components.flat.please_connect_flatDevice') }}
      </p>
    </div>
    <div v-else class="container flex items-center justify-center pt-10">
      <div class="container max-w-md landscape:max-w-xl">
        <!-- Flat Tab -->
        <Transition name="slide-in" mode="out-in">
          <div v-if="currentTab === 'showFlat'" class="mt-4" key="flat">
            <div>
              <InfoFlatdevice class="grid grid-cols-2 landscape:grid-cols-3" />
            </div>
            <div
              class="mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
            >
              <controlFlatdevice class="w-full" />
            </div>
          </div>
        </Transition>

        <!-- Settings Tab -->
        <Transition name="slide-in" mode="out-in">
          <div v-if="currentTab === 'showSettings'" class="mt-4" key="settings">
            <FlatdeviceSettingsPanel />
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { EyeIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline';
import InfoFlatdevice from '@/components/flatdevice/InfoFlatdevice.vue';
import controlFlatdevice from '@/components/flatdevice/controlFlatdevice.vue';
import FlatdeviceSettingsPanel from '@/components/flatdevice/FlatdeviceSettingsPanel.vue';
import SubNav from '@/components/SubNav.vue';
import { apiStore } from '@/store/store';

const store = apiStore();
const currentTab = ref('showFlat');
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
