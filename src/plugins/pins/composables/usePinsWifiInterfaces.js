import { ref } from 'vue';
import axios from 'axios';

export function usePinsWifiInterfaces({ t, appendLog, getIp, PORT, TOKEN, status }) {
  const wifiAdapters = ref([]);
  const isWifiAdaptersLoading = ref(false);
  const isWifiInterfacesSaving = ref(false);
  const selectedClientInterface = ref('');
  const selectedHotspotInterface = ref('');

  function normalizeWifiAdapter(adapter) {
    if (!adapter || typeof adapter !== 'object') {
      return null;
    }

    return {
      interface: adapter.interface || '',
      state: adapter.state || 'unknown',
      connection: adapter.connection ?? null,
      role: adapter.role || 'idle',
      mac: adapter.mac ?? null,
      driver: adapter.driver ?? null,
      mtu: adapter.mtu ?? null,
    };
  }

  function reconcileSelectedWifiInterfaces() {
    const availableIfaces = new Set(wifiAdapters.value.map((adapter) => adapter.interface));

    if (selectedClientInterface.value && !availableIfaces.has(selectedClientInterface.value)) {
      selectedClientInterface.value = '';
    }

    if (selectedHotspotInterface.value && !availableIfaces.has(selectedHotspotInterface.value)) {
      selectedHotspotInterface.value = '';
    }
  }

  async function loadWifiAdapters() {
    const ip = getIp();
    if (!ip || isWifiAdaptersLoading.value) return;

    isWifiAdaptersLoading.value = true;
    try {
      const directAxios = axios.create({ headers: {} });
      const response = await directAxios.get(`http://${ip}:${PORT}/wifi/adapters`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
        timeout: 10000,
      });

      const adapters = response.data?.adapters || [];
      wifiAdapters.value = adapters.map(normalizeWifiAdapter).filter(Boolean);
      reconcileSelectedWifiInterfaces();
    } catch (error) {
      console.error(error);
      appendLog(t('plugins.pins.logs.wifiAdaptersLoadFailed', { message: error.message }));
    } finally {
      isWifiAdaptersLoading.value = false;
    }
  }

  async function loadWifiInterfaces() {
    const ip = getIp();
    if (!ip) return;

    try {
      const directAxios = axios.create({ headers: {} });
      const response = await directAxios.get(`http://${ip}:${PORT}/wifi/interfaces`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
        timeout: 10000,
      });

      const data = response.data || {};
      selectedClientInterface.value = data.client_interface || '';
      selectedHotspotInterface.value = data.hotspot_interface || '';
      reconcileSelectedWifiInterfaces();
    } catch (error) {
      console.error(error);
      appendLog(t('plugins.pins.logs.wifiInterfacesLoadFailed', { message: error.message }));
    }
  }

  async function loadWifiInterfaceConfig() {
    await Promise.all([loadWifiAdapters(), loadWifiInterfaces()]);
    reconcileSelectedWifiInterfaces();
  }

  async function saveWifiInterfaces() {
    if (status.value === 'Running' || isWifiInterfacesSaving.value) return;

    const ip = getIp();
    if (!ip) {
      appendLog(t('plugins.pins.logs.noIp'));
      return;
    }

    isWifiInterfacesSaving.value = true;
    try {
      const directAxios = axios.create({ headers: {} });
      const response = await directAxios.post(
        `http://${ip}:${PORT}/wifi/interfaces`,
        {
          client_interface: selectedClientInterface.value || null,
          hotspot_interface: selectedHotspotInterface.value || null,
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const data = response.data || {};
      selectedClientInterface.value = data.client_interface || '';
      selectedHotspotInterface.value = data.hotspot_interface || '';
      reconcileSelectedWifiInterfaces();
      appendLog(
        t('plugins.pins.logs.wifiInterfacesSaved', {
          clientInterface: selectedClientInterface.value || 'auto',
          hotspotInterface: selectedHotspotInterface.value || 'auto',
        })
      );
      await loadWifiAdapters();
    } catch (error) {
      console.error(error);
      appendLog(t('plugins.pins.logs.wifiInterfacesSaveFailed', { message: error.message }));

      if (error.response) {
        appendLog(
          t('plugins.pins.logs.serverError', {
            status: error.response.status,
            data: JSON.stringify(error.response.data),
          })
        );
      }
    } finally {
      isWifiInterfacesSaving.value = false;
    }
  }

  return {
    wifiAdapters,
    isWifiAdaptersLoading,
    isWifiInterfacesSaving,
    selectedClientInterface,
    selectedHotspotInterface,
    loadWifiInterfaceConfig,
    saveWifiInterfaces,
  };
}
