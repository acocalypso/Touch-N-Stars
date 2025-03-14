import { defineStore } from 'pinia';
import apiService from '@/services/apiService';

export const useSequenceStore = defineStore('sequenceStore', {
  state: () => ({
    intervalId: null,
    sequenceInfo: [],
    collapsedStates: {},
    sequenceIsLoaded: false,
    sequenceRunning: false,
    sequenceEdit: false,
  }),
  actions: {
    setSequenceRunning(isRunning) {
      this.sequenceRunning = isRunning;
    },
    toggleCollapsedState(containerName) {
      this.collapsedStates = {
        ...this.collapsedStates,
        [containerName]: !this.collapsedStates[containerName],
      };
    },

    isCollapsed(containerName) {
      return !!this.collapsedStates[containerName];
    },

    async getSequenceInfo() {
      try {
        const response = await apiService.sequenceAction('state');
        if (response.Success) {
          this.sequenceInfo = response.Response;
          this.generatePaths(this.sequenceInfo);
          this.sequenceIsLoaded = true;
          // Check if sequence is running
          // Check if any sequence is running by searching for RUNNING status
          const isRunning = response.Response?.some((sequence) =>
            sequence.Items?.some((item) => item.Status === 'RUNNING')
          );
          this.sequenceRunning = isRunning || false;
        } else {
          this.sequenceIsLoaded = false;
          this.sequenceRunning = false;
        }
      } catch (error) {
        console.error('Error fetching guider info:', error);
      }
    },

    generatePaths(sequenceData, currentPath = '') {
      sequenceData.forEach((container) => {
        //Mit Imaging starten
        const pathPart = 'Imaging';

        // Pfad zusammensetzen
        const containerPath = currentPath ? `${currentPath}-${pathPart}` : pathPart;

        // Dem Container das _path-Feld geben
        container._path = containerPath;

        // Falls GlobalTriggers existieren, ebenfalls Pfade generieren
        if (container.GlobalTriggers) {
          container.GlobalTriggers.forEach((trigger, tIndex) => {
            const triggerPath = `${containerPath}-GlobalTriggers-${tIndex}`;
            trigger._path = triggerPath;
          });
        }

        // Falls der Container Items hat, rekursiv bearbeiten
        if (container.Items) {
          this.generateItemPaths(container.Items, containerPath);
        }

        // Falls der Container Triggers hat, rekursiv bearbeiten
        if (container.Triggers) {
          this.generateTriggerPaths(container.Triggers, containerPath);
        }
      });
    },

    generateItemPaths(items, parentPath) {
      items.forEach((item, idx) => {
        const itemPath = `${parentPath}-Items-${idx}`;
        item._path = itemPath;
        if (item.Items) {
          this.generateItemPaths(item.Items, itemPath);
        }
        if (item.Triggers) {
          this.generateTriggerPaths(item.Triggers, itemPath);
        }
      });
    },

    generateTriggerPaths(triggers, parentPath) {
      triggers.forEach((trigger, idx) => {
        const triggerPath = `${parentPath}-Triggers-${idx}`;
        trigger._path = triggerPath;
      });
    },

    startFetching() {
      if (!this.intervalId) {
        this.intervalId = setInterval(this.getSequenceInfo, 1000);
      }
    },

    stopFetching() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
  },
});
