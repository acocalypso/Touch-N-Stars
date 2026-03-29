<template>
  <div class="p-2 sm:p-4 flex flex-col gap-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
    <h3 class="font-bold text-base text-cyan-400">
      {{ $t('components.settings.navbarCustomization.title') }}
    </h3>
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
          <span class="flex-1 text-sm text-white">{{ $t(element.labelKey) }}</span>

          <!-- Always visible badge -->
          <span v-if="element.alwaysVisible" class="text-xs text-gray-500 italic">
            {{ $t('components.settings.navbarCustomization.alwaysVisible') }}
          </span>

          <!-- Toggle -->
          <button
            v-else
            @click="toggleItem(element.id)"
            :disabled="isLastVisible(element.id)"
            :title="
              isLastVisible(element.id)
                ? $t('components.settings.navbarCustomization.minOneRequired')
                : ''
            "
            class="flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            :class="isHidden(element.id) ? 'bg-gray-600' : 'bg-cyan-500'"
          >
            <span
              class="block w-4 h-4 rounded-full bg-white mx-1 transition-transform duration-200"
              :class="isHidden(element.id) ? 'translate-x-0' : 'translate-x-4'"
            />
          </button>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import draggable from 'vuedraggable';
import { useSettingsStore } from '@/store/settingsStore';

const settingsStore = useSettingsStore();

const ALL_NAV_ITEMS = [
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

function buildOrderedList() {
  const order = settingsStore.navbar?.itemOrder ?? ALL_NAV_ITEMS.map((i) => i.id);
  const sorted = [...ALL_NAV_ITEMS].sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  return sorted;
}

const orderedItems = ref(buildOrderedList());

watch(
  () => settingsStore.navbar?.itemOrder,
  () => {
    orderedItems.value = buildOrderedList();
  },
  { deep: true }
);

function onReorder() {
  settingsStore.setNavbarOrder(orderedItems.value.map((i) => i.id));
}

function isHidden(id) {
  return settingsStore.navbar?.hiddenItems?.includes(id) ?? false;
}

function visibleNonSettingsCount() {
  return ALL_NAV_ITEMS.filter((item) => !item.alwaysVisible && !isHidden(item.id)).length;
}

function isLastVisible(id) {
  return !isHidden(id) && visibleNonSettingsCount() <= 1;
}

function toggleItem(id) {
  if (isLastVisible(id)) return;
  settingsStore.toggleNavbarItem(id);
}
</script>
