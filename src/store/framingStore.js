import { defineStore } from 'pinia';
import apiService from '@/services/apiService';

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
    ALTangle: 0,
    AZangle: 0,
    ALTangleString: '',
    AZangleString: '',
    useNinaCache: true,
    fov: 5,
    camWidth: 100,
    camHeight: 100,
    containerSize: 500,
    rotationAngle: 0,
    showFramingModal: false,
    cameraX: 0, // Kamera-Position X (absolut in Pixeln)
    cameraY: 0, // Kamera-Position Y (absolut in Pixeln)
    cameraRelativeX: 0.5, // Kamera-Position relativ zum Container (0-1)
    cameraRelativeY: 0.5, // Kamera-Position relativ zum Container (0-1)
    initialFovSet: false, // Flag um zu verhindern, dass FOV mehrfach angepasst wird
    isSlewing: false,
    isSlewingAndCentering: false,
    isRotating: false,
    width: 200,
    height: 200,
    slewIsStopt: false,
    slewAbortController: null,
  }),
  actions: {
    async slew(RAangle, DECangle) {
      this.slewIsStopt = false;
      console.log('SlewAndCenter', RAangle, DECangle);
      this.isSlewing = true;
      try {
        const response = await apiService.slewAndCenter(RAangle, DECangle, false);
        console.log('SlewAndCenter', response);
        if (!response.Success) return;
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
      this.slewIsStopt = false;
      console.log('SlewAndCenterRotate', RAangle, DECangle);

      // Abort any existing slew operation
      if (this.slewAbortController) {
        console.log('Aborting previous slew operation');
        this.slewAbortController.abort();
      }

      // Create new abort controller for this operation
      this.slewAbortController = new AbortController();
      this.isSlewingAndCentering = true;

      try {
        await apiService.slewAndCenter(
          RAangle,
          DECangle,
          center,
          rotate,
          this.rotationAngle,
          this.slewAbortController.signal
        );
      } catch (error) {
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          console.log('SlewAndCenter was cancelled');
        } else {
          console.error('SlewAndCenter Error', error);
        }
      } finally {
        this.isSlewingAndCentering = false;
        this.slewAbortController = null;
      }
    },

    cancelSlewAndCenter() {
      console.log('cancelSlewAndCenter called');
      if (this.slewAbortController) {
        this.slewAbortController.abort();
        this.slewAbortController = null;
      }
      this.isSlewingAndCentering = false;
      this.slewIsStopt = false;
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
