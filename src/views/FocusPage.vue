<template>
  <div
    class="focus-page min-h-screen"
    :style="
      (imageStore.imageData && store.focuserAfInfo.autofocus_running) || !delayShowGraph
        ? `background-image: url(${imageStore.imageData}); background-size: cover; background-position: center; background-repeat: no-repeat;`
        : ''
    "
  >
    <SubNav :items="navItems" v-model:activeItem="currentTab">
      <template #icon-showFocus>
        <EyeIcon class="w-4 h-4" />
      </template>
      <template #icon-showSettings>
        <Cog6ToothIcon class="w-4 h-4" />
      </template>
    </SubNav>

    <!-- Hocus Focus tab: wide layout, its components check the equipment themselves -->
    <div v-if="isHfTab" class="container mt-4">
      <div class="max-w-7xl mx-auto">
        <HfPanel />
      </div>
    </div>

    <div v-else class="container flex items-center justify-center">
      <div class="container max-w-md landscape:max-w-xl">
        <!-- Focus Tab: the only one that needs the focuser; the settings are profile values -->
        <div
          v-if="currentTab === 'showFocus' && !store.focuserInfo.Connected"
          class="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p class="text-red-400 font-medium text-center">
            {{ $t('components.focuser.please_connect_focuser') }}
          </p>
        </div>
        <Transition name="slide-in" mode="out-in">
          <div
            v-if="currentTab === 'showFocus' && store.focuserInfo.Connected"
            class="mt-4"
            key="focus"
          >
            <infoFocuser
              v-model="store.focuserInfo.Connected"
              compact
              class="p-3 bg-surface-1 rounded-card border border-line"
            />
            <HfRunAdvice v-if="hfStore.available" class="mt-4" />
            <div class="mt-4">
              <FocusMainPanel />
            </div>
          </div>
        </Transition>

        <!-- Settings Tab -->
        <Transition name="slide-in" mode="out-in">
          <div v-if="currentTab === 'showSettings'" class="mt-4" key="settings">
            <!-- With Hocus Focus the few settings that matter get the first sub-tab; the HF options
                 live in the Hocus Focus tab. -->
            <FocusSettingsPanel
              :simpleLabel="hfStore.available ? $t('components.focuser.hfSimple.title') : ''"
            >
              <template #simple>
                <HfSimpleSettings @open-assistant="showAssistant = true" />
              </template>
            </FocusSettingsPanel>
          </div>
        </Transition>
      </div>
    </div>

    <HfSetupAssistant
      v-if="hfStore.available"
      :show="showAssistant"
      @close="showAssistant = false"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EyeIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline';
import infoFocuser from '@/components/focuser/infoFocuser.vue';
import FocusMainPanel from '@/components/focuser/FocusMainPanel.vue';
import FocusSettingsPanel from '@/components/focuser/FocusSettingsPanel.vue';
import SubNav from '@/components/SubNav.vue';
import { apiStore } from '@/store/store';
import { useImagetStore } from '@/store/imageStore';
import { useFocuserStore } from '@/store/focuserStore';
import { usePolling } from '@/composables/usePolling';
import { useHocusFocusStore } from '@/store/hocusFocusStore';
import HfSimpleSettings from '@/components/focuser/hocus/HfSimpleSettings.vue';
import HfRunAdvice from '@/components/focuser/hocus/HfRunAdvice.vue';
import HfSetupAssistant from '@/components/focuser/hocus/HfSetupAssistant.vue';
import HfPanel from '@/components/focuser/hocus/HfPanel.vue';

const { t } = useI18n();
const store = apiStore();
const imageStore = useImagetStore();
const focuserStore = useFocuserStore();
const hfStore = useHocusFocusStore();
// Without a focuser the focus tab has nothing to offer: start on the settings instead
const currentTab = ref(store.focuserInfo.Connected ? 'showFocus' : 'showSettings');
const delayShowGraph = ref(false);
const showAssistant = ref(false);

const navItems = computed(() => [
  { name: t('components.focuser.title'), value: 'showFocus' },
  { name: t('components.focuser.settings.title'), value: 'showSettings' },
  ...(hfStore.available ? [{ name: t('components.focuser.hocus.title'), value: 'showHocus' }] : []),
]);
const isHfTab = computed(() => hfStore.available && currentTab.value === 'showHocus');

// Re-probe on every (re)connect and once the PINS check resolved: an instance switch can land on
// a backend with or without Hocus Focus.
watch(
  () => [store.isPINS, store.connectionEpoch],
  () => hfStore.checkAvailability(),
  { immediate: true }
);
watch(
  () => hfStore.available,
  (available) => {
    if (!available && currentTab.value === 'showHocus') currentTab.value = 'showFocus';
  }
);

usePolling(() => focuserStore.readSettings(), 2000);
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
