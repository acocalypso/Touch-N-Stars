import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { useToastStore } from '@/store/toastStore';
import { useSequenceStore } from '@/store/sequenceStore';

export const useShortcutsStore = defineStore('shortcuts', {
  state: () => ({
    shortcuts: [],
    availableSequences: [],
    isLoadingSequences: false,
  }),

  getters: {
    getShortcutById: (state) => (id) => {
      return state.shortcuts.find((shortcut) => shortcut.id === id);
    },
    hasShortcuts: (state) => state.shortcuts.length > 0,
  },

  actions: {
    // Load available sequences from N.I.N.A
    async loadAvailableSequences() {
      this.isLoadingSequences = true;
      try {
        const response = await apiService.sequenceAction('list-available');
        if (response && response.data) {
          this.availableSequences = response.data;
        }
      } catch (error) {
        console.error('Error loading sequences:', error);
        const toastStore = useToastStore();
        toastStore.showToast({
          type: 'error',
          title: 'Error',
          message: 'Error loading available sequences',
        });
      } finally {
        this.isLoadingSequences = false;
      }
    },

    // Create a new shortcut
    addShortcut(shortcut) {
      const newShortcut = {
        id: Date.now().toString(),
        phrase: shortcut.phrase || 'New Shortcut',
        sequencePath: shortcut.sequencePath || '',
        autoStart: shortcut.autoStart || false,
        color: shortcut.color || 'blue',
        icon: shortcut.icon || 'BoltIcon',
        ...shortcut,
      };
      this.shortcuts.push(newShortcut);
      return newShortcut;
    },

    // Update an existing shortcut
    updateShortcut(id, updatedData) {
      const index = this.shortcuts.findIndex((s) => s.id === id);
      if (index !== -1) {
        this.shortcuts[index] = {
          ...this.shortcuts[index],
          ...updatedData,
        };
        return true;
      }
      return false;
    },

    // Delete a shortcut
    deleteShortcut(id) {
      const index = this.shortcuts.findIndex((s) => s.id === id);
      if (index !== -1) {
        this.shortcuts.splice(index, 1);
        return true;
      }
      return false;
    },

    // Execute a shortcut (load sequence and optionally start it)
    async executeShortcut(id) {
      const shortcut = this.getShortcutById(id);
      if (!shortcut) {
        console.error('Shortcut not found:', id);
        return false;
      }

      const toastStore = useToastStore();
      const sequenceStore = useSequenceStore();

      try {
        // Load the sequence
        toastStore.showToast({
          type: 'info',
          title: 'Loading',
          message: `Loading sequence: ${shortcut.phrase}`,
        });

        const loadResponse = await apiService.sequenceLoadJson(shortcut.sequencePath);

        if (!loadResponse || loadResponse.error) {
          throw new Error(loadResponse?.error || 'Error loading sequence');
        }

        toastStore.showToast({
          type: 'success',
          title: 'Success',
          message: `Sequence loaded: ${shortcut.phrase}`,
        });

        // If autoStart is enabled, start the sequence
        if (shortcut.autoStart) {
          // Wait a brief moment for the sequence to be fully loaded
          await new Promise((resolve) => setTimeout(resolve, 500));

          const startResponse = await apiService.sequenceAction('start');

          if (!startResponse || startResponse.error) {
            throw new Error('Error starting sequence');
          }

          toastStore.showToast({
            type: 'success',
            title: 'Success',
            message: `Sequence started: ${shortcut.phrase}`,
          });
        }

        return true;
      } catch (error) {
        console.error('Error executing shortcut:', error);
        toastStore.showToast({
          type: 'error',
          title: 'Error',
          message: `Error: ${error.message}`,
        });
        return false;
      }
    },

    // Clear all shortcuts
    clearAllShortcuts() {
      this.shortcuts = [];
    },
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'shortcuts-store',
        storage: localStorage,
        paths: ['shortcuts'],
      },
    ],
  },
});
