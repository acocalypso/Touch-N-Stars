import { defineStore } from 'pinia';

export const useProgressStore = defineStore('progressStore', {
  state: () => ({
    progresses: {},
  }),
  actions: {
    handleProgressMessage(message) {
      const { source, state } = message;

      if (!source) return;

      if (state === 'create' || state === 'update') {
        this.progresses[source] = {
          source: message.source,
          status: message.status,
          progressType: message.progressType,
          progress: message.progress,
          maxProgress: message.maxProgress,
          status2: message.status2,
          progressType2: message.progressType2,
          progress2: message.progress2,
          maxProgress2: message.maxProgress2,
          status3: message.status3,
          progressType3: message.progressType3,
          progress3: message.progress3,
          maxProgress3: message.maxProgress3,
          timestamp: message.timestamp,
        };
      } else if (state === 'delete') {
        delete this.progresses[source];
      }
    },

    clearAll() {
      this.progresses = {};
    },
  },
  getters: {
    getProgressBySource: (state) => (source) => state.progresses[source] || null,
    activeSources: (state) => Object.keys(state.progresses),
    hasActiveProgress: (state) => Object.keys(state.progresses).length > 0,
    allProgresses: (state) => Object.values(state.progresses),
  },
});
