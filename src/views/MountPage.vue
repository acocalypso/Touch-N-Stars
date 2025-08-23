<template>
  <div class="mount-page">
    <SubNav
      :items="[
        { name: t('components.mount.title'), value: 'showMount' },
        { name: t('components.mount.slew'), value: 'showSlew' },
        { name: t('components.tppa.title'), value: 'showTppa' },
      ]"
      v-model:activeItem="store.mount.currentTab"
    />
    <div class="container py-16 flex items-center justify-center">
      <div class="container max-w-md landscape:max-w-xl">
        <h5 class="text-xl text-center font-bold text-white mb-4">
          {{ $t('components.mount.title') }}
        </h5>
        <infoMount
          v-if="store.mount.currentTab !== 'showTppa'"
          v-model="store.mountInfo.Connected"
          class="gap-1 p-2 bg-gray-800/50 rounded-lg border border-gray-700/50"
        />
        <infoCamera
          :show-only-exposing="showTppa"
          class="gap-1 p-2 bg-gray-800/50 rounded-lg border border-gray-700/50"
        />
        <div v-if="store.mountInfo.Connected">
          <div
            class="mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg"
          >
            <div class="container pl-5 pb-5 pr-5">
              <div v-if="store.mount.currentTab === 'showMount'" class="mt-5">
                <controlMount />
              </div>
              <div v-if="store.mount.currentTab === 'showTppa'" class="mt-5">
                <TppaPage />
              </div>
              <div v-if="store.mount.currentTab === 'showSlew'" class="mt-5">
                <TargetSearch class="w-full mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TppaPage from '@/components/tppa/TppaPage.vue';
import TargetSearch from '@/components/framing/TargetSearch.vue';
import infoMount from '@/components/mount/infoMount.vue';
import infoCamera from '@/components/camera/infoCamera.vue';
import controlMount from '@/components/mount/controlMount.vue';
import { apiStore } from '@/store/store';
import SubNav from '@/components/SubNav.vue';
import { useI18n } from 'vue-i18n';

const showTppa = ref(false);
const { t } = useI18n();

const store = apiStore();
</script>

<style scoped></style>
