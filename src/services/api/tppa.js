import axios from 'axios';
import { DEFAULT_TIMEOUT, getUrls } from './core';

export default {
  //------------------------------------------- TPPA (PINS) ------------------------------------------
  async getTppaInfo(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}tppa/info`, { timeout });
      return response.data; // { Success, IsRunning }
    } catch (error) {
      console.error('Error fetching TPPA info:', error);
      throw error;
    }
  },

  async getTppaOptions(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}tppa/options`, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error fetching TPPA options:', error);
      throw error;
    }
  },

  async postTppaOptions(options, timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tppa/options`, options, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error posting TPPA options:', error);
      throw error;
    }
  },

  async postTppaReset(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tppa/reset`, {}, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error resetting TPPA options:', error);
      throw error;
    }
  },

  // ── 10micron Model Builder ──────────────────────────────────────────────────
};
