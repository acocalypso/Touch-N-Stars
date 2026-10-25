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

    <div class="text-left mb-2">
      <h1 class="text-xl text-center font-bold">{{ $t('components.focuser.title') }}</h1>
    </div>

    <!-- Hocus Focus analysis tabs: wide layout, their components check the equipment themselves -->
    <div v-if="isHfTab" class="container mt-4">
      <div class="max-w-7xl mx-auto">
        <HfInspectorView v-if="currentTab === 'showInspector'" />
        <HocusFocusTilterPanel v-else-if="currentTab === 'showTilter'" />
      </div>
    </div>

    <div
      v-else-if="!store.focuserInfo.Connected"
      class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
    >
      <p class="text-red-400 font-medium text-center">
        {{ $t('components.focuser.please_connect_focuser') }}
      </p>
    </div>
    <div v-else class="container flex items-center justify-center">
      <div class="container max-w-md landscape:max-w-xl">
        <!-- Focus Tab -->
        <Transition name="slide-in" mode="out-in">
          <div v-if="currentTab === 'showFocus'" class="mt-4" key="focus">
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
            <FocusSettingsPanel v-if="!hfStore.available" />
            <!-- With Hocus Focus the few settings that matter come first; everything else
                 stays reachable, collapsed. -->
            <div v-else class="flex flex-col gap-4">
              <HfSimpleSettings @open-assistant="showAssistant = true" />
              <HfCollapsibleCard
                :title="$t('components.focuser.hfSimple.ninaSettings')"
                v-model:open="openSections.nina"
              >
                <FocusSettingsPanel />
              </HfCollapsibleCard>
              <HfCollapsibleCard
                :title="$t('components.focuser.hocus.tabs.autoFocusOptions')"
                v-model:open="openSections.autoFocus"
              >
                <AutoFocusOptions />
              </HfCollapsibleCard>
              <HfCollapsibleCard
                :title="$t('components.focuser.hocus.tabs.starDetection')"
                v-model:open="openSections.starDetection"
              >
                <StarDetection :isTabActive="true" />
              </HfCollapsibleCard>
            </div>
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
import HfCollapsibleCard from '@/components/focuser/hocus/fields/HfCollapsibleCard.vue';
import HfSimpleSettings from '@/components/focuser/hocus/HfSimpleSettings.vue';
import HfRunAdvice from '@/components/focuser/hocus/HfRunAdvice.vue';
import HfSetupAssistant from '@/components/focuser/hocus/HfSetupAssistant.vue';
import HfInspectorView from '@/components/focuser/hocus/HfInspectorView.vue';
import HocusFocusTilterPanel from '@/components/focuser/hocus/HocusFocusTilterPanel.vue';
import AutoFocusOptions from '@/components/focuser/hocus/AutoFocusOptions.vue';
import StarDetection from '@/components/focuser/hocus/StarDetection.vue';

const { t } = useI18n();
const store = apiStore();
const imageStore = useImagetStore();
const focuserStore = useFocuserStore();
const hfStore = useHocusFocusStore();
const currentTab = ref('showFocus');
const delayShowGraph = ref(false);
const showAssistant = ref(false);
const openSections = ref({ nina: false, autoFocus: false, starDetection: false });

const navItems = computed(() => [
  { name: t('components.focuser.title'), value: 'showFocus' },
  { name: t('components.focuser.settings.title'), value: 'showSettings' },
  ...(hfStore.available
    ? [
        { name: t('components.focuser.hocus.tabs.aberration'), value: 'showInspector' },
        { name: t('components.focuser.hocus.tabs.tilter'), value: 'showTilter' },
      ]
    : []),
]);
const isHfTab = computed(
  () => hfStore.available && ['showInspector', 'showTilter'].includes(currentTab.value)
);

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
    if (!available && isHfTabValue(currentTab.value)) currentTab.value = 'showFocus';
  }
);

function isHfTabValue(value) {
  return value === 'showInspector' || value === 'showTilter';
}

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
