<template>
  <section
    class="col-span-full grid w-full gap-3 rounded-lg border border-gray-500 p-3"
    data-testid="atlas-catalog-filters"
  >
    <div>
      <p class="font-medium text-gray-200">
        {{ t('components.stellarium.settings.catalog_filters') }}
      </p>
      <p class="text-xs leading-5 text-gray-400">
        {{ t('components.stellarium.settings.catalog_filter_hint') }}
      </p>
    </div>

    <fieldset :disabled="disabled" class="grid gap-2 disabled:opacity-50">
      <AtlasFacetGroup
        kind="object-types"
        :title="t('components.stellarium.settings.catalog_filter_types')"
        :facets="objectTypes"
        :selection="settingsStore.stellarium.deepSkyObjectTypes"
        @select-all="setSelection('deepSkyObjectTypes', null)"
        @select-none="setSelection('deepSkyObjectTypes', [])"
        @toggle="toggleSelection('deepSkyObjectTypes', objectTypes, $event)"
      />

      <AtlasFacetGroup
        kind="catalogue-groups"
        :title="t('components.stellarium.settings.catalog_filter_sources')"
        :facets="catalogueGroups"
        :selection="settingsStore.stellarium.deepSkyCatalogueGroups"
        @select-all="setSelection('deepSkyCatalogueGroups', null)"
        @select-none="setSelection('deepSkyCatalogueGroups', [])"
        @toggle="toggleSelection('deepSkyCatalogueGroups', catalogueGroups, $event)"
      />
    </fieldset>
  </section>
</template>

<script setup>
import { useSettingsStore } from '@/store/settingsStore';
import { toggleAtlasFacetSelection } from '@/integrations/celestiaAtlas/catalogFilters';
import AtlasFacetGroup from '@/components/stellarium/AtlasFacetGroup.vue';
import { useI18n } from 'vue-i18n';

defineProps({
  objectTypes: {
    type: Array,
    default: () => [],
  },
  catalogueGroups: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const settingsStore = useSettingsStore();
const { t } = useI18n();

function setSelection(setting, value) {
  settingsStore.stellarium[setting] = value;
}

function toggleSelection(setting, facets, { key, enabled }) {
  settingsStore.stellarium[setting] = toggleAtlasFacetSelection(
    settingsStore.stellarium[setting],
    key,
    enabled,
    facets
  );
}
</script>
