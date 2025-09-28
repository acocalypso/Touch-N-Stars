import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store';
import { useToastStore } from '@/store/toastStore';

export const useLogStore = defineStore('LogStore', {
  state: () => ({
    intervalId: null,
    LogsInfo: {
      logs: [],
    },
    canSetPos: true,
    foundPos: 0,
    foundPosTime: new Date(),

    focuserData: [],
    startAfTime: '',
    lastHfrLogTime: 0,
    lastErrorWarningTimestamp:
      localStorage.getItem('lastErrorWarningTimestamp') || '1970-01-01T00:00:00.0000',
  }),

  actions: {
    async fetchLogInfos() {
      try {
        const store = apiStore();

        if (!store.isBackendReachable) {
          console.warn('Backend ist nicht erreichbar log');
          return;
        }

        // Logs vom Backend holen (z.B. die letzten 100)
        const logs = await apiService.getLastLogs('100');
        this.LogsInfo.logs = logs;

        // Prüfe auf neue ERROR/WARNING Meldungen
        this.checkForNewErrorWarnings(logs);
        //console.log('Alle Logs:', this.LogsInfo);
      } catch (error) {
        console.error('Fehler beim Abrufen der Informationen:', error);
      }
    },

    isWithinTenMinutes(timestamp) {
      const now = new Date();
      const logTime = new Date(timestamp);
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      return logTime >= tenMinutesAgo;
    },

    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    },

    checkForNewErrorWarnings(logs) {
      if (!logs || !Array.isArray(logs)) return;

      // Filtere ERROR und WARNING Nachrichten
      const errorWarningLogs = logs.filter(
        (log) => log.level === 'ERROR' || log.level === 'WARNING'
      );

      // Filtere nur Meldungen der letzten 10 Minuten
      const recentLogs = errorWarningLogs.filter((log) => this.isWithinTenMinutes(log.timestamp));

      // Sortiere nach Timestamp (neueste zuerst)
      recentLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Finde neue Meldungen seit dem letzten gespeicherten Timestamp
      const newLogs = recentLogs.filter(
        (log) => new Date(log.timestamp) > new Date(this.lastErrorWarningTimestamp)
      );

      // Zeige neue Meldungen in ToastModal an
      if (newLogs.length > 0) {
        const toastStore = useToastStore();

        // Zeige die neueste Meldung
        const latestLog = newLogs[0];
        const type = latestLog.level === 'ERROR' ? 'error' : 'warning';
        const formattedTime = this.formatTimestamp(latestLog.timestamp);

        toastStore.showToast({
          type: type,
          title: `${latestLog.level}: ${formattedTime}`,
          message: latestLog.message,
          autoClose: latestLog.level === 'ERROR' ? false : true,
          autoCloseDelay: 8000,
        });

        // Aktualisiere den letzten Timestamp
        this.lastErrorWarningTimestamp = latestLog.timestamp;
        localStorage.setItem('lastErrorWarningTimestamp', this.lastErrorWarningTimestamp);
      }
    },

    startFetchingLog() {
      if (!this.intervalId) {
        this.intervalId = setInterval(this.fetchLogInfos, 1000);
      }
    },

    stopFetchingLog() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
  },
});
