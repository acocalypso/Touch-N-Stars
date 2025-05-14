import axios from 'axios';
import { getActivePinia } from 'pinia';

let settingsStore;
let store;
const DEFAULT_TIMEOUT = 2000;

const initializeStore = () => {
  if (!settingsStore) {
    const pinia = getActivePinia();
    if (!pinia) {
      throw new Error('Pinia store not initialized');
    }
    settingsStore = pinia._s.get('settings');
    store = pinia._s.get('store');

    // Watch for connection changes
    settingsStore.$onAction(({ name }) => {
      if (name === 'setConnection') {
        // Connection changed - URLs will be regenerated on next request
      }
    });
  }
};

const getBaseUrl = () => {
  initializeStore();
  const protocol = settingsStore.backendProtocol || 'http';
  const host = settingsStore.connection.ip || window.location.hostname;
  let port = settingsStore.connection.port || window.location.port || 5000;
  const apiPort = store.apiPort;

  //devport auf 5000 umleiten
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && port == 8080) {
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

const apiService = {
  async fetchApiPort(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}get-api-port`, { timeout });
      return response;
    } catch (error) {
      console.error('Error reaching backend:', error.message);
      return false;
    }
  },

  async fetchTnsPluginVersion(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}version`, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error reaching backend:', error.message);
      return false;
    }
  },

  // Backend reachability check
  async fetchApiVersion(timeout = DEFAULT_TIMEOUT) {
    const { BASE_URL } = getUrls();
    try {
      const { data } = await axios.get(`${BASE_URL}/version`, { timeout });
      return data; // Erfolg
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        console.warn(`fetchApiVersion: Timeout nach ${timeout} ms`);
      } else {
        console.error('Error reaching backend:', err.message);
      }
      return null;
    }
  },

  //------------------------------------- Fav Targets ------------------------------------------

  async getAllFavorites() {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}favorites`);
      return response.data;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  },

  async addFavorite(favorite) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}favorites`, favorite);
      return response.data;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  },

  async updateFavorite(id, updatedFavorite) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.put(`${API_URL}favorites/${id}`, updatedFavorite);
      return response.data;
    } catch (error) {
      console.error(`Error updating favorite with ID ${id}:`, error);
      throw error;
    }
  },

  async deleteFavorite(id) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.delete(`${API_URL}favorites/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting favorite with ID ${id}:`, error);
      throw error;
    }
  },

  //-------------------------------------  Image History ---------------------------------------
  async imageHistoryAll() {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/image-history`, {
        params: { all: true },
      });
      return response.data;
    } catch (error) {
      console.error('Error read Image History:', error);
      throw error;
    }
  },

  async imageHistoryAllFilterd(imageType) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/image-history`, {
        params: {
          all: true,
          imageType: imageType,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error read Image History:', error);
      throw error;
    }
  },

  //-------------------------------------  Image  ---------------------------------------
  async getSequenceImage(index, quality, resize, scale) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/image/${index}`, {
        params: {
          quality: quality,
          resize: resize,
          scale: scale,
          autoPrepare: true,
          stream: true,
        },
        responseType: 'blob',
      });
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error read Image :', error);
      throw error;
    }
  },

  async getSequenceThumbnail(index) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/image/thumbnail/${index}`, {
        responseType: 'blob',
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.error('Error read Thumbnail :', error);
      throw error;
    }
  },

  async getSequenceImageFilterd(index, quality, resize, scale, imageType) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/image/${index}`, {
        params: {
          quality: quality,
          resize: resize,
          scale: scale,
          autoPrepare: true,
          imageType: imageType,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error read Image :', error);
      throw error;
    }
  },

  //-------------------------------------  sequence ---------------------------------------
  sequenceAction(action) {
    const { BASE_URL } = getUrls();
    if (action === 'start') {
      return this._simpleGetRequest(`${BASE_URL}/sequence/start?skipValidation=true`).then(
        (response) => ({
          ...response,
          Response: 'Sequence start',
          Success: true,
        })
      );
    }
    return this._simpleGetRequest(`${BASE_URL}/sequence/${action}`);
  },

  //sequence/set-target?name=Orion Nebula&ra=83.822083&dec=-5.391111&rotation=5&index=0
  async sequnceTargetSet(name, ra, dec, rotation, index) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/sequence/set-target?`, {
        params: {
          name,
          ra,
          dec,
          rotation,
          index,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error read Image :', error);
      throw error;
    }
  },

  //-------------------------------------  Mount ---------------------------------------
  mountAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/mount/${action}`);
  },

  async setTrackingMode(TrackingMode) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/mount/tracking`, {
        params: { mode: TrackingMode },
      });
      return response.data;
    } catch (error) {
      console.error('Error setTrackingMode:', error);
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
      console.error('Error moveAxis:', error);
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
      console.error('Error moveAxisStop:', error);
      throw error;
    }
  },

  //-------------------------------------  profile ---------------------------------------
  profileAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/profile/${action}`);
  },

  //   change-value
  async profileChangeValue(settingpath, newValue) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/profile/change-value`, {
        params: {
          settingpath,
          newValue,
        },
      });
      //console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Error switch profil:', error);
      throw error;
    }
  },

  // Profil Switch
  async profileSwitch(profileid) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/profile/switch`, {
        params: { profileid: profileid },
      });
      return response.data;
    } catch (error) {
      console.error('Error switch profil:', error);
      throw error;
    }
  },

  //-------------------------------------  application ---------------------------------------
  async applicatioTabSwitch(tab) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/application/switch-tab`, {
        params: { tab: tab },
      });
      return response.data;
    } catch (error) {
      console.error('Error open application:', error);
      throw error;
    }
  },

  async fetchApplicatioTab() {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/application/get-tab`, {});
      return response.data;
    } catch (error) {
      console.error('Error application:', error);
      throw error;
    }
  },

  //-------------------------------------  Camera ---------------------------------------
  cameraAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/camera/${action}`);
  },

  async startCapture(duration, gain, solve = false) {
    console.log('Zeit:', duration, 'Gain: ', gain);
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/camera/capture`, {
        params: {
          duration: duration,
          gain: gain,
          solve: solve,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error starting capture:', error);
      throw error;
    }
  },

  async getPlatesovle(duration, gain) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/camera/capture`, {
        params: {
          duration: duration,
          gain: gain,
          solve: true,
          omitImage: true,
          waitForResult: true,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error starting capture:', error);
      throw error;
    }
  },

  async getCaptureResult(quality = 80) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/camera/capture`, {
        params: {
          getResult: true,
          quality: quality,
          autoPrepare: true,
          stream: true,
        },
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Error retrieving capture result:', error);
      throw error;
    }
  },

  async getImageData() {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/camera/capture`, {
        params: {
          getResult: true,
          omitImage: true,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error retrieving capture result:', error);
      throw error;
    }
  },

  async startCooling(temp, minutes) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/camera/cool`, {
        params: {
          temperature: temp,
          minutes: minutes,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error retrieving capture result:', error);
      throw error;
    }
  },

  async stoppCooling() {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/camera/cool`, {
        params: { cancel: true },
      });
      return response.data;
    } catch (error) {
      console.error('Error retrieving capture result:', error);
      throw error;
    }
  },

  async startStoppWarming(cancel, minutes) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/camera/warm`, {
        params: {
          cancel: cancel,
          minutes: minutes,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error retrieving capture result:', error);
      throw error;
    }
  },

  async startStoppDewheater(power) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/camera/dew-heater`, {
        params: { power: power },
      });
      return response.data;
    } catch (error) {
      console.error('Error retrieving capture result:', error);
      throw error;
    }
  },

  async setBinningMode(mode) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/camera/set-binning`, {
        params: { binning: mode },
      });
      return response.data;
    } catch (error) {
      console.error('Error retrieving result:', error);
      throw error;
    }
  },

  async setReadoutMode(mode) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/camera/set-readout`, {
        params: { mode: mode },
      });
      return response.data;
    } catch (error) {
      console.error('Error retrieving result:', error);
      throw error;
    }
  },

  //-------------------------------------  Filterwheel ---------------------------------------
  filterAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/filterwheel/${action}`);
  },

  async changeFilter(filterNr) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/filterwheel/change-filter`, {
        params: { filterId: filterNr },
      });
      return response.data;
    } catch (error) {
      console.error('Error changing filter:', error);
      throw error;
    }
  },

  //-------------------------------------  Rotator ---------------------------------------
  rotatorAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/rotator/${action}`);
  },

  async moveRotator(position) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/rotator/move`, {
        params: { position: position },
      });
      return response.data;
    } catch (error) {
      console.error('Error moving Rotator:', error);
      throw error;
    }
  },

  async moveMechanicalRotator(position) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/rotator/move-mechanical`, {
        params: { position: position },
      });
      return response.data;
    } catch (error) {
      console.error('Error moving mechanical Rotator:', error);
      throw error;
    }
  },

  //-------------------------------------  flatdevice ---------------------------------------

  flatdeviceAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/flatdevice/${action}`);
  },

  async flatdeviceSetLight(on) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/flatdevice/set-light`, {
        params: { on: on }, //true or false
      });
      return response.data;
    } catch (error) {
      console.error('Error set-light:', error);
      throw error;
    }
  },

  async flatdeviceSetCover(closed) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/flatdevice/set-cover`, {
        params: { closed: closed }, //true or false
      });
      return response.data;
    } catch (error) {
      console.error('Error set-cover:', error);
      throw error;
    }
  },

  async flatdeviceSetBrightness(brightness) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/flatdevice/set-brightness`, {
        params: { brightness: brightness }, //z.B. 42
      });
      return response.data;
    } catch (error) {
      console.error('Error set brightness:', error);
      throw error;
    }
  },

  //-------------------------------------  Flatassistant ---------------------------------------
  flatassistantAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/flats/${action}`);
  },

  //auto-exposure
  async flatAutoExposure(
    count,
    minExposure,
    maxExposure,
    histogramMean,
    meanTolerance,
    binning,
    gain,
    offset,
    filter,
    brightness
  ) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/flats/auto-exposure`, {
        params: {
          count,
          minExposure,
          maxExposure,
          histogramMean,
          meanTolerance,
          binning,
          gain,
          offset,
          filter,
          brightness,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error auto-exposure:', error);
      throw error;
    }
  },

  //auto-brightness
  async flatAutoBrightness(
    count,
    minBrightness,
    maxBrightness,
    histogramMean,
    meanTolerance,
    binning,
    gain,
    offset,
    filter,
    exposureTime
  ) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/flats/auto-brightness`, {
        params: {
          count,
          minBrightness,
          maxBrightness,
          histogramMean,
          meanTolerance,
          binning,
          gain,
          offset,
          filter,
          exposureTime,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error auto-brightness:', error);
      throw error;
    }
  },

  //skyflat
  async flatSkyflat(
    count,
    minExposure,
    maxExposure,
    histogramMean,
    meanTolerance,
    binning,
    gain,
    offset,
    filter
  ) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/flats/skyflat`, {
        params: {
          count,
          minExposure,
          maxExposure,
          histogramMean,
          meanTolerance,
          binning,
          gain,
          offset,
          filter,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error skyflats:', error);
      throw error;
    }
  },

  //-------------------------------------  dome ---------------------------------------
  domeAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/dome/${action}`);
  },

  //-------------------------------------  focuser ---------------------------------------
  focusAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/focuser/${action}`);
  },

  focuserAfAction(action) {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}autofocus/${action}`);
  },

  focuserLastAf() {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/focuser/last-af`);
  },

  async moveFocuser(position) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/focuser/move`, {
        params: { position },
      });
      return response.data;
    } catch (error) {
      console.error('Error moving focuser:', error);
      throw error;
    }
  },

  //-------------------------------------  Switch ----------------------------------------
  switchAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/switch/${action}`);
  },

  async setSwitch(id, value) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/switch/set`, {
        params: {
          index: id,
          value: value,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error setSwitch:', error);
      throw error;
    }
  },

  //-------------------------------------  Weather ----------------------------------------
  weatherAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/weather/${action}`);
  },

  //-------------------------------------  Framing ---------------------------------------
  framingAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/framing/${action}`);
  },

  async setFramingImageSource(source) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/framing/set-source`, {
        params: { source },
      });
      return response.data;
    } catch (error) {
      console.error('Error controlling setFramingImageSource:', error);
      throw error;
    }
  },

  async setFramingCoordinates(RAangle, DECangle) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/framing/set-coordinates`, {
        params: { RAangle, DECangle },
      });
      return response.data;
    } catch (error) {
      console.error('Error setting framing coordinates:', error);
      throw error;
    }
  },

  async slewAndCenter(RAangle, DECangle, Center) {
    try {
      const { BASE_URL } = getUrls();
      await this.setFramingCoordinates(RAangle, DECangle);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // damit NINA genug Zeit hat die Koordinaten zu setzen
      const response = await axios.get(`${BASE_URL}/framing/slew`, {
        params: {
          slew_option: Center ? 'Center' : '',
          waitForResult: true,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error controlling slewAndCenterAndRotate:', error);
      throw error;
    }
  },
  async slewStop() {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/mount/slew/stop`);
      return response.data;
    } catch (error) {
      console.error('Error controlling slewAndCenterAndRotate:', error);
      throw error;
    }
  },

  async framingRotate(rotation) {
    try {
      const { BASE_URL } = getUrls();
      await axios.get(`${BASE_URL}/framing/set-rotation`, {
        params: {
          rotation: rotation,
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 3000)); // damit NINA genug Zeit hat die Koordinaten zu setzen
      const response = await axios.get(`${BASE_URL}/framing/slew`, {
        params: {
          slew_option: 'Rotate',
          waitForResult: true,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error controlling slewAndCenterAndRotate:', error);
      throw error;
    }
  },

  async searchNGC(query, limit = 10) {
    const { API_URL } = getUrls();
    return this._getWithParams(`${API_URL}ngc/search`, { query, limit });
  },

  async searchTargetPic(width, height, fov, ra, dec, useCache) {
    try {
      const { TARGETPIC_URL } = getUrls();
      const response = await axios.get(TARGETPIC_URL, {
        params: {
          width,
          height,
          fov,
          ra,
          dec,
          useCache,
        },
        responseType: 'blob',
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error retrieving target picture:', error);
      throw error;
    }
  },

  //-------------------------------------  guider ---------------------------------------
  /* commands:
      - info
      - clear-calibration
      - graph                 */

  guiderAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/guider/${action}`);
  },

  async guiderStart(calibrate) {
    //calibrate = true or false
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/guider/start`, {
        params: { calibrate },
      });
      return response.data;
    } catch (error) {
      console.error('Error retrieving logs result:', error);
      throw error;
    }
  },

  //-------------------------------------  safety ---------------------------------------
  safetyAction(action) {
    const { BASE_URL } = getUrls();
    return this._simpleGetRequest(`${BASE_URL}/equipment/safetymonitor/${action}`);
  },

  //-------------------------------------  Logs ---------------------------------------
  async getLastLogs(count, level) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}logs`, {
        params: { count, level },
      });
      return response.data;
    } catch (error) {
      console.error('Error retrieving logs result:', error);
      throw error;
    }
  },

  //-------------------------------------  System Controls ------------------------------
  shutdown() {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}system/shutdown`);
  },

  restart() {
    const { API_URL } = getUrls();
    return this._simpleGetRequest(`${API_URL}system/restart`);
  },

  //-------------------------------------  Helper ---------------------------------------
  _simpleGetRequest(url) {
    return axios
      .get(url)
      .then((response) => response.data)
      .catch((error) => {
        console.error(`Error in GET request to ${url}:`, error);
        throw error;
      });
  },

  _getWithParams(url, params) {
    return axios
      .get(url, { params })
      .then((response) => response.data)
      .catch((error) => {
        console.error(`Error in GET request to ${url} with params:`, error);
        throw error;
      });
  },
};

export default apiService;
