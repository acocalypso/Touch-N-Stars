import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import notificationService from '@/services/notificationService';
import { apiStore } from './store';

export const useSequenceStore = defineStore('sequenceStore', {
  state: () => ({
    intervalId: null,
    firstLoad: true,
    sequenceInfo: [],
    collapsedStates: {},
    sequenceIsLoaded: false,
    sequenceRunning: false,
    sequenceEdit: false,
    sequenceIsEditable: true,
    targetName: '',
    runningItems: [],
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
      // Check if the sequence state has changed
      if (this.sequenceRunning !== isRunning) {
        // If the sequence is now running and it wasn't before, it has started
        if (isRunning && !this.sequenceRunning) {
          notificationService.sendSequenceNotification('started');
        }
        // If the sequence is no longer running and it was before, it has completed
        else if (!isRunning && this.sequenceRunning) {
          notificationService.sendSequenceNotification('completed');
        }
      }

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

    setCollapsedState(path, isCollapsed) {
      this.collapsedStates = {
        ...this.collapsedStates,
        [path]: isCollapsed,
      };
    },
    toggleCollapsedState(path) {
      this.collapsedStates[path] = !this.collapsedStates[path];
    },
    isCollapsed(path) {
      return !!this.collapsedStates[path];
    },
    initializeCollapsedStates(items) {
      if (!items) return;
      items.forEach((item) => {
        if (item && item._path && this.collapsedStates[item._path] === undefined) {
          this.collapsedStates[item._path] = false;
        }
        if (item.Items) {
          this.initializeCollapsedStates(item.Items);
        }
      });
    },

    async getSequenceInfoState() {
      try {
        return await apiService.sequenceAction('state');
      } catch (error) {
        this.sequenceIsEditable = false;
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

    countKeysDeep(obj) {
      let count = 0;
      function recurse(current) {
        if (typeof current === 'object' && current !== null) {
          for (const key in current) {
            if (Object.prototype.hasOwnProperty.call(current, key)) {
              count++;
              recurse(current[key]);
            }
          }
        }
      }
      recurse(obj);
      return count;
    },

    checkForSpecialNamesRecursive(items) {
      if (!items || !Array.isArray(items)) return false;

      for (const item of items) {
        const name = typeof item?.Name === 'string' ? item.Name : '';

        if (name.includes('Target Scheduler') || name.includes('+_Container')) {
          return true;
        }

        // rekursiv in verschachtelten Items weitersuchen
        if (item.Items && this.checkForSpecialNamesRecursive(item.Items)) {
          return true;
        }
      }
      return false;
    },

    async getSequenceInfo() {
      let response = null;
      let foundUnsupportedPlugins = false;
      const store = apiStore();

      if (!store.isBackendReachable) return;

      if (this.firstLoad) {
        response = await this.getSequenceInfoJson();
        if (Array.isArray(response?.Response)) {
          foundUnsupportedPlugins = response.Response?.some((response) =>
            this.checkForSpecialNamesRecursive(response.Items)
          );
        }

        if (foundUnsupportedPlugins) {
          this.sequenceIsEditable = false;
          console.log('Found unsupported plugins');
        }
        this.firstLoad = false;
      }

      if (this.sequenceIsEditable) {
        //console.log('Abfrage state');
        response = await this.getSequenceInfoState();
        const keysCount = this.countKeysDeep(response);

        //console.log(response);
        if (response?.StatusCode === 500 || !response?.StatusCode || keysCount > 4000) {
          // begrenzen auf 4000 keys damit es nicht zu lange dauert
          console.log('nicht editierbar');
          this.sequenceIsEditable = false;
          response = await this.getSequenceInfoJson();
        }
      } else {
        //console.log('Abfrage json');
        response = await this.getSequenceInfoJson();
      }

      if (response?.Success) {
        // Check for errors in sequence items
        let hasErrors = false;
        let errorMessage = '';

        if (Array.isArray(response.Response)) {
          for (const container of response.Response) {
            if (container.Items) {
              for (const item of container.Items) {
                if (item.Status === 'ERROR') {
                  hasErrors = true;
                  errorMessage = item.ErrorMessage || 'Unknown error in sequence';
                  break;
                }
              }
              if (hasErrors) break;
            }
          }
        }

        if (hasErrors) {
          notificationService.sendSequenceNotification('error', errorMessage);
        }

        this.sequenceInfo = response.Response;

        // TargetName auslesen, wenn vorhanden
        for (const container of this.sequenceInfo) {
          if (container?.Items) {
            this.findAndSetTargetName(container.Items);
            if (this.targetName) break; // Bei erstem Treffer abbrechen
          }
        }

        if (this.sequenceIsEditable) {
          this.generatePaths(this.sequenceInfo);
        }
        this.sequenceIsLoaded = true;

        // Check if any sequence is running by searching for RUNNING status
        const isRunning = response.Response?.some((sequence) =>
          sequence.Items?.some((item) => item.Status === 'RUNNING')
        );

        // Collect all running items with their names - always use JSON data for this
        this.runningItems = [];
        const jsonResponse = await this.getSequenceInfoJson();
        if (jsonResponse?.Success) {
          this.collectRunningItems(jsonResponse.Response);
        }

        // Update sequence running state (this will trigger notification if state changed)
        this.setSequenceRunning(isRunning || false);
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

    async getImageByIndex(index, quality, scale) {
      let image = null;

      if (
        this.lastImage.image &&
        index === this.lastImage.index &&
        quality <= this.lastImage.quality &&
        scale <= this.lastImage.scale
      ) {
        console.log('aus cache');
        console.log(this.lastImage.image);
        image = this.lastImage.image;
        return image;
      }
      try {
        const result = await apiService.getSequenceImage(index, quality, true, scale);
        if (result.status != 200) {
          console.error('Unknown error: Check NINA Logs for more information');
          return;
        }
        const blob = result.data;
        const imageUrl = URL.createObjectURL(blob);
        return imageUrl;
      } catch (error) {
        console.error(`An error happened while getting image with index ${index}`, error.message);
        return;
      }
    },

    async getThumbnailByIndex(index) {
      try {
        const blob = await apiService.getSequenceThumbnail(index);
        const imageUrl = URL.createObjectURL(blob);
        return imageUrl;
      } catch (error) {
        console.error(`An error happened while getting image with index ${index}`, error.message);
        return null;
      }
    },

    collectRunningItems(containers) {
      if (!containers || !Array.isArray(containers)) return;

      containers.forEach((container) => {
        if (container.Items) {
          this.findRunningItemsRecursive(container.Items, [container]);
        }
      });
    },

    findRunningItemsRecursive(items, containerHierarchy = []) {
      if (!items || !Array.isArray(items)) return;

      items.forEach((item) => {
        // Wenn Item RUNNING ist und verschachtelte Items hat, nur tiefer suchen
        if (item.Status === 'RUNNING' && item.Items && item.Items.length > 0) {
          // Aktuelles Item zur Hierarchie hinzufügen, falls es ein Container ist
          const newHierarchy = item.Name ? [...containerHierarchy, item] : containerHierarchy;
          this.findRunningItemsRecursive(item.Items, newHierarchy);
        }
        // Wenn Item RUNNING ist aber keine verschachtelten Items hat, hinzufügen
        else if (
          item.Status === 'RUNNING' &&
          item.Name &&
          (!item.Items || item.Items.length === 0)
        ) {
          let itemName = item.Name;

          // Erst prüfen, ob das Item selbst Iterations hat
          if (item.Iterations !== undefined && item.CompletedIterations !== undefined) {
            itemName = `${item.Name} ${item.CompletedIterations}/${item.Iterations}`;
          }
          // Sonst in der gesamten Container-Hierarchie nach Iteration-Information suchen
          else {
            const iterationInfo = this.findIterationInfoInHierarchy(containerHierarchy);
            if (iterationInfo) {
              itemName = `${item.Name} ${iterationInfo.completed}/${iterationInfo.total}`;
            }
          }

          this.runningItems.push(itemName);
        }
        // Wenn Item nicht RUNNING ist, trotzdem tiefer suchen
        else if (item.Items && item.Items.length > 0) {
          // Aktuelles Item zur Hierarchie hinzufügen, falls es ein Container ist
          const newHierarchy = item.Name ? [...containerHierarchy, item] : containerHierarchy;
          this.findRunningItemsRecursive(item.Items, newHierarchy);
        }
      });
    },

    findIterationInfoInHierarchy(containerHierarchy) {
      // Von der äußersten zur innersten Ebene suchen
      for (let i = containerHierarchy.length - 1; i >= 0; i--) {
        const container = containerHierarchy[i];
        const iterationInfo = this.findIterationInfoInConditions(container.Conditions);
        if (iterationInfo) {
          return iterationInfo;
        }
      }
      return null;
    },

    findIterationInfoInConditions(conditions) {
      if (!conditions || !Array.isArray(conditions)) return null;

      for (const condition of conditions) {
        if (condition.Iterations !== undefined && condition.CompletedIterations !== undefined) {
          return {
            completed: condition.CompletedIterations,
            total: condition.Iterations,
          };
        }
      }
      return null;
    },

    findAndSetTargetName(items) {
      if (!items || !Array.isArray(items)) return;
      this.targetName = '';

      for (const item of items) {
        // Wenn das Item läuft und ein Target hat, speichern
        if (item?.Status === 'RUNNING' && item?.Target?.TargetName) {
          this.targetName = item.Target.TargetName;
          console.log('Aktives Target (RUNNING):', this.targetName);
          return; // ersten aktiven Treffer nehmen
        }
      }
    },

    startFetching() {
      this.stopFetching(); // Stop any existing interval before starting a new one
      this.getSequenceInfo(); // Fetch immediately
      // Start the interval to fetch every 5 seconds
      if (!this.intervalId) {
        this.intervalId = setInterval(this.getSequenceInfo, 5000);
      }
    },

    stopFetching() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    // Reset the sequence and send notification
    async resetSequence() {
      try {
        await apiService.sequenceAction('reset');
        notificationService.sendSequenceNotification('reset');
        return true;
      } catch (error) {
        console.error('Error resetting sequence:', error);
        return false;
      }
    },

    async fetchAvailableSequences() {
      try {
        const response = await apiService.sequenceAction('list-available');
        console.log('Available sequences:', response.Response);
        return response;
      } catch (error) {
        console.error('Error fetching available sequences:', error);
        throw error;
      }
    },
  },
});
