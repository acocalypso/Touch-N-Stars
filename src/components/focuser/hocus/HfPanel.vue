<template>
  <div class="flex flex-col gap-4">
    <SegmentTabs v-model="activeTab" :tabs="tabs" />

    <!-- Each sub-tab mounts only while active, so the inspector's status polling stops elsewhere -->
    <HfInspectorView v-if="activeTab === 'aberration'" />
    <AberrationInspectorOptions v-else-if="activeTab === 'aberrationOptions'" />
    <AutoFocusOptions v-else-if="activeTab === 'autoFocusOptions'" />
    <StarDetection v-else-if="activeTab === 'starDetection'" :isTabActive="true" />
    <HocusFocusTilterPanel v-else-if="activeTab === 'tilter'" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SegmentTabs from '@/components/helpers/SegmentTabs.vue';
import HfInspectorView from './HfInspectorView.vue';
import AberrationInspectorOptions from './AberrationInspectorOptions.vue';
import AutoFocusOptions from './AutoFocusOptions.vue';
import StarDetection from './StarDetection.vue';
import HocusFocusTilterPanel from './HocusFocusTilterPanel.vue';

const { t } = useI18n();
const activeTab = ref('aberration');

const tabs = computed(() =>
  ['aberration', 'aberrationOptions', 'autoFocusOptions', 'starDetection', 'tilter'].map(
    (value) => ({ value, label: t(`components.focuser.hocus.tabs.${value}`) })
  )
);
</script>
