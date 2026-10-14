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
    movePlan: null,
    estimate: null,
    loading: false,
    pending: false,
    error: null,
  }),

  getters: {
    mode: (state) => state.status?.mode ?? 'none',
    phase: (state) => state.status?.phase ?? 'Idle',
    active: (state) => state.status?.active === true,
    autoRunning: (state) => state.status?.mode === 'auto' && state.status?.active === true,
    manualActive: (state) => state.status?.mode === 'manual' && state.status?.active === true,
    moving: (state) =>
      state.status?.active === true && ['Slewing', 'Moving'].includes(state.status?.phase),
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

    async saveSettings(settings) {
      this.settings = await this.run(() => api.saveSettings(settings));
    },

    async planAuto(request) {
      this.autoPlan = null;
      this.autoPlan = await this.run(() => api.planAuto(request));
      return this.autoPlan;
    },

    async startAuto(acknowledgePointingModel) {
      const planId = this.autoPlan?.planId;
      this.autoPlan = null;
      this.status = await this.run(() => api.startAuto(planId, acknowledgePointingModel));
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

    async restore() {
      this.status = await this.run(() => api.restore());
      await this.loadPreconditions();
    },

    async manualBegin() {
      this.estimate = null;
      this.movePlan = null;
      this.status = await this.run(() => api.manualBegin());
    },

    async manualCapture() {
      this.estimate = null;
      this.movePlan = null;
      this.status = await this.run(() => api.manualCapture());
    },

    async manualPlanMove(side) {
      this.movePlan = null;
      this.movePlan = await this.run(() => api.manualPlanMove(side));
      return this.movePlan;
    },

    async manualMove() {
      const planId = this.movePlan?.planId;
      this.movePlan = null;
      this.status = await this.run(() => api.manualMove(planId));
    },

    async manualStop() {
      try {
        this.status = await api.manualStop();
      } catch (error) {
        this.status = await api.abort();
        if (!this.status) throw error;
      }
    },

    async manualRecenterDone(axisOffsetMm, landmarkDistanceMeters) {
      this.estimate = await this.run(() =>
        api.manualRecenterDone(axisOffsetMm, landmarkDistanceMeters)
      );
      return this.estimate;
    },

    async manualEnd() {
      this.movePlan = null;
      this.status = await this.run(() => api.manualEnd());
      await this.loadPreconditions();
    },
  },
});
