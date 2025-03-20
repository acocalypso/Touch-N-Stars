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
    sequenceIsEditable: true,
    lastImage: {
      index: 0,
      quality: 0,
      resize: false,
      scale: 0,
      image: null,
    },
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

    async getSequenceInfoState() {
      try {
        return await apiService.sequenceAction('state');
      } catch (error) {
        console.error('Error fetching sequence info state:', error);
      }
    },

    async getSequenceInfoJson() {
      try {
        return await apiService.sequenceAction('json');
      } catch (error) {
        console.error('Error fetching sequence info json:', error);
      }
    },

    async getSequenceInfo() {
      let response = null;

      if (this.sequenceIsEditable) {
        //console.log('Abfrage state');
        response = await this.getSequenceInfoState();
        if (response?.StatusCode === 500) {
          console.log('nicht editierbar');
          this.sequenceIsEditable = false;
          response = await this.getSequenceInfoJson();
        }
      } else {
        //console.log('Abfrage json');
        response = await this.getSequenceInfoJson();
      }

      if (response?.Success) {
        this.sequenceInfo = response.Response;
        if (this.sequenceIsEditable) {
          this.generatePaths(this.sequenceInfo);
        }
        this.sequenceIsLoaded = true;

        // Check if any sequence is running by searching for RUNNING status
        const isRunning = response.Response?.some((sequence) =>
          sequence.Items?.some((item) => item.Status === 'RUNNING')
        );
        this.sequenceRunning = isRunning || false;
      } else {
        this.sequenceIsLoaded = false;
        this.sequenceRunning = false;
      }
    },

    generatePaths(sequenceData) {
      sequenceData.forEach((container, index) => {
        let pathPart = '';

        // Setze pathPart je nach Index
        if (index === 0) {
          pathPart = 'Global';
        } else if (index === 1) {
          pathPart = 'Start';
        } else if (index === 2) {
          pathPart = 'Imaging';
        } else if (index === 3) {
          pathPart = 'End';
        } else {
          pathPart = `Custom-${index}`;
        }

        // Setze den _path für das Container-Objekt
        container._path = pathPart;

        // Falls der Container GlobalTriggers hat, ebenfalls Pfade generieren
        if (container.GlobalTriggers) {
          container.GlobalTriggers.forEach((trigger, tIndex) => {
            const triggerPath = `${pathPart}-GlobalTriggers-${tIndex}`;
            trigger._path = triggerPath;
          });
        }

        // Falls der Container Items hat, rekursiv bearbeiten
        if (container.Items) {
          this.generateItemPaths(container.Items, pathPart);
        }

        // Falls der Container Triggers hat, rekursiv bearbeiten
        if (container.Triggers) {
          this.generateTriggerPaths(container.Triggers, pathPart);
        }

        // Falls der Container Conditions hat, rekursiv bearbeiten
        if (container.Conditions) {
          this.generateConditionsPaths(container.Conditions, pathPart);
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
        if (item.Conditions) {
          this.generateConditionsPaths(item.Conditions, itemPath);
        }
      });
    },

    generateTriggerPaths(triggers, parentPath) {
      triggers.forEach((trigger, idx) => {
        const triggerPath = `${parentPath}-Triggers-${idx}`;
        trigger._path = triggerPath;
      });
    },

    generateConditionsPaths(conditions, parentPath) {
      conditions.forEach((condition, idx) => {
        const conditionPath = `${parentPath}-Conditions-${idx}`;
        condition._path = conditionPath;
      });
    },

    startFetching() {
      if (!this.intervalId) {
        this.intervalId = setInterval(this.getSequenceInfo, 2000);
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
