import apiService from '@/services/apiService';

/**
 * Time synchronization utility for accurate countdown calculations
 * Handles the difference between client and server time
 */
export class TimeSync {
  constructor() {
    this.serverTimeOffset = 0; // Difference between server and client time in milliseconds
    this.lastSyncTime = 0;
    this.syncInterval = 60000; // Sync every minute
  }

  /**
   * Synchronizes with server time using fetchNinaTime API
   * @returns {Promise<boolean>} Success status
   */
  async syncWithServer() {
    try {
      const clientTimeBeforeRequest = Date.now();
      const response = await apiService.fetchNinaTime();
      const clientTimeAfterRequest = Date.now();

      if (response && response.Response) {
        // Parse server time (assuming ISO string format)
        const serverTime = new Date(response.Response).getTime();

        // Estimate network delay and adjust
        const networkDelay = (clientTimeAfterRequest - clientTimeBeforeRequest) / 2;
        const adjustedClientTime = clientTimeAfterRequest - networkDelay;

        // Calculate offset: positive means server is ahead
        this.serverTimeOffset = serverTime - adjustedClientTime;
        this.lastSyncTime = Date.now();

        console.log('Time sync completed:', {
          serverTime: new Date(serverTime).toISOString(),
          clientTime: new Date(adjustedClientTime).toISOString(),
          offset: this.serverTimeOffset,
          networkDelay,
        });

        return true;
      }
    } catch (error) {
      console.error('Time sync failed:', error);
    }
    return false;
  }

  /**
   * Gets the current server time
   * @returns {number} Server timestamp in milliseconds
   */
  getServerTime() {
    return Date.now() + this.serverTimeOffset;
  }

  /**
   * Checks if sync is needed and performs it if necessary
   * @returns {Promise<void>}
   */
  async ensureSync() {
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    if (timeSinceLastSync > this.syncInterval) {
      await this.syncWithServer();
    }
  }

  /**
   * Calculates accurate countdown based on server time
   * @param {string|Date} endTime - Target end time (server time)
   * @returns {number} Remaining seconds (can be negative if expired)
   */
  calculateCountdown(endTime) {
    const endTimestamp = new Date(endTime).getTime();
    const currentServerTime = this.getServerTime();
    return Math.max(0, Math.ceil((endTimestamp - currentServerTime) / 1000));
  }

  /**
   * Calculates progress percentage based on server time
   * @param {string|Date} startTime - Start time (server time)
   * @param {string|Date} endTime - End time (server time)
   * @returns {number} Progress percentage (0-100)
   */
  calculateProgress(startTime, endTime) {
    const startTimestamp = new Date(startTime).getTime();
    const endTimestamp = new Date(endTime).getTime();
    const currentServerTime = this.getServerTime();

    const totalDuration = endTimestamp - startTimestamp;
    const elapsed = currentServerTime - startTimestamp;

    if (totalDuration <= 0) return 100;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }
}

// Create a singleton instance
export const timeSync = new TimeSync();

// Auto-sync on module load
timeSync.syncWithServer();
