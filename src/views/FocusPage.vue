<template>
  <div
    class="focus-page"
    :style="
      (imageStore.imageData && store.focuserAfInfo.autofocus_running) || !delayShowGraph
        ? `background-image: url(${imageStore.imageData}); background-size: cover; background-position: center; background-repeat: no-repeat;`
        : ''
    "
  >
    <SubNav
      :items="[
        { name: t('components.focuser.title'), value: 'showFocus' },
        { name: t('components.focuser.settings.title'), value: 'showSettings' },
      ]"
      v-model:activeItem="store.focuser.currentTab"
    >
      <template #icon-showFocus>
        <EyeIcon class="w-4 h-4" />
      </template>
      <template #icon-showSettings>
        <Cog6ToothIcon class="w-4 h-4" />
      </template>
    </SubNav>

    <div class="text-left mb-2">
      <h1 class="text-xl text-center font-bold">{{ $t('components.focuser.title') }}</h1>
    </div>
    <div
      v-if="!store.focuserInfo.Connected"
      class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
    >
      <p class="text-red-400 font-medium text-center">
        {{ $t('components.focuser.please_connect_focuser') }}
      </p>
    </div>
    <div v-else class="container flex items-center justify-center">
      <div class="container max-w-md landscape:max-w-xl">
        <!-- Focus Tab -->
        <div v-if="store.focuser.currentTab === 'showFocus'" class="mt-4">
          <infoFocuser
            v-model="store.focuserInfo.Connected"
            class="grid grid-cols-2 landscape:grid-cols-3"
          />
          <div class="mt-4">
            <FocusMainPanel />
          </div>
        </div>

        <!-- Settings Tab -->
        <div v-if="store.focuser.currentTab === 'showSettings'" class="mt-4">
          <FocusSettingsPanel />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { EyeIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline';
import infoFocuser from '@/components/focuser/infoFocuser.vue';
import FocusMainPanel from '@/components/focuser/FocusMainPanel.vue';
import FocusSettingsPanel from '@/components/focuser/FocusSettingsPanel.vue';
import SubNav from '@/components/SubNav.vue';
import { apiStore } from '@/store/store';
import { useImagetStore } from '@/store/imageStore';

const { t } = useI18n();
const store = apiStore();
const imageStore = useImagetStore();
</script>
