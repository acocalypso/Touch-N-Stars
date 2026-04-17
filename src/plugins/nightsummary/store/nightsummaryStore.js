import { defineStore } from 'pinia';
import apiService from '@/services/apiService';

export const useNightSummaryStore = defineStore('nightsummary', {
  state: () => ({
    pluginInstalled: null,

    // Settings
    settings: null,
    settingsLoading: false,
    settingsSaving: false,
    settingsError: null,
    filterNames: [],

    // Test notification statuses: { ok: bool, message: string } | null
    emailTestStatus: null,
    discordTestStatus: null,
    pushoverTestStatus: null,
    emailTesting: false,
    discordTesting: false,
    pushoverTesting: false,

    // Sessions
    sessions: [],
    selectedSessionId: null,
    sessionDetail: null,
    loadingSessions: false,
    loadingDetail: false,
    resendingSession: false,
    resendStatus: null,
    error: null,
    deleteError: null,
  }),

  getters: {
    selectedSession: (state) =>
      state.sessions.find((s) => s.SessionId === state.selectedSessionId) ?? null,
  },

  actions: {
    async initialize() {
      await this.checkPluginStatus();
      if (this.pluginInstalled) {
        await Promise.all([this.fetchSettings(), this.fetchSessions()]);
      }
    },

    async checkPluginStatus() {
      try {
        const res = await apiService.nightsummary.getStatus();
        this.pluginInstalled = res?.Response?.Installed === true;
      } catch {
        this.pluginInstalled = false;
      }
    },

    // ── Settings ──────────────────────────────────────────────────────────────

    async fetchSettings() {
      this.settingsLoading = true;
      this.settingsError = null;
      try {
        const res = await apiService.nightsummary.getSettings();
        if (res?.Success) {
          const { _filterNames, ...rest } = res.Response;
          // Migrate any legacy full-word FilterClassifications values to short codes (B/N/X)
          if (rest.FilterClassifications) {
            const legacyMap = { broadband: 'B', narrowband: 'N', exclude: 'X' };
            const pairs = rest.FilterClassifications.split(',').map((p) => {
              const idx = p.indexOf('=');
              if (idx < 0) return p;
              const k = p.substring(0, idx).trim();
              const v = p.substring(idx + 1).trim();
              const migrated = legacyMap[v.toLowerCase()];
              return migrated ? `${k}=${migrated}` : p;
            });
            const migrated = pairs.join(',');
            if (migrated !== rest.FilterClassifications) {
              rest.FilterClassifications = migrated;
              // Save corrected value back to plugin settings
              apiService.nightsummary
                .updateSettings({ FilterClassifications: migrated })
                .catch(() => {});
            }
          }
          this.settings = rest;
          this.filterNames = _filterNames ?? [];
        } else {
          this.settingsError = res?.Error ?? 'Failed to load settings';
        }
      } catch (err) {
        this.settingsError = err.message;
      } finally {
        this.settingsLoading = false;
      }
    },

    async saveSetting(key, value) {
      if (!this.settings) return;
      // Optimistic update
      this.settings[key] = value;
      this.settingsSaving = true;
      try {
        await apiService.nightsummary.updateSettings({ [key]: value });
      } catch (err) {
        this.settingsError = err.message;
      } finally {
        this.settingsSaving = false;
      }
    },

    async saveSettings(patch) {
      if (!this.settings) return;
      Object.assign(this.settings, patch);
      this.settingsSaving = true;
      this.settingsError = null;
      try {
        await apiService.nightsummary.updateSettings(patch);
      } catch (err) {
        this.settingsError = err.message;
      } finally {
        this.settingsSaving = false;
      }
    },

    // ── Test notifications ────────────────────────────────────────────────────

    async testEmail() {
      this.emailTesting = true;
      this.emailTestStatus = null;
      try {
        const res = await apiService.nightsummary.testEmail();
        this.emailTestStatus = res?.Response ?? { Ok: false, Message: 'No response' };
      } catch (err) {
        this.emailTestStatus = { Ok: false, Message: err.message };
      } finally {
        this.emailTesting = false;
      }
    },

    async testDiscord() {
      this.discordTesting = true;
      this.discordTestStatus = null;
      try {
        const res = await apiService.nightsummary.testDiscord();
        this.discordTestStatus = res?.Response ?? { Ok: false, Message: 'No response' };
      } catch (err) {
        this.discordTestStatus = { Ok: false, Message: err.message };
      } finally {
        this.discordTesting = false;
      }
    },

    async testPushover() {
      this.pushoverTesting = true;
      this.pushoverTestStatus = null;
      try {
        const res = await apiService.nightsummary.testPushover();
        this.pushoverTestStatus = res?.Response ?? { Ok: false, Message: 'No response' };
      } catch (err) {
        this.pushoverTestStatus = { Ok: false, Message: err.message };
      } finally {
        this.pushoverTesting = false;
      }
    },

    // ── Sessions ──────────────────────────────────────────────────────────────

    async fetchSessions(limit = 100) {
      this.loadingSessions = true;
      this.error = null;
      try {
        const res = await apiService.nightsummary.getSessions(limit);
        if (res?.Success) {
          this.sessions = res.Response ?? [];
        } else {
          this.error = res?.Error ?? 'Failed to load sessions';
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loadingSessions = false;
      }
    },

    async selectSession(sessionId) {
      if (this.selectedSessionId === sessionId && this.sessionDetail) return;
      this.selectedSessionId = sessionId;
      this.sessionDetail = null;
      await this.fetchSessionDetail(sessionId);
    },

    async fetchSessionDetail(sessionId) {
      this.loadingDetail = true;
      this.error = null;
      try {
        const res = await apiService.nightsummary.getSession(sessionId);
        if (res?.Success) {
          this.sessionDetail = res.Response;
        } else {
          this.error = res?.Error ?? 'Failed to load session detail';
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loadingDetail = false;
      }
    },

    async resendSession(sessionId) {
      this.resendingSession = true;
      this.resendStatus = null;
      try {
        const res = await apiService.nightsummary.resendSession(sessionId);
        this.resendStatus = res?.Success
          ? { ok: true, message: 'Report sent' }
          : { ok: false, message: res?.Error ?? 'Failed' };
      } catch (err) {
        this.resendStatus = { ok: false, message: err.message };
      } finally {
        this.resendingSession = false;
      }
    },

    async deleteSession(sessionId) {
      this.deleteError = null;
      try {
        const res = await apiService.nightsummary.deleteSession(sessionId);
        if (res?.Success) {
          this.sessions = this.sessions.filter((s) => s.SessionId !== sessionId);
          if (this.selectedSessionId === sessionId) {
            this.selectedSessionId = null;
            this.sessionDetail = null;
          }
          return true;
        } else {
          this.deleteError = res?.Error ?? 'Delete failed';
          return false;
        }
      } catch (err) {
        this.deleteError = err.message;
        return false;
      }
    },
  },
});
