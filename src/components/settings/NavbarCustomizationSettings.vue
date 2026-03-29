<template>
  <div class="bg-gray-800/50 rounded-lg border border-gray-700/50">
    <button
      @click="expanded = !expanded"
      class="w-full flex items-center justify-between p-2 sm:p-4 text-left"
    >
      <h3 class="font-bold text-base text-cyan-400">
        {{ $t('components.settings.navbarCustomization.title') }}
      </h3>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-5 h-5 text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': expanded }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-if="expanded" class="px-2 pb-2 sm:px-4 sm:pb-4 flex flex-col gap-3">
      <p class="text-xs text-gray-400">
        {{ $t('components.settings.navbarCustomization.hint') }}
      </p>

    <draggable
      v-model="orderedItems"
      item-key="id"
      handle=".drag-handle"
      :fallbackOnBody="true"
      ghost-class="opacity-40"
      @end="onReorder"
    >
      <template #item="{ element }">
        <div
          class="flex items-center gap-3 py-2 px-3 rounded-md bg-gray-700/60 mb-2 select-none"
          :class="{ 'opacity-50': isHidden(element.id) }"
        >
          <!-- Drag handle -->
          <div class="drag-handle cursor-grab active:cursor-grabbing text-gray-400 flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>

          <!-- Label -->
          <span class="flex-1 text-sm text-white">
            {{ element.labelKey ? $t(element.labelKey) : element.label }}
          </span>

          <!-- Always visible badge -->
          <span v-if="element.alwaysVisible" class="text-xs text-gray-500 italic">
            {{ $t('components.settings.navbarCustomization.alwaysVisible') }}
          </span>

          <!-- Toggle -->
          <toggleButton
            v-else
            :statusValue="!isHidden(element.id)"
            :disabled="isLastVisible(element.id)"
            :title="
              isLastVisible(element.id)
                ? $t('components.settings.navbarCustomization.minOneRequired')
                : ''
            "
            @update:statusValue="toggleItem(element.id)"
          />
        </div>
      </template>
    </draggable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import draggable from 'vuedraggable';
import { useSettingsStore } from '@/store/settingsStore';
import { usePluginStore } from '@/store/pluginStore';
import { apiStore } from '@/store/store';
import toggleButton from '@/components/helpers/toggleButton.vue';

const settingsStore = useSettingsStore();
const pluginStore = usePluginStore();
const store = apiStore();

const expanded = ref(false);

const STATIC_NAV_ITEMS = [
  { id: 'equipment', labelKey: 'nav.equipment' },
  { id: 'camera', labelKey: 'nav.camera' },
  { id: 'autofocus', labelKey: 'nav.autofocus' },
  { id: 'mount', labelKey: 'nav.mount' },
  { id: 'dome', labelKey: 'nav.dome' },
  { id: 'flat', labelKey: 'nav.flatDevice' },
  { id: 'switch', labelKey: 'nav.switch' },
  { id: 'filter', labelKey: 'nav.filterWheel' },
  { id: 'rotator', labelKey: 'nav.rotator' },
  { id: 'guider', labelKey: 'nav.guider' },
  { id: 'sequence', labelKey: 'nav.sequence' },
  { id: 'monitoring', labelKey: 'nav.monitoring' },
  { id: 'flats', labelKey: 'nav.flatWizard' },
  { id: 'skyview', labelKey: 'nav.skyView' },
  { id: 'settings', labelKey: 'nav.settings', alwaysVisible: true },
  { id: 'about', labelKey: 'nav.about' },
];

const allNavItems = computed(() => {
  const pluginItems = pluginStore.navigationItems
    .filter((item) => {
      const plugin = pluginStore.plugins.find((p) => p.id === item.pluginId);
      if (!plugin?.enabled) return false;
      if (plugin.isPins) return store.isPINS;
      return true;
    })
    .map((item) => ({
      id: 'plugin-' + item.pluginId,
      label: item.title,
    }));
  return [...STATIC_NAV_ITEMS, ...pluginItems];
});

function buildOrderedList() {
  const order = settingsStore.navbar?.itemOrder ?? STATIC_NAV_ITEMS.map((i) => i.id);
  const items = allNavItems.value;
  const inOrder = order
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean);
  // Append any items not yet in the stored order (e.g. newly loaded plugins)
  const remaining = items.filter((i) => !order.includes(i.id));
  return [...inOrder, ...remaining];
}

const orderedItems = ref(buildOrderedList());

watch(
  [() => settingsStore.navbar?.itemOrder, allNavItems],
  () => {
    orderedItems.value = buildOrderedList();
  },
  { deep: true },
);

function onReorder() {
  settingsStore.setNavbarOrder(orderedItems.value.map((i) => i.id));
}

function isHidden(id) {
  return settingsStore.navbar?.hiddenItems?.includes(id) ?? false;
}

function visibleNonSettingsCount() {
  return allNavItems.value.filter((item) => !item.alwaysVisible && !isHidden(item.id)).length;
}

function isLastVisible(id) {
  return !isHidden(id) && visibleNonSettingsCount() <= 1;
}

function toggleItem(id) {
  if (isLastVisible(id)) return;
  settingsStore.toggleNavbarItem(id);
}
</script>
