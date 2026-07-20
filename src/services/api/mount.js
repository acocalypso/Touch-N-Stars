import axios from 'axios';
import { getUrls, simpleGetRequest, simplePostRequest } from './core';

export default {
  //-------------------------------------  Mount ---------------------------------------
  mountAction(action) {
    const { BASE_URL } = getUrls();
    return simpleGetRequest(`${BASE_URL}/equipment/mount/${action}`);
  },

  mountCancelConnect() {
    const { BASE_URL } = getUrls();
    return simplePostRequest(`${BASE_URL}/equipment/mount/cancel-connect`);
  },

  async setTrackingMode(TrackingMode) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/mount/tracking`, {
        params: { mode: TrackingMode },
      });
      return response.data;
    } catch (error) {
      // console.error('Error setTrackingMode:', error);
      throw error;
    }
  },

  async moveAxis(direction, rate = 8) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/mount/move-axis`, {
        params: {
          direction,
          rate,
        },
      });
      return response.data;
    } catch (error) {
      // console.error('Error moveAxis:', error);
      throw error;
    }
  },

  async moveAxisStop() {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/mount/move-axis/stop`, {
        params: {},
      });
      return response.data;
    } catch (error) {
      // console.error('Error moveAxisStop:', error);
      throw error;
    }
  },

  async getMountGuideRate() {
    const { API_URL } = getUrls();
    return simpleGetRequest(`${API_URL}equipment/mount/guiderate`);
  },

  async setMountGuideRate(raSiderealMultiplier, decSiderealMultiplier) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.put(`${API_URL}equipment/mount/guiderate`, {
        raSiderealMultiplier,
        decSiderealMultiplier,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Manual-slew rate capability of the connected INDI mount (discrete steps / continuous range / none)
  async getMountSlewRates() {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}indi/mount/slew-rates`);
      return response.data;
    } catch (error) {
      console.error('Error fetching mount slew rates:', error);
      throw error;
    }
  },

  // Select the mount slew rate: { index } for discrete drivers, { value } (°/s) for continuous ones
  async setMountSlewRate(selection) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}indi/mount/slew-rate`, selection);
      return response.data;
    } catch (error) {
      console.error('Error setting mount slew rate:', error);
      throw error;
    }
  },
};
