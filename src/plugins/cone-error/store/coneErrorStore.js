import { defineStore } from 'pinia';
import api from '../api';

const FINISHED = ['Complete', 'Failed', 'Aborted'];

export const useConeErrorStore = defineStore('coneError', {
  state: () => ({
    status: null,
    preconditions: null,
    settings: null,
    results: [],
    autoPlan: null,
    loading: false,
    pending: false,
    error: null,
  }),

  getters: {
    phase: (state) => state.status?.phase ?? 'Idle',
    active: (state) => state.status?.active === true,
    finished: (state) => FINISHED.includes(state.status?.phase),
  },

  actions: {
    async run(action) {
      this.pending = true;
      this.error = null;
      try {
        return await action();
      } catch (error) {
        if (!error.cancelled) this.error = error;
        throw error;
      } finally {
        this.pending = false;
      }
    },

    async loadStatus() {
      try {
        this.status = await api.getStatus();
      } catch (error) {
        if (!error.cancelled) this.error = error;
      }
    },

    async loadAll() {
      this.loading = true;
      try {
        const [status, preconditions, settings, results] = await Promise.all([
          api.getStatus(),
          api.getPreconditions(),
          api.getSettings(),
          api.getResults(),
        ]);
        this.status = status;
        this.preconditions = preconditions;
        this.settings = settings;
        this.results = results ?? [];
        this.error = null;
      } catch (error) {
        if (!error.cancelled) this.error = error;
      } finally {
        this.loading = false;
      }
    },

    async loadPreconditions() {
      try {
        this.preconditions = await api.getPreconditions();
      } catch (error) {
        if (!error.cancelled) this.error = error;
      }
    },

    async loadResults() {
      try {
        this.results = (await api.getResults()) ?? [];
      } catch (error) {
        if (!error.cancelled) this.error = error;
      }
    },

    /** Sends only the changed fields. */
    async saveSettings(changes) {
      this.settings = await this.run(() => api.saveSettings(changes));
    },

    async planAuto(request) {
      this.autoPlan = null;
      const plan = await this.run(() => api.planAuto(request));
      // the countdown runs from the moment the plan arrived, not on the phone's clock vs the Pi's
      this.autoPlan = plan ? { ...plan, receivedAt: Date.now() } : null;
      return this.autoPlan;
    },

    async startAuto(noPointingModel) {
      const planId = this.autoPlan?.planId;
      this.autoPlan = null;
      this.status = await this.run(() => api.startAuto(planId, noPointingModel));
    },

    async answer(id, yes) {
      this.status = await this.run(() => api.answer(id, yes));
    },

    /** Never behind a confirmation: stopping the mount must be one tap. */
    async abort() {
      try {
        this.status = await api.abort();
      } catch (error) {
        // a second try: a lost request must not leave the mount moving
        this.status = await api.abort();
        if (!this.status) throw error;
      }
    },
  },
});
