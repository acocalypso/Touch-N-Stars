import axios from 'axios';
import { useSettingsStore } from '@/store/settingsStore';
import { apiStore } from '@/store/store';

const getBaseUrl = () => {
  const settingsStore = useSettingsStore();
  const store = apiStore();
  const protocol = settingsStore.backendProtocol || 'http';
  const host = settingsStore.connection.ip || window.location.hostname;
  let port = settingsStore.connection.port || window.location.port || 80;
  const apiPort = store.apiPort;

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
  //-------------------INDI------------------------
  //query the list of available INDI devices for a given type
  //(focuser, filterwheel, rotator, telescope, weather switches, flatpanel.)
  getINDIDeviceList(device) {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}indi/${device}`);
  },

  //-------------------Focuser------------------------
  focuserAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/focuser/${action}`);
  },

  //-------------------PHD2------------------------

  getPHD2CameraList() {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}phd2/camera/list`);
  },

  getPHD2SelectedCamera() {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}phd2/camera/selected`);
  },

  setPHD2SelectedCamera(index) {
    const { API_URL } = getUrls();
    return this._simplePutRequest(`${API_URL}phd2/camera/selected`, { index });
  },

  getPHD2MountList() {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}phd2/mount/list`);
  },

  getPHD2SelectedMount() {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}phd2/mount/selected`);
  },

  setPHD2SelectedMount(index) {
    const { API_URL } = getUrls();
    return this._simplePutRequest(`${API_URL}phd2/mount/selected`, { index });
  },

  getPHD2Focallength() {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}phd2/calibration/focal-length`);
  },

  setPHD2Focallength(focalLength) {
    const { API_URL } = getUrls();
    return this._simplePutRequest(`${API_URL}phd2/calibration/focal-length`, { focalLength });
  },

  getPHD2CalibrationStep() {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}phd2/calibration/step`);
  },

  setPHD2CalibrationStep(calibrationStep) {
    const { API_URL } = getUrls();
    return this._simplePutRequest(`${API_URL}phd2/calibration/step`, { calibrationStep });
  },

  getPHD2ReverseDecAfterFlip() {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}phd2/reverse-dec-after-flip`);
  },

  setPHD2ReverseDecAfterFlip(enabled) {
    const { API_URL } = getUrls();
    return this._simplePutRequest(`${API_URL}phd2/reverse-dec-after-flip`, { enabled });
  },

  getPHD2GuideAlgorithmRA() {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}phd2/guide/algorithm-ra`);
  },

  setPHD2GuideAlgorithmRA(algorithm) {
    const { API_URL } = getUrls();
    return this._simplePutRequest(`${API_URL}phd2/guide/algorithm-ra`, { algorithm });
  },

  getPHD2GuideAlgorithmDEC() {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}phd2/guide/algorithm-dec`);
  },

  setPHD2GuideAlgorithmDEC(algorithm) {
    const { API_URL } = getUrls();
    return this._simplePutRequest(`${API_URL}phd2/guide/algorithm-dec`, { algorithm });
  },

  setPHD2SelectedProfile(id) {
    const { API_URL } = getUrls();
    return this._simplePutRequest(`${API_URL}phd2/profile/select`, { id });
  },

  renamePHD2Profile(name) {
    const { API_URL } = getUrls();
    return this._simplePostRequest(`${API_URL}phd2/profile/rename`, { name });
  },

  deletePHD2Profile(name) {
    const { API_URL } = getUrls();
    return this._simplePostRequest(`${API_URL}phd2/profile/delete`, { name });
  },

  createPHD2Profile(name) {
    const { API_URL } = getUrls();
    return this._simplePostRequest(`${API_URL}phd2/profile/create`, { name });
  },

  getGuideCam() {
    const { API_URL } = getUrls();
    return this._simplePostRequest(`${API_URL}phd2/camera/ids` );
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

  // Private method for simple PUT requests
  _simplePutRequest(url, data) {
    return axios
      .put(url, data)
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  },

  // Private method for simple POST requests
  _simplePostRequest(url, data) {
    return axios
      .post(url, data)
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  },
};
