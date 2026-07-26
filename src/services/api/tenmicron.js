import axios from 'axios';
import { DEFAULT_TIMEOUT, getUrls } from './core';

export default {
  async tenMicronGetStatus(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}tenmicron/status`, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error getting TenMicron status:', error);
      throw error;
    }
  },

  async tenMicronGetMountTime(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}tenmicron/time`, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error getting TenMicron mount time:', error);
      throw error;
    }
  },

  async tenMicronGetBuilderStatus(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}tenmicron/builder-status`, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error getting TenMicron builder status:', error);
      throw error;
    }
  },

  async tenMicronGetBuilderOptions(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}tenmicron/builder-options`, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error getting TenMicron builder options:', error);
      throw error;
    }
  },

  async tenMicronSetBuilderOption(key, value, timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(
        `${API_URL}tenmicron/builder-option`,
        { key, value },
        { timeout }
      );
      return response.data;
    } catch (error) {
      console.error('Error setting TenMicron builder option:', error);
      throw error;
    }
  },

  async tenMicronResetBuilderOptions(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(
        `${API_URL}tenmicron/reset-builder-options`,
        {},
        { timeout }
      );
      return response.data;
    } catch (error) {
      console.error('Error resetting TenMicron builder options:', error);
      throw error;
    }
  },

  async tenMicronGetAlignmentModel(timeout = 60000) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}tenmicron/alignment-model`, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error getting TenMicron alignment model:', error);
      throw error;
    }
  },

  async tenMicronRefreshAlignmentModel(timeout = 60000) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/refresh-alignment-model`, null, {
        timeout,
      });
      return response.data;
    } catch (error) {
      console.error('Error refreshing TenMicron alignment model:', error);
      throw error;
    }
  },

  async tenMicronGetModelNames(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}tenmicron/model-names`, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error getting TenMicron model names:', error);
      throw error;
    }
  },

  async tenMicronGenerateGoldenSpiral(starCount, timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(
        `${API_URL}tenmicron/generate-golden-spiral`,
        { starCount },
        { timeout }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating golden spiral:', error);
      throw error;
    }
  },

  async tenMicronGenerateSiderealPath(params, timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/generate-sidereal-path`, params, {
        timeout,
      });
      return response.data;
    } catch (error) {
      console.error('Error generating sidereal path:', error);
      throw error;
    }
  },

  async tenMicronSiderealCoordsFromScope(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(
        `${API_URL}tenmicron/sidereal-path-coords-from-scope`,
        {},
        { timeout }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching scope coords:', error);
      throw error;
    }
  },

  async tenMicronSiderealCoordsFromSequence(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(
        `${API_URL}tenmicron/sidereal-path-coords-from-sequence`,
        {},
        { timeout }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching sequence coords:', error);
      throw error;
    }
  },

  async tenMicronClearPoints(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/clear-points`, {}, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error clearing TenMicron points:', error);
      throw error;
    }
  },

  async tenMicronBuildModel(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/build-model`, {}, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error starting TenMicron build:', error);
      throw error;
    }
  },

  async tenMicronCancelBuild(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/cancel-build`, {}, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error cancelling TenMicron build:', error);
      throw error;
    }
  },

  async tenMicronStopBuild(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/stop-build`, {}, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error stopping TenMicron build:', error);
      throw error;
    }
  },

  async tenMicronLoadModel(name, timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/load-model`, { name }, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error loading TenMicron model:', error);
      throw error;
    }
  },

  async tenMicronSaveModel(name, timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/save-model`, { name }, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error saving TenMicron model:', error);
      throw error;
    }
  },

  async tenMicronDeleteModel(name, timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/delete-model`, { name }, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error deleting TenMicron model:', error);
      throw error;
    }
  },

  async tenMicronDeleteWorstStar(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/delete-worst-star`, {}, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error deleting worst alignment star:', error);
      throw error;
    }
  },

  async tenMicronClearAlignment(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/clear-alignment`, {}, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error clearing TenMicron alignment:', error);
      throw error;
    }
  },

  async tenMicronSetDualAxisTracking(enabled, timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(
        `${API_URL}tenmicron/dual-axis-tracking`,
        { enabled },
        { timeout }
      );
      return response.data;
    } catch (error) {
      console.error('Error setting TenMicron dual axis tracking:', error);
      throw error;
    }
  },

  async tenMicronSetRefractionCorrection(enabled, timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(
        `${API_URL}tenmicron/refraction-correction`,
        { enabled },
        { timeout }
      );
      return response.data;
    } catch (error) {
      console.error('Error setting TenMicron refraction correction:', error);
      throw error;
    }
  },

  async tenMicronDisableUnattendedFlip(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(
        `${API_URL}tenmicron/unattended-flip/disable`,
        {},
        { timeout }
      );
      return response.data;
    } catch (error) {
      console.error('Error disabling TenMicron unattended flip:', error);
      throw error;
    }
  },

  async tenMicronResetMeridianLimit(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(
        `${API_URL}tenmicron/reset-meridian-limit`,
        {},
        { timeout }
      );
      return response.data;
    } catch (error) {
      console.error('Error resetting TenMicron meridian limit:', error);
      throw error;
    }
  },

  async tenMicronResetSlewSettle(timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/reset-slew-settle`, {}, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error resetting TenMicron slew settle time:', error);
      throw error;
    }
  },

  async tenMicronSetSlewRate(value, timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/slew-rate`, { value }, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error setting TenMicron slew rate:', error);
      throw error;
    }
  },

  async tenMicronSetHorizonHigh(value, timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/horizon-high`, { value }, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error setting TenMicron horizon limit high:', error);
      throw error;
    }
  },

  async tenMicronSetHorizonLow(value, timeout = DEFAULT_TIMEOUT) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}tenmicron/horizon-low`, { value }, { timeout });
      return response.data;
    } catch (error) {
      console.error('Error setting TenMicron horizon limit low:', error);
      throw error;
    }
  },
};
