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

    messageFilters: [
      // Nachrichten die ANGEZEIGT werden sollen (Whitelist)
      'guide star',
      'Platesolve failed',
      'Timed-out waiting for guider to settle',
      'PHDError:',
    ],

    // Regeln zum Ändern von Level und Text bestimmter Log-Einträge
    logTransformRules: [
      {
        condition: (log) =>
          log.level === 'ERROR' &&
          log.message.includes('error:timed-out waiting for guider to settle'),
        transform: (log) => ({ ...log, level: 'WARNING', message: log.message }),
      },
      {
        condition: (log) => log.level === 'INFO' && log.message.includes('Platesolve failed'),
        transform: (log) => ({ ...log, level: 'WARNING', message: log.message }),
      },
      {
        condition: (log) => log.message.includes('error:timed-out waiting for guider to settle'),
        transform: (log) => ({ ...log, message: 'Timed-out waiting for guider to settle' }),
      },
    ],
  }),

  actions: {
    async fetchLogInfos() {
      try {
        const store = apiStore();

        if (!store.isBackendReachable) {
          console.warn('Backend is not reachable log');
          return;
        }

        // Logs vom Backend holen (z.B. die letzten 50)
        const logs = await apiService.getLastLogs('50');
        this.LogsInfo.logs = logs;

        // Prüfe auf neue ERROR/WARNING Meldungen
        this.checkForNewErrorWarnings(logs);
        //console.log('Alle Logs:', this.LogsInfo);
      } catch (error) {
        console.error('Error fetching information:', error);
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

    // Transformiert Log-Einträge basierend auf den definierten Regeln
    transformLog(log) {
      let transformedLog = { ...log };

      for (const rule of this.logTransformRules) {
        if (rule.condition(transformedLog)) {
          transformedLog = rule.transform(transformedLog);
        }
      }

      return transformedLog;
    },

    isMessageAllowed(message) {
      // Wenn keine Filter definiert sind, alle Nachrichten erlauben
      if (this.messageFilters.length === 0) {
        return true;
      }

      // Prüfen ob die Nachricht einen der erlaubten Filter enthält
      return this.messageFilters.some((filter) =>
        message.toLowerCase().includes(filter.toLowerCase())
      );
    },

    checkForNewErrorWarnings(logs) {
      if (!logs || !Array.isArray(logs)) return;

      // Filtere ERROR und WARNING Nachrichten (OHNE Transformation der ursprünglichen Logs)
      const errorWarningLogs = logs.filter(
        (log) => log.level === 'ERROR' || log.level === 'WARNING' || log.level === 'INFO'
      );

      // Filtere nur Meldungen der letzten 10 Minuten
      const recentLogs = errorWarningLogs.filter((log) => this.isWithinTenMinutes(log.timestamp));

      // Erlaube nur Nachrichten, die in den Message-Filtern enthalten sind
      const allowedLogs = recentLogs.filter((log) => this.isMessageAllowed(log.message));

      // Sortiere nach Timestamp (neueste zuerst)
      allowedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Finde neue Meldungen seit dem letzten gespeicherten Timestamp
      const newLogs = allowedLogs.filter(
        (log) => new Date(log.timestamp) > new Date(this.lastErrorWarningTimestamp)
      );

      // Zeige neue Meldungen in ToastModal an
      if (newLogs.length > 0) {
        const toastStore = useToastStore();

        // Zeige die neueste Meldung
        const latestLog = newLogs[0];

        // Transformiere nur für die Anzeige (nicht die ursprünglichen Logs)
        const displayLog = this.transformLog(latestLog);

        const type =
          displayLog.level === 'ERROR'
            ? 'error'
            : displayLog.level === 'WARNING'
              ? 'warning'
              : 'info';
        const formattedTime = this.formatTimestamp(latestLog.timestamp);

        toastStore.showToast({
          type: type,
          title: `${displayLog.level}: ${formattedTime}`,
          message: displayLog.message,
          autoClose: displayLog.level === 'ERROR' ? false : true,
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
