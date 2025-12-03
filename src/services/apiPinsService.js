import axios from 'axios';
import { useSettingsStore } from "@/store/settingsStore";

const getBaseUrl = () => {
  const settingsStore = useSettingsStore();
  const protocol = settingsStore.backendProtocol || 'http';
  const host = settingsStore.connection.ip || window.location.hostname;
  let port = settingsStore.connection.port || window.location.port || 80;
  const apiPort = settingsStore.apiPort;

  // devport auf 5000 umleiten
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && port === 8080) {
    port = 5000;
  }

  return {
    base: `${protocol}://${host}:${apiPort}/v2/api`,
    api: `${protocol}://${host}:${port}/api/`,
    targetpic: `${protocol}://${host}:${port}/api/targetpic`,
    pluginServer: `${protocol}://${host}:${port}`,
  };
};

const getUrls = () => {
  const urls = getBaseUrl();
  return {
    BASE_URL: urls.base,
    API_URL: urls.api,
    TARGETPIC_URL: urls.targetpic,
    PLUGINSERVER_URL: urls.pluginServer,
  };
};

export default {
  //-------------------platesove the last image------------------------
  //http://localhost:1888/v2/api/platesolve
  safetyAction() {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/platesolve`);
  },

  // Private method for simple GET requests
  _simpleGetRequest(url) {
    return axios
      .get(url)
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  },
};