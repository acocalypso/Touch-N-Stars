import { defineStore } from 'pinia';
import apiService from '@/services/apiService';
import { useCameraStore } from '@/store/cameraStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';

export const apiStore = defineStore('store', {
  state: () => ({
    apiPort: null,
    intervalId: null,
    intervalIdGraph: null,
    profileInfo: [],
    cameraInfo: { IsExposing: false },
    mountInfo: [],
    filterInfo: [],
    focuserInfo: [],
    rotatorInfo: [],
    focuserAfInfo: {},
    afTimestampLastStart: null,
    afCurveData: [],
    guiderInfo: [],
    flatdeviceInfo: [],
    domeInfo: [],
    safetyInfo: {
      Connected: false,
      IsSafe: false,
    },
    switchInfo: [],
    weatherInfo: [],
    isBackendReachable: false,
    filterName: 'unbekannt',
    filterNr: null,
    showAfGraph: true,
    imageData: null,
    isLoadingImage: false,
    captureRunning: false,
    rotatorMechanicalPosition: 0,
    existingEquipmentList: [],
    coordinates: null,
    currentLanguage: 'en',
    showSettings: false,
    showStellarium: false,
    minimumApiVersion: '2.2.3.0',
    minimumTnsPluginVersion: '1.0.7.0',
    currentApiVersion: null,
    currentTnsPluginVersion: null,
    isApiVersionNewerOrEqual: false,
    isTnsPluginVersionNewerOrEqual: false,
    mount: {
      currentTab: 'showMount',
    },
    closeErrorModal: false,
    errorMessageShown: false,
  }),

  actions: {
    async fetchAllInfos(t) {
      const toastStore = useToastStore();

      if (!this.isBackendReachable) this.closeErrorModal = false;

      try {
        const tnsVersionResponse = await apiService.fetchTnsPluginVersion(); //Check if Plugin is reachable
        if (!tnsVersionResponse) {
          console.warn('TNS-Plugin not reachable');
          if (!this.errorMessageShown) {
            toastStore.showToast({
              type: 'error',
              title: t('app.connection_error_toast.title'),
              message: t('app.connection_error_toast.message_tns'),
            });
          } 
          this.clearAllStates();
          return;
        } else {  //Check the plugin version
            this.currentTnsPluginVersion = tnsVersionResponse.version;
            this.isTnsPluginVersionNewerOrEqual = this.checkVersionNewerOrEqual(
            this.currentTnsPluginVersion,
            this.minimumTnsPluginVersion
          );
          if (!this.isTnsPluginVersionNewerOrEqual) {
            console.warn('TNS version incompatible', this.currentTnsPluginVersion);
            if (!this.errorMessageShown) {
              toastStore.showToast({
                type: 'error',
                title: t('app.connection_error_toast.title'),
                message: t('app.connection_error_toast.message_tns_version'),
              });
            }
            this.clearAllStates();
            return;
          }
          console.log('Plugin ok');
        }

        if (!this.apiPort) { //fetch API Port
          const response = await apiService.fetchApiPort();
          if (!response) {
            console.error('API nicht erreichbar');
            if (!this.errorMessageShown) {
              toastStore.showToast({
                type: 'error',
                title: t('app.connection_error_toast.title'),
                message: t('app.connection_error_toast.message_api'),
              });
            }
            this.clearAllStates();
            return;
          }
          this.apiPort = response.data;
          console.log('api Port:', this.apiPort);
        }

        if (this.apiPort) { 
          const responseApoVersion = await apiService.fetchApiVersion();
          if (!responseApoVersion) {
            console.warn('API-Plugin not reachable');
            if (!this.errorMessageShown) {
              toastStore.showToast({
                type: 'error',
                title: t('app.connection_error_toast.title'),
                message: t('app.connection_error_toast.message_api'),
              });
            }
            this.clearAllStates();
            return;
          }
        } else {
          const apiVersionResponse = await apiService.fetchApiVersion();
          this.currentApiVersion = apiVersionResponse.Response;

          this.isApiVersionNewerOrEqual = this.checkVersionNewerOrEqual(
            this.currentApiVersion,
            this.minimumApiVersion
          );

          if (!this.isApiVersionNewerOrEqual) {
            console.warn('API version incompatible', this.currentApiVersion);
            if (!this.errorMessageShown) {
              toastStore.showToast({
                type: 'error',
                title: t('app.connection_error_toast.title'),
                message: t('app.connection_error_toast.message_api_version'),
              });
            }
            this.clearAllStates();
            return;
          }
        }
        console.log('API OK')

        //Wenn alles erreichbar
        this.isBackendReachable = true;

        const [
          imageHistoryResponse,
          cameraResponse,
          mountResponse,
          filterResponse,
          rotatorResponse,
          focuserResponse,
          focuserAfResponse,
          guiderResponse,
          flatdeviceResponse,
          domeResponse,
          safetyResponse,
          weatherResponse,
          switchResponse,
        ] = await Promise.all([
          apiService.imageHistoryAll(),
          apiService.cameraAction('info'),
          apiService.mountAction('info'),
          apiService.filterAction('info'),
          apiService.rotatorAction('info'),
          apiService.focusAction('info'),
          apiService.focuserAfAction('info'),
          apiService.guiderAction('info'),
          apiService.flatdeviceAction('info'),
          apiService.domeAction('info'),
          apiService.safetyAction('info'),
          apiService.weatherAction('info'),
          apiService.switchAction('info'),
        ]);

        this.handleApiResponses({
          imageHistoryResponse,
          cameraResponse,
          mountResponse,
          filterResponse,
          rotatorResponse,
          focuserResponse,
          focuserAfResponse,
          guiderResponse,
          flatdeviceResponse,
          domeResponse,
          safetyResponse,
          weatherResponse,
          switchResponse,
        });
      } catch (error) {
        console.error('Fehler beim Abrufen der Informationen:', error);
      }
      await this.fetchProfilInfos();
      //when the backend is accessible again close modal
      if (this.isBackendReachable && !this.closeErrorModal) {
        this.closeErrorModal = true;
        console.log('Backend ist reachable');
        toastStore.newMessage = false;
        this.errorMessageShown = false;
      }
    },

    clearAllStates() {
      this.isBackendReachable = false;
      this.errorMessageShown = true;
      this.apiPort = null;
      this.profileInfo = [];
      this.cameraInfo = [];
      this.mountInfo = [];
      this.filterInfo = [];
      this.focuserInfo = [];
      this.rotatorInfo = [];
      this.focuserAfInfo = [];
      this.guiderInfo = [];
      this.flatdeviceInfo = [];
      this.domeInfo = [];
      this.safetyInfo = [];
      this.switchInfo = [];
      this.weatherInfo = [];
      this.isLoadingImage = false;
      this.captureRunning = false;
      this.existingEquipmentList = [];
    },

    handleApiResponses({
      imageHistoryResponse,
      cameraResponse,
      mountResponse,
      filterResponse,
      rotatorResponse,
      focuserResponse,
      focuserAfResponse,
      guiderResponse,
      flatdeviceResponse,
      domeResponse,
      safetyResponse,
      weatherResponse,
      switchResponse,
    }) {
      if (imageHistoryResponse.Success) {
        this.imageHistoryInfo = imageHistoryResponse.Response;
      }

      if (cameraResponse.Success) {
        this.cameraInfo = cameraResponse.Response;
      } else {
        console.error('Fehler in der Kamera-API-Antwort:', cameraResponse.Error);
      }

      if (mountResponse.Success) {
        this.mountInfo = mountResponse.Response;
      } else {
        console.error('Fehler in der Mount-API-Antwort:', mountResponse.Error);
      }

      if (filterResponse.Success) {
        this.filterInfo = filterResponse.Response;
      } else {
        console.error('Fehler in der Filter-API-Antwort:', filterResponse.Error);
      }

      if (rotatorResponse.Success) {
        this.rotatorInfo = rotatorResponse.Response;
      } else {
        console.error('Fehler in der Rotator-API-Antwort:', rotatorResponse.Error);
      }

      if (focuserResponse.Success) {
        this.focuserInfo = focuserResponse.Response;
      } else {
        console.error('Fehler in der Focuser-API-Antwort:', focuserResponse.Error);
      }

      if (focuserAfResponse.Success) {
        this.focuserAfInfo = focuserAfResponse;
      } else {
        console.error('Fehler in der Focuser-AF-API-Antwort:', focuserAfResponse.Error);
      }

      if (safetyResponse.Success) {
        this.safetyInfo = safetyResponse.Response;
      } else {
        console.error('Fehler in der Safety-API-Antwort:', safetyResponse.Error);
      }

      if (guiderResponse.Success) {
        this.guiderInfo = guiderResponse.Response;
      } else {
        console.error('Fehler in der Guider-API-Antwort:', guiderResponse.Error);
      }

      if (flatdeviceResponse.Success) {
        this.flatdeviceInfo = flatdeviceResponse.Response;
      } else {
        console.error('Fehler in der Flat-API-Antwort:', flatdeviceResponse.Error);
      }

      if (domeResponse.Success) {
        this.domeInfo = domeResponse.Response;
      } else {
        console.error('Fehler in der Flat-API-Antwort:', domeResponse.Error);
      }

      if (weatherResponse.Success) {
        this.weatherInfo = weatherResponse.Response;
      } else {
        console.error('Fehler in der Weather-API-Antwort:', weatherResponse.Error);
      }

      if (switchResponse.Success) {
        this.switchInfo = switchResponse.Response;
      } else {
        console.error('Fehler in der Switch-API-Antwort:', switchResponse.Error);
      }
    },

    startFetchingInfo(t) {
      if (!this.intervalId) {
        this.intervalId = setInterval(() => this.fetchAllInfos(t), 2000);
      }
    },

    stopFetchingInfo() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    async getGuiderInfo() {
      try {
        const response = await apiService.guiderAction('info');
        if (response.Success) {
          this.guiderInfo = response.Response;
        }
      } catch (error) {
        console.error('Error fetching guider info:', error);
      }
    },

    async fetchProfilInfos() {
      try {
        const profileInfoResponse = await apiService.profileAction('show?active=true');

        if (profileInfoResponse && profileInfoResponse.Response) {
          this.profileInfo = profileInfoResponse.Response;
          this.getExistingEquipment(this.profileInfo);
        } else {
          console.error('Fehler in der Profil-API-Antwort:', profileInfoResponse?.Error);
        }
      } catch (error) {
        console.error('Fehler beim Abrufen der Profilinformationen:', error);
      }
    },

    getExistingEquipment(activeProfile) {
      this.existingEquipmentList = [];
      const apiMapping = {
        CameraSettings: 'camera',
        DomeSettings: 'dome',
        FilterWheelSettings: 'filter',
        FocuserSettings: 'focuser',
        SwitchSettings: 'switch',
        TelescopeSettings: 'mount',
        SafetyMonitorSettings: 'safety',
        FlatDeviceSettings: 'flatdevice',
        RotatorSettings: 'rotator',
        WeatherDataSettings: 'weather',
        GuiderSettings: 'guider',
      };
      const keysToCheck = Object.keys(apiMapping);

      keysToCheck.forEach((key) => {
        if (activeProfile && activeProfile[key]) {
          const device = activeProfile[key];

          if (key === 'GuiderSettings') {
            if (device.GuiderName && device.GuiderName !== 'No_Guider') {
              this.existingEquipmentList.push({
                type: key,
                id: device.GuiderName,
                apiName: apiMapping[key],
              });
            }
          } else if (device.Id && device.Id !== 'No_Device') {
            this.existingEquipmentList.push({
              type: key,
              id: device.Id,
              apiName: apiMapping[key],
            });
          }
        }
      });
    },

    setDefaultCameraSettings() {
      const cStore = useCameraStore();
      const cameraSettings = this.profileInfo?.CameraSettings || {};
      cStore.coolingTemp = cameraSettings.Temperature ?? -10;
      cStore.coolingTime = cameraSettings.CoolingDuration ?? 10;
      cStore.warmingTime = cameraSettings.WarmingDuration ?? 10;
      console.log(
        'Kameraeinstellungen gesetzt:',
        cStore.coolingTemp,
        cStore.coolingTime,
        cStore.warmingTime
      );
    },
    setDefaultRotatorSettings() {
      this.rotatorMechanicalPosition = this.rotatorInfo?.MechanicalPosition ?? 0;
      console.log('Rotatoreinstellung gesetzt:', this.rotatorMechanicalPosition);
    },
    setDefaultCoordinates() {
      const cStore = useSettingsStore();
      cStore.coordinates.longitude = this.profileInfo.AstrometrySettings.Longitude;
      cStore.coordinates.latitude = this.profileInfo.AstrometrySettings.Latitude;
      cStore.coordinates.altitude = this.profileInfo.AstrometrySettings.Elevation;
    },
    checkVersionNewerOrEqual(currentVersion, minimumVersion) {
      const parseVersion = (version) => version.split('.').map(Number);

      //console.log('current', currentVersion, 'minimum', minimumVersion);

      const currentParts = parseVersion(currentVersion);
      const minimumParts = parseVersion(minimumVersion);

      for (let i = 0; i < minimumParts.length; i++) {
        const current = currentParts[i] || 0;
        const minimum = minimumParts[i] || 0;

        if (current > minimum) {
          this.isVersionNewerOrEqual = true;
          return true;
        }
        if (current < minimum) {
          this.isVersionNewerOrEqual = false;
          return false;
        }
      }
      this.isVersionNewerOrEqual = true;
      return true;
    },
  },
});
