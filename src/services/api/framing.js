import axios from 'axios';
import { getUrls, simpleGetRequest, getWithParams } from './core';

export default {
  //------------------------------------- Fav Targets ------------------------------------------

  async getAllFavorites() {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}favorites`);
      return response.data;
    } catch (error) {
      // console.error('Error fetching favorites:', error);
      throw error;
    }
  },

  async addFavorite(favorite) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}favorites`, favorite);
      return response.data;
    } catch (error) {
      // console.error('Error adding favorite:', error);
      throw error;
    }
  },

  async updateFavorite(id, updatedFavorite) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.put(`${API_URL}favorites/${id}`, updatedFavorite);
      return response.data;
    } catch (error) {
      // console.error(`Error updating favorite with ID ${id}:`, error);
      throw error;
    }
  },

  async deleteFavorite(id) {
    try {
      const { API_URL } = getUrls();
      const response = await axios.delete(`${API_URL}favorites/${id}`);
      return response.data;
    } catch (error) {
      // console.error(`Error deleting favorite with ID ${id}:`, error);
      throw error;
    }
  },

  //-------------------------------------  Framing ---------------------------------------
  framingAction(action) {
    const { BASE_URL } = getUrls();
    return simpleGetRequest(`${BASE_URL}/framing/${action}`);
  },

  async setFramingImageSource(source) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/framing/set-source`, {
        params: { source },
      });
      return response.data;
    } catch (error) {
      // console.error('Error controlling setFramingImageSource:', error);
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
      // console.error('Error setting framing coordinates:', error);
      throw error;
    }
  },

  async slewAndCenter(ra, dec, Center = false, rotate = false, rotationAngle) {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/mount/slew`, {
        params: {
          ra: ra,
          dec: dec,
          center: Center,
          rotate: rotate,
          rotationAngle: rotationAngle,
          waitForResult: true,
        },
      });
      console.log('Slew response: ', response);
      return response.data;
    } catch (error) {
      // console.error('Error controlling slewAndCenterAndRotate:', error);
      throw error;
    }
  },
  async slewStop() {
    try {
      const { BASE_URL } = getUrls();
      const response = await axios.get(`${BASE_URL}/equipment/mount/slew/stop`);
      return response.data;
    } catch (error) {
      // console.error('Error controlling slewAndCenterAndRotate:', error);
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
      // console.error('Error controlling slewAndCenterAndRotate:', error);
      throw error;
    }
  },

  async cancelSlewAndCenter() {
    //Kommt von der TNS API
    try {
      const { API_URL } = getUrls();
      const response = await axios.post(`${API_URL}framing/cancel`, {});
      console.log('Cancel SlweAndCenter:', response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  //-------------------------------------  Target Search ---------------------------------------

  async searchNGC(query, limit = 50) {
    if (!query || query.replace(/[^a-zA-Z0-9]/g, '').length < 2) {
      return { data: [] };
    }
    const { API_URL } = getUrls();
    return getWithParams(`${API_URL}ngc/search`, { query, limit });
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
      // console.error('Error retrieving target picture:', error);
      throw error;
    }
  },
};
