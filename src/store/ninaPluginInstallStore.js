import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import apiPinsService from '@/services/apiPinsService';
import { getUrls } from '@/services/api/core';
import { DEFAULT_PINS_DAEMON_API_TOKEN } from '@/services/pinsConfig';
import {
  parseJobIdFromResponse,
  pollJobUntilFinished,
} from '@/components/pins/composables/pinsJobPolling';
import {
  isNinaPluginLoaded,
  isRouteMissingError,
  parseLoadedNinaPlugins,
} from '@/utils/ninaPluginRequirement';

const MAX_LOG_LINES = 500;
const RESTART_SETTLE_MS = 5000;
const RESTART_POLL_MS = 3000;
const RESTART_TIMEOUT_MS = 180000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Asks NINA which plugins it has loaded. @returns {Promise<string[]|null>} null = unknown */
export async function fetchLoadedNinaPlugins() {
  try {
    return parseLoadedNinaPlugins(await apiService.getPlugins());
  } catch {
    return null;
  }
}

/**
 * Installs the NINA plugin an app plugin needs through the PINS daemon, then restarts NINA
 * so it gets loaded. One dialog (NinaPluginInstallDialog in App.vue) renders this state,
 * whether it was opened from Settings → Plugins or from a plugin page.
 *
 * Phases: confirm → installing → restartPrompt → restarting → done,
 * with failed (retry possible) and restartUnavailable (older daemon) as exits.
 */
export const useNinaPluginInstallStore = defineStore('ninaPluginInstall', {
  state: () => ({
    show: false,
    pluginName: '',
    requirement: null,
    phase: 'confirm',
    logLines: [],
    errorMessage: '',
    // Bumped whenever a NINA plugin became available, so plugin pages re-check.
    completedCount: 0,
  }),
  getters: {
    isBusy: (state) => state.phase === 'installing' || state.phase === 'restarting',
  },
  actions: {
    open({ pluginName, requirement }) {
      if (!requirement?.pinsPackage || this.isBusy) return;
      this.pluginName = pluginName || requirement.displayName;
      this.requirement = requirement;
      this.phase = 'confirm';
      this.logLines = [];
      this.errorMessage = '';
      this.show = true;
    },

    /**
     * Opens the dialog at the right step: a package that is installed but not loaded yet
     * (e.g. the user chose "Later") only needs the NINA restart.
     */
    async offer({ pluginName, requirement }) {
      this.open({ pluginName, requirement });
      if (!this.show) return;
      try {
        const payload = await apiPinsService.getPinsPlugins();
        const entry = (payload?.plugins || []).find(
          (plugin) => plugin?.packageName === requirement.pinsPackage
        );
        if (entry?.installed && this.phase === 'confirm') this.phase = 'restartPrompt';
      } catch {
        // Unknown package state: offering the install is the safe default.
      }
    },

    close() {
      if (this.isBusy) return;
      this.show = false;
    },

    appendLog(line) {
      this.logLines.push(line);
      if (this.logLines.length > MAX_LOG_LINES) {
        this.logLines.splice(0, this.logLines.length - MAX_LOG_LINES);
      }
    },

    // The daemon only streams job output over its log socket; status comes from polling.
    streamJobLog(jobId) {
      try {
        const { PINSDAEMON_URL } = getUrls();
        const wsUrl = `${PINSDAEMON_URL.replace(/^http/, 'ws')}/logs/${jobId}?token=${DEFAULT_PINS_DAEMON_API_TOKEN}`;
        const ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          if (event.data) this.appendLog(String(event.data));
        };
        return () => ws.close();
      } catch {
        return () => {};
      }
    },

    async install() {
      if (this.isBusy || !this.requirement?.pinsPackage) return;
      const packageName = this.requirement.pinsPackage;

      this.phase = 'installing';
      this.logLines = [];
      this.errorMessage = '';

      let stopLog = () => {};
      try {
        const data = await apiPinsService.runPinsPluginAction('install', packageName);
        const jobId = parseJobIdFromResponse(data);
        if (!jobId) throw new Error('No valid jobId returned.');

        stopLog = this.streamJobLog(jobId);
        const { success, result } = await pollJobUntilFinished(jobId, {
          // Package installs run apt-get update first; give them up to 10 minutes.
          maxAttempts: 300,
          maxConsecutiveErrors: 3,
        });
        if (!success) {
          throw new Error(result?.errorMessage || result?.status || 'unknown');
        }
        this.phase = 'restartPrompt';
      } catch (error) {
        console.error('[NinaPluginInstall] install failed:', error);
        this.errorMessage =
          error?.response?.data?.detail || error?.message || String(error || 'unknown');
        this.phase = 'failed';
      } finally {
        // Let the socket deliver its last lines before closing it.
        setTimeout(stopLog, 1000);
      }
    },

    async restartNina({
      settleMs = RESTART_SETTLE_MS,
      pollMs = RESTART_POLL_MS,
      timeoutMs = RESTART_TIMEOUT_MS,
    } = {}) {
      if (this.isBusy) return;
      this.phase = 'restarting';
      this.errorMessage = '';

      try {
        await apiPinsService.restartPinsNina();
      } catch (error) {
        if (isRouteMissingError(error)) {
          this.phase = 'restartUnavailable';
          return;
        }
        console.error('[NinaPluginInstall] NINA restart failed:', error);
        this.errorMessage = error?.response?.data?.detail || error?.message || 'unknown';
        this.phase = 'restartPrompt';
        return;
      }

      // NINA drops off the network while it restarts; done once it lists the plugin again.
      await wait(settleMs);
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const loaded = await fetchLoadedNinaPlugins();
        if (isNinaPluginLoaded(loaded, this.requirement)) {
          this.phase = 'done';
          this.completedCount += 1;
          return;
        }
        await wait(pollMs);
      }
      this.phase = 'restartUnavailable';
    },
  },
});
