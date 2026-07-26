import axios from 'axios';
import { getUrls } from './core';

export default {
  // --------------------------------- Night Summary Plugin ---------------------------------
  nightsummary: {
    async getStatus() {
      try {
        const { API_URL } = getUrls();
        const response = await axios.get(`${API_URL}nightsummary/status`);
        return response.data;
      } catch (error) {
        return { Success: false, Response: { Installed: false } };
      }
    },

    async getSettings() {
      try {
        const { API_URL } = getUrls();
        const response = await axios.get(`${API_URL}nightsummary/settings`);
        return response.data;
      } catch (error) {
        console.error('Error fetching Night Summary settings:', error);
        throw error;
      }
    },

    async updateSettings(patch) {
      try {
        const { API_URL } = getUrls();
        const response = await axios.put(`${API_URL}nightsummary/settings`, patch);
        return response.data;
      } catch (error) {
        console.error('Error updating Night Summary settings:', error);
        throw error;
      }
    },

    async testEmail() {
      try {
        const { API_URL } = getUrls();
        const response = await axios.post(`${API_URL}nightsummary/test-email`);
        return response.data;
      } catch (error) {
        return { Success: true, Response: { Ok: false, Message: error.message } };
      }
    },

    async testDiscord() {
      try {
        const { API_URL } = getUrls();
        const response = await axios.post(`${API_URL}nightsummary/test-discord`);
        return response.data;
      } catch (error) {
        return { Success: true, Response: { Ok: false, Message: error.message } };
      }
    },

    async testPushover() {
      try {
        const { API_URL } = getUrls();
        const response = await axios.post(`${API_URL}nightsummary/test-pushover`);
        return response.data;
      } catch (error) {
        return { Success: true, Response: { Ok: false, Message: error.message } };
      }
    },

    async getSessions(limit = 50) {
      try {
        const { API_URL } = getUrls();
        const response = await axios.get(`${API_URL}nightsummary/sessions`, { params: { limit } });
        return response.data;
      } catch (error) {
        console.error('Error fetching Night Summary sessions:', error);
        throw error;
      }
    },

    async getSession(sessionId) {
      try {
        const { API_URL } = getUrls();
        const response = await axios.get(
          `${API_URL}nightsummary/sessions/${encodeURIComponent(sessionId)}`
        );
        return response.data;
      } catch (error) {
        console.error('Error fetching Night Summary session:', error);
        throw error;
      }
    },

    async resendSession(sessionId) {
      try {
        const { API_URL } = getUrls();
        const response = await axios.post(
          `${API_URL}nightsummary/sessions/${encodeURIComponent(sessionId)}/resend`
        );
        return response.data;
      } catch (error) {
        console.error('Error resending Night Summary session:', error);
        throw error;
      }
    },

    async deleteSession(sessionId) {
      try {
        const { API_URL } = getUrls();
        const response = await axios.delete(
          `${API_URL}nightsummary/sessions/${encodeURIComponent(sessionId)}`
        );
        return response.data;
      } catch (error) {
        console.error('Error deleting Night Summary session:', error);
        throw error;
      }
    },
  },

  // --------------------------------- Ground Station Plugin ---------------------------------
  groundstation: {
    async getStatus() {
      try {
        const { API_URL } = getUrls();
        const response = await axios.get(`${API_URL}groundstation/status`);
        return response.data;
      } catch (error) {
        return { Success: false, Response: { Installed: false } };
      }
    },

    async getPushover() {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}groundstation/pushover`);
      return response.data;
    },
    async updatePushover(patch) {
      const { API_URL } = getUrls();
      const response = await axios.put(`${API_URL}groundstation/pushover`, patch);
      return response.data;
    },
    async testPushover() {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}groundstation/pushover/test`);
      return response.data;
    },

    async getTelegram() {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}groundstation/telegram`);
      return response.data;
    },
    async updateTelegram(patch) {
      const { API_URL } = getUrls();
      const response = await axios.put(`${API_URL}groundstation/telegram`, patch);
      return response.data;
    },
    async testTelegram() {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}groundstation/telegram/test`);
      return response.data;
    },

    async getEmail() {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}groundstation/email`);
      return response.data;
    },
    async updateEmail(patch) {
      const { API_URL } = getUrls();
      const response = await axios.put(`${API_URL}groundstation/email`, patch);
      return response.data;
    },
    async testEmail() {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}groundstation/email/test`);
      return response.data;
    },

    async getDiscord() {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}groundstation/discord`);
      return response.data;
    },
    async updateDiscord(patch) {
      const { API_URL } = getUrls();
      const response = await axios.put(`${API_URL}groundstation/discord`, patch);
      return response.data;
    },
    async testDiscord() {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}groundstation/discord/test`);
      return response.data;
    },

    async getSlack() {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}groundstation/slack`);
      return response.data;
    },
    async updateSlack(patch) {
      const { API_URL } = getUrls();
      const response = await axios.put(`${API_URL}groundstation/slack`, patch);
      return response.data;
    },
    async refreshSlackChannels() {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}groundstation/slack/refresh-channels`);
      return response.data;
    },

    async getMqtt() {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}groundstation/mqtt`);
      return response.data;
    },
    async updateMqtt(patch) {
      const { API_URL } = getUrls();
      const response = await axios.put(`${API_URL}groundstation/mqtt`, patch);
      return response.data;
    },
    async testMqtt() {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}groundstation/mqtt/test`);
      return response.data;
    },

    async getIfttt() {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}groundstation/ifttt`);
      return response.data;
    },
    async updateIfttt(patch) {
      const { API_URL } = getUrls();
      const response = await axios.put(`${API_URL}groundstation/ifttt`, patch);
      return response.data;
    },
    async testIfttt() {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}groundstation/ifttt/test`);
      return response.data;
    },

    async getNtfysh() {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}groundstation/ntfysh`);
      return response.data;
    },
    async updateNtfysh(patch) {
      const { API_URL } = getUrls();
      const response = await axios.put(`${API_URL}groundstation/ntfysh`, patch);
      return response.data;
    },
    async testNtfysh() {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}groundstation/ntfysh/test`);
      return response.data;
    },
  },
};
