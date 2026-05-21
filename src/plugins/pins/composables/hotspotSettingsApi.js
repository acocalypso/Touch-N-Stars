import axios from 'axios';

export function createHotspotSettingsApi({ getIp, port, token }) {
  function getClient() {
    return axios.create({ headers: {} });
  }

  function getAuthHeaders() {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async function fetchHotspotSettings() {
    const ip = getIp();
    if (!ip) {
      throw new Error('Missing host IP');
    }

    const client = getClient();
    const response = await client.get(`http://${ip}:${port}/wifi/hotspot/settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 8000,
    });

    return response.data || {};
  }

  async function updateHotspotSettings(payload) {
    const ip = getIp();
    if (!ip) {
      throw new Error('Missing host IP');
    }

    const client = getClient();
    const response = await client.post(`http://${ip}:${port}/wifi/hotspot/settings`, payload, {
      headers: getAuthHeaders(),
      timeout: 30000,
    });

    return response.data || {};
  }

  return {
    fetchHotspotSettings,
    updateHotspotSettings,
  };
}
