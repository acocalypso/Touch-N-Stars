import { defineStore } from 'pinia';
import ai from '@/services/api/phd2AI';
import { useSettingsStore } from '@/store/settingsStore';

export function aiConnectionKey() {
  const settings = useSettingsStore();
  return JSON.stringify([
    settings.backendProtocol,
    settings.connection.ip,
    settings.connection.port,
  ]);
}

export const usePhd2AIStore = defineStore('phd2AI', {
  state: () => ({
    status: null,
    library: null,
    available: null,
    busy: false,
    refreshing: false,
    error: '',
    pollError: '',
    connection: '',
    revision: 0,
  }),
  getters: {
    training: (state) => state.status?.training ?? { state: 'idle', running: false },
    models: (state) => state.library?.models ?? [],
  },
  actions: {
    reset() {
      this.revision++;
      this.status = null;
      this.library = null;
      this.available = null;
      this.error = '';
      this.pollError = '';
      this.connection = aiConnectionKey();
    },
    async refresh() {
      if (this.connection !== aiConnectionKey()) this.reset();
      if (this.refreshing || this.busy) return;
      const revision = this.revision;
      const connection = this.connection;
      this.refreshing = true;
      try {
        // Serialize to reduce work on the Pi and keep profile snapshots consistent.
        const status = await ai.status();
        const library = await ai.models();
        if (revision !== this.revision || connection !== aiConnectionKey()) return;
        if (status.profile_id !== library.profile_id) {
          this.status = null;
          this.library = null;
          return;
        }
        this.status = status;
        this.library = library;
        this.available = true;
        this.pollError = '';
      } catch (error) {
        if (revision !== this.revision || connection !== aiConnectionKey()) return;
        const code = error.response?.status;
        this.available = code === 404 || code === 501 ? false : null;
        this.pollError = error.response?.data?.Error || error.message;
        // A connection error must not leave stale Active controls or progress visible.
        this.status = null;
        this.library = null;
      } finally {
        this.refreshing = false;
      }
    },
    async run(action, ...parameters) {
      if (this.busy) return false;
      this.busy = true;
      this.revision++;
      this.error = '';
      const connection = aiConnectionKey();
      try {
        if (typeof ai[action] !== 'function') throw new Error('Unknown AI action');
        const result = await ai[action](...parameters);
        // Import only copies; select explicitly, matching native GUI behavior.
        if (action === 'import' && connection === aiConnectionKey()) await ai.select(result.path);
        return connection === aiConnectionKey();
      } catch (error) {
        if (connection === aiConnectionKey())
          this.error = error.response?.data?.Error || error.message;
        return false;
      } finally {
        this.busy = false;
        await this.refresh();
      }
    },
  },
});
