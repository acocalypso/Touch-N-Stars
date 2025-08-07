import axios from 'axios';
import { useTelescopisStore } from '../store/telescopiusStore';

const TELESCOPIUS_BASE_URL = 'https://api.telescopius.com/v1.0';
const DEFAULT_TIMEOUT = 10000;

class TelescopiusApiService {
  constructor() {
    this.telescopiusStore = null;
  }

  getStore() {
    if (!this.telescopiusStore) {
      this.telescopiusStore = useTelescopisStore();
    }
    return this.telescopiusStore;
  }

  getHeaders() {
    const store = this.getStore();
    if (!store.hasApiKey) {
      throw new Error('Telescopius API Key is required');
    }
    
    return {
      'Authorization': `Key ${store.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async makeRequest(endpoint, params = {}) {
    try {
      const response = await axios.get(`${TELESCOPIUS_BASE_URL}${endpoint}`, {
        headers: this.getHeaders(),
        params,
        timeout: DEFAULT_TIMEOUT
      });
      return response.data;
    } catch (error) {
      console.error(`Telescopius API Error (${endpoint}):`, error);
      throw this.handleApiError(error);
    }
  }

  handleApiError(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      
      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${message}`);
        case 401:
          throw new Error('Unauthorized: Check your API key');
        case 429:
          throw new Error('Too Many Requests: Rate limit exceeded');
        default:
          throw new Error(`API Error (${status}): ${message}`);
      }
    } else if (error.request) {
      throw new Error('Network error: Could not reach Telescopius API');
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }

  // Quote of the Day
  async getQuoteOfTheDay() {
    return this.makeRequest('/quote-of-the-day');
  }

  // Target Search
  async searchTargets(searchParams = {}) {
    const params = {
      types: 'DEEP_SKY_OBJECT',
      results_per_page: 10,
      page: 1,
      order: 'mag',
      order_asc: true,
      ...searchParams
    };
    
    return this.makeRequest('/targets/search', params);
  }

  // Target Highlights
  async getTargetHighlights(params = {}) {
    const defaultParams = {
      types: 'DEEP_SKY_OBJECT',
      ...params
    };
    
    return this.makeRequest('/targets/highlights', defaultParams);
  }

  // User Lists
  async getUserLists() {
    return this.makeRequest('/targets/lists');
  }

  async getTargetList(listId, params = {}) {
    return this.makeRequest(`/targets/lists/${listId}`, params);
  }

  // Solar System Times
  async getSolarSystemTimes(params = {}) {
    return this.makeRequest('/solar-system/times', params);
  }

  // Advanced Target Search with common parameters
  async searchNearbyTargets(ra, dec, radius = 5, params = {}) {
    return this.searchTargets({
      center_ra: ra,
      center_dec: dec,
      dist_max: radius,
      ...params
    });
  }

  async searchByConstellation(constellation, params = {}) {
    return this.searchTargets({
      con: constellation,
      ...params
    });
  }

  async searchByMagnitude(minMag, maxMag, params = {}) {
    return this.searchTargets({
      mag_min: minMag,
      mag_max: maxMag,
      ...params
    });
  }

  async searchVisibleNow(lat, lon, timezone = 'UTC', params = {}) {
    const now = new Date();
    const datetime = now.toISOString().slice(0, 19).replace('T', ' ');
    
    return this.searchTargets({
      lat,
      lon,
      timezone,
      datetime,
      min_alt: 20, // Minimum 20° altitude
      ...params
    });
  }

  // Get target details with ephemeris
  async getTargetEphemeris(targetName, ephemerisType = 'daily', params = {}) {
    return this.searchTargets({
      name: targetName,
      name_exact: true,
      ephemeris: ephemerisType,
      ...params
    });
  }
}

export default new TelescopiusApiService();