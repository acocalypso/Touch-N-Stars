import { useTelescopisStore } from '../store/telescopiusStore';
import { getActivePinia } from 'pinia';

const TELESCOPIUS_BASE_URL = 'https://api.telescopius.com/v1.0';
const DEFAULT_TIMEOUT = 10000;

let settingsStore;
let store;

const initializeStore = () => {
  if (!settingsStore) {
    const pinia = getActivePinia();
    if (!pinia) {
      throw new Error('Pinia store not initialized');
    }
    settingsStore = pinia._s.get('settings');
    store = pinia._s.get('store');
  }
};

const getProxyBaseUrl = () => {
  initializeStore();
  const protocol = settingsStore.backendProtocol || 'http';
  const host = settingsStore.connection.ip || window.location.hostname;
  let port = settingsStore.connection.port || window.location.port || 80;


  return `${protocol}://${host}:${port}/api/proxy/telescopius`;
};

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
      Accept: '*/*',
      Authorization: `Key ${store.apiKey}`,
    };
  }

  async makeRequest(endpoint, params = {}) {
    try {
      // Originale Telescopius URL für den Proxy
      const originalUrl = new URL(`${TELESCOPIUS_BASE_URL}${endpoint}`);

      // Parameter als Query-String hinzufügen
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          originalUrl.searchParams.append(key, params[key]);
        }
      });

      // Proxy URL erstellen
      const proxyUrl = `${getProxyBaseUrl()}?url=${encodeURIComponent(originalUrl.toString())}`;

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Telescopius API Error (${endpoint}):`, error);
      throw this.handleApiError(error);
    }
  }

  handleApiError(error) {
    // Fetch-Errors haben eine andere Struktur als Axios-Errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Could not reach Telescopius API (CORS issue?)');
    } else if (error.message.includes('HTTP 400')) {
      throw new Error('Bad Request: Check your request parameters');
    } else if (error.message.includes('HTTP 401')) {
      throw new Error('Unauthorized: Check your API key');
    } else if (error.message.includes('HTTP 429')) {
      throw new Error('Too Many Requests: Rate limit exceeded');
    } else if (error.message.includes('HTTP')) {
      // Andere HTTP-Errors von unserem fetch-Code
      throw new Error(error.message);
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
      ...searchParams,
    };

    return this.makeRequest('/targets/search', params);
  }

  // Target Highlights
  async getTargetHighlights(params = {}) {
    const defaultParams = {
      types: 'DEEP_SKY_OBJECT',
      ...params,
    };

    return this.makeRequest('/targets/highlights', defaultParams);
  }

  // User Lists
  async getUserLists(params = {}) {
    return this.makeRequest('/targets/lists', params);
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
      ...params,
    });
  }

  async searchByConstellation(constellation, params = {}) {
    return this.searchTargets({
      con: constellation,
      ...params,
    });
  }

  async searchByMagnitude(minMag, maxMag, params = {}) {
    return this.searchTargets({
      mag_min: minMag,
      mag_max: maxMag,
      ...params,
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
      ...params,
    });
  }

  // Get target details with ephemeris
  async getTargetEphemeris(targetName, ephemerisType = 'daily', params = {}) {
    return this.searchTargets({
      name: targetName,
      name_exact: true,
      ephemeris: ephemerisType,
      ...params,
    });
  }

  // Validate API Key - über Proxy
  async validateApiKey(apiKey) {
    try {
      const originalUrl = `${TELESCOPIUS_BASE_URL}/quote-of-the-day`;
      const proxyUrl = `${getProxyBaseUrl()}?url=${encodeURIComponent(originalUrl)}`;

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          Accept: '*/*',
          Authorization: `Key ${apiKey}`,
        },
      });

      if (!response.ok) {
        let message = 'API Key validation failed';

        switch (response.status) {
          case 401:
            message = 'Invalid API Key';
            break;
          case 429:
            message = 'API Key valid but rate limit exceeded';
            return { valid: true, message, rateLimited: true };
          case 400:
            message = 'Bad request - check API Key format';
            break;
          default:
            message = `API Error (${response.status}): ${response.statusText}`;
        }

        return {
          valid: false,
          message,
          error: response.status,
        };
      }

      const data = await response.json();

      return {
        valid: true,
        message: 'API Key is valid',
        data: data,
      };
    } catch (error) {
      console.error('Telescopius API validation error:', error);

      let message = 'API Key validation failed';

      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        message = 'Network error - could not reach Telescopius API (possibly CORS)';
      } else {
        message = error.message;
      }

      return {
        valid: false,
        message,
        error: 'NETWORK_ERROR',
      };
    }
  }
}

export default new TelescopiusApiService();
