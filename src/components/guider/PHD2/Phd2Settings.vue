<template>
  <div class="flex flex-col gap-4">
    <div role="tablist" :aria-label="t('settingsTabs')" class="flex gap-2">
      <button
        v-for="tab in tabs"
        :id="'phd2-settings-' + tab"
        :key="tab"
        role="tab"
        :aria-selected="selected === tab"
        :aria-controls="'phd2-panel-' + tab"
        :tabindex="selected === tab ? 0 : -1"
        class="flex-1 rounded-lg px-3 py-2 text-sm font-semibold"
        :class="selected === tab ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-300'"
        @click="selected = tab"
        @keydown="changeTab($event)"
      >
        {{ t(tab === 'general' ? 'generalSettings' : 'title') }}
      </button>
    </div>
    <div
      :id="'phd2-panel-' + selected"
      role="tabpanel"
      :aria-labelledby="'phd2-settings-' + selected"
    >
      <Phd2GeneralSettings v-if="selected === 'general'" />
      <Phd2AIGuiding
        v-else-if="guider.phd2IsConnected"
        @general="selected = 'general'"
        @guiding="$emit('show-guiding')"
      />
      <p v-else class="text-sm text-gray-400">{{ t('connectFirst') }}</p>
    </div>
  </div>
</template>
<script setup>
import { ref, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGuiderStore } from '@/store/guiderStore';
import Phd2GeneralSettings from './Phd2GeneralSettings.vue';
import Phd2AIGuiding from './Phd2AIGuiding.vue';
defineEmits(['show-guiding']);
const guider = useGuiderStore();
const { t: translate } = useI18n();
const t = (key) => translate('components.guider.phd2.ai.' + key);
const tabs = ['general', 'ai'];
const selected = ref('general');
async function changeTab(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  selected.value =
    event.key === 'Home'
      ? 'general'
      : event.key === 'End'
        ? 'ai'
        : selected.value === 'general'
          ? 'ai'
          : 'general';
  await nextTick();
  document.getElementById('phd2-settings-' + selected.value)?.focus();
}
</script>
