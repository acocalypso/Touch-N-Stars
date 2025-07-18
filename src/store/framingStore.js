import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { handleApiError } from '@/utils/utils';

export const useFramingStore = defineStore('FramingStore', {
  state: () => ({
    framingInfo: [],
    searchQuery: '',
    targetSearchResult: [],
    selectedItem: null,
    RAangle: 0,
    DECangle: 90,
    RAangleString: '',
    DECangleString: '',
    useNinaCache: true,
    fov: 5,
    camWidth: 100,
    camHeight: 100,
    containerSize: 500,
    rotationAngle: 0,
    showFramingModal: false,
    isSlewing: false,
    isSlewingAndCentering: false,
    isRotating: false,
    width: 200,
    height: 200,
    slewIsStopt: false,
  }),
  actions: {
    async slew(RAangle, DECangle) {
      this.slewIsStopt = false;
      console.log('SlewAndCenter', RAangle, DECangle);
      this.isSlewing = true;
      try {
        const response = await apiService.slewAndCenter(RAangle, DECangle, false);
        console.log('SlewAndCenter', response);
        if (handleApiError(response, { title: 'Mount error' })) return;
      } catch (error) {
        console.error('SlewAndCenter Error', error);
      } finally {
        this.isSlewing = false;
      }
    },
    async slewAndCenter(RAangle, DECangle) {
      console.log('SlewAndCenter', RAangle, DECangle);
      this.isSlewingAndCentering = true;
      try {
        await apiService.slewAndCenter(RAangle, DECangle, true);
      } catch (error) {
        console.error('SlewAndCenter Error', error);
      } finally {
        this.isSlewingAndCentering = false;
      }
    },
    async slewAndCenterRotate(RAangle, DECangle, center, rotate) {
      console.log('SlewAndCenterRotate', RAangle, DECangle);
      this.isSlewingAndCentering = true;
      try {
        await apiService.slewAndCenter(RAangle, DECangle, center, rotate, this.rotationAngle);
      } catch (error) {
        console.error('SlewAndCenter Error', error);
      } finally {
        this.isSlewingAndCentering = false;
      }
    },
    async slewStop() {
      console.log('slewStop');
      this.slewIsStopt = true;
      try {
        const response = await apiService.slewStop();
        console.log('slewStop', response);
      } catch (error) {
        console.error('SlewAndCenter Error', error);
      } finally {
        this.isSlewing = false;
      }
    },
    async cameraRotate() {
      console.log('cameraRotate', this.rotationAngle);
      this.isRotating = true;
      try {
        await apiService.framingRotate(this.rotationAngle);
      } catch (error) {
        console.error('cameraRotate Error', error);
      } finally {
        this.isRotating = false;
      }
    },
  },
});
