<template>
  <div class="flex flex-col h-full bg-gray-900 text-white p-4 md:p-6 overflow-y-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl md:text-3xl font-bold flex items-center gap-2">
        <BoltIcon class="w-8 h-8" />
        {{ $t('plugins.shortcuts.title') }}
      </h1>
      <button
        v-if="!showEditor"
        @click="openEditor()"
        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <PlusIcon class="w-5 h-5" />
        {{ $t('plugins.shortcuts.addNew') }}
      </button>
    </div>

    <!-- Editor -->
    <div v-if="showEditor" class="mb-6">
      <ShortcutEditor :shortcut="editingShortcut" @save="handleSave" @cancel="handleCancel" />
    </div>

    <!-- Empty state -->
    <div
      v-if="!shortcutsStore.hasShortcuts && !showEditor"
      class="flex-1 flex flex-col items-center justify-center text-center p-8"
    >
      <BoltIcon class="w-20 h-20 text-gray-600 mb-4" />
      <h2 class="text-xl font-semibold text-gray-400 mb-2">
        {{ $t('plugins.shortcuts.noShortcuts') }}
      </h2>
      <p class="text-gray-500 mb-6">
        {{ $t('plugins.shortcuts.noShortcutsDescription') }}
      </p>
      <button
        @click="openEditor()"
        class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <PlusIcon class="w-5 h-5" />
        {{ $t('plugins.shortcuts.createFirst') }}
      </button>
    </div>

    <!-- Shortcuts grid -->
    <div
      v-if="shortcutsStore.hasShortcuts && !showEditor"
      class="grid gap-4 pb-32"
      :class="gridClasses"
    >
      <div v-for="shortcut in shortcutsStore.shortcuts" :key="shortcut.id" class="relative group">
        <!-- Shortcut Button -->
        <ShortcutButton :shortcut="shortcut" @menu-click="toggleMenu" />

        <!-- Dropdown Menu -->
        <div
          v-if="openMenuId === shortcut.id"
          class="absolute top-full mt-2 right-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-30 min-w-[150px]"
        >
          <button
            @click="handleEditClick(shortcut)"
            class="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
          >
            <PencilIcon class="w-4 h-4" />
            {{ $t('plugins.shortcuts.edit') }}
          </button>
          <button
            @click="handleDeleteClick(shortcut)"
            class="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-3"
          >
            <TrashIcon class="w-4 h-4" />
            {{ $t('plugins.shortcuts.delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Overlay to close menu when clicking outside -->
    <div v-if="openMenuId !== null" @click="closeMenu" class="fixed inset-0 z-10"></div>

    <!-- Delete confirmation modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="cancelDelete"
    >
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full space-y-4">
        <h3 class="text-xl font-semibold text-white">
          {{ $t('plugins.shortcuts.confirmDelete') }}
        </h3>
        <p class="text-gray-300">
          {{ $t('plugins.shortcuts.confirmDeleteMessage', { phrase: shortcutToDelete?.phrase }) }}
        </p>
        <div class="flex gap-3">
          <button
            @click="handleDelete"
            class="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            {{ $t('plugins.shortcuts.delete') }}
          </button>
          <button
            @click="cancelDelete"
            class="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            {{ $t('plugins.shortcuts.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useShortcutsStore } from '../store/shortcutsStore';
import { useOrientation } from '@/composables/useOrientation';
import ShortcutButton from '../components/ShortcutButton.vue';
import ShortcutEditor from '../components/ShortcutEditor.vue';
import { BoltIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';

const shortcutsStore = useShortcutsStore();
const { isLandscape } = useOrientation();

const showEditor = ref(false);
const editingShortcut = ref(null);
const showDeleteConfirm = ref(false);
const shortcutToDelete = ref(null);
const openMenuId = ref(null);

// Compute grid classes based on orientation
const gridClasses = computed(() => {
  return isLandscape.value ? 'grid-cols-2' : 'grid-cols-1';
});

const openEditor = (shortcut = null) => {
  editingShortcut.value = shortcut;
  showEditor.value = true;
};

const handleSave = (shortcutData) => {
  if (editingShortcut.value) {
    // Update existing shortcut
    shortcutsStore.updateShortcut(editingShortcut.value.id, shortcutData);
  } else {
    // Create new shortcut
    shortcutsStore.addShortcut(shortcutData);
  }
  handleCancel();
};

const handleCancel = () => {
  showEditor.value = false;
  editingShortcut.value = null;
};

const toggleMenu = (shortcutId) => {
  if (openMenuId.value === shortcutId) {
    openMenuId.value = null;
  } else {
    openMenuId.value = shortcutId;
  }
};

const closeMenu = () => {
  openMenuId.value = null;
};

const handleEditClick = (shortcut) => {
  closeMenu();
  openEditor(shortcut);
};

const handleDeleteClick = (shortcut) => {
  closeMenu();
  confirmDelete(shortcut);
};

const confirmDelete = (shortcut) => {
  shortcutToDelete.value = shortcut;
  showDeleteConfirm.value = true;
};

const handleDelete = () => {
  if (shortcutToDelete.value) {
    shortcutsStore.deleteShortcut(shortcutToDelete.value.id);
  }
  cancelDelete();
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
  shortcutToDelete.value = null;
};
</script>
