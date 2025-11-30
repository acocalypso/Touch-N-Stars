import axios from 'axios';
import { getActivePinia } from 'pinia';

let settingsStore;
let store;
const DEFAULT_TIMEOUT = 10000;

const initializeStore = () => {
  if (!settingsStore || !store) {
    const pinia = getActivePinia();

    if (!pinia) {
      throw new Error('Pinia store not initialized');
    }

    settingsStore = pinia._s.get('settings');
    store = pinia._s.get('store');

    if (!settingsStore || !store) {
      throw new Error('Required stores are not registered');
    }
  }
};

const getBaseUrl = () => {
  initializeStore();

  const protocol = settingsStore.backendProtocol || 'http';
  const connection = settingsStore.connection || {};
  const host = connection.ip || window.location.hostname;
  let port = connection.port || window.location.port || 80;
  const apiPort = store.apiPort;

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && Number(port) === 8080) {
    port = 5000;
  }

  return {
    base: `${protocol}://${host}:${apiPort}/v2/api`,
    api: `${protocol}://${host}:${port}/api/`,
  };
};

const getApiUrl = () => {
  const { api } = getBaseUrl();
  return api;
};

const normalizeErrorMessage = (error) => {
  if (error?.response?.data) {
    if (typeof error.response.data === 'string') {
      return error.response.data;
    }
    if (error.response.data?.message) {
      return error.response.data.message;
    }
  }

  if (error?.message) {
    return error.message;
  }

  return 'Unable to load system metrics';
};

const systemMetricsService = {
  async fetchSystemMetrics(timeout = DEFAULT_TIMEOUT) {
    try {
      const apiUrl = getApiUrl();
      const { data } = await axios.get(`${apiUrl}metrics`, { timeout });
      return data;
    } catch (error) {
      throw new Error(normalizeErrorMessage(error));
    }
  },
};

export default systemMetricsService;
