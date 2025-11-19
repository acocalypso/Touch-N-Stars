import { defineStore } from 'pinia';

export const useAutofocusStore = defineStore('autofocus', {
  state: () => ({
    isRunning: false,
    points: [],
    lastStartTime: null,
    isFinished: false,
  }),

  actions: {
    processAutofocusEvents(events) {
      // Reset state before processing
      this.isRunning = false;
      this.points = [];
      this.lastStartTime = null;
      this.isFinished = false;

      if (!events || events.length === 0) {
        //console.log('[Autofocus] No events to process');
        return;
      }

      // Find the latest AUTOFOCUS-STARTING event (in reverse chronological order)
      let latestStartingIndex = -1;
      for (let i = 0; i < events.length; i++) {
        if (events[i].Event === 'AUTOFOCUS-STARTING') {
          latestStartingIndex = i;
          break;
        }
      }

      // If no AUTOFOCUS-STARTING found, nothing to process
      if (latestStartingIndex === -1) {
        //console.log('[Autofocus] No AUTOFOCUS-STARTING event found');
        return;
      }

      const startEvent = events[latestStartingIndex];
      this.lastStartTime = startEvent.Time;
      this.isRunning = true;
      //console.log('[Autofocus] Found AUTOFOCUS-STARTING at', startEvent.Time);

      // Check for AUTOFOCUS-FINISHED after the AUTOFOCUS-STARTING
      for (let i = latestStartingIndex - 1; i >= 0; i--) {
        if (events[i].Event === 'AUTOFOCUS-FINISHED') {
          this.isFinished = true;
          this.isRunning = false;
          //console.log('[Autofocus] Found AUTOFOCUS-FINISHED at', events[i].Time);
          break;
        }
      }

      // Collect all AUTOFOCUS-POINT-ADDED events that come after AUTOFOCUS-STARTING
      for (let i = latestStartingIndex - 1; i >= 0; i--) {
        if (events[i].Event === 'AUTOFOCUS-POINT-ADDED') {
          this.points.unshift(events[i]);
        }
      }
      console.log('[Autofocus] Processed', this.points.length, 'focus points');
      console.log('[Autofocus] State:', {
        isRunning: this.isRunning,
        isFinished: this.isFinished,
        pointsCount: this.points.length,
        lastStartTime: this.lastStartTime,
      });
    },

    clearAutofocusData() {
      this.isRunning = false;
      this.points = [];
      this.lastStartTime = null;
      this.isFinished = false;
    },
  },
});
