import { defineStore } from 'pinia';

export const useTenMicronStore = defineStore('tenMicronStore', {
  state: () => ({
    // Plugin / connection
    pluginLoaded: false,
    connected: false,
    buildInProgress: false,
    dualAxisTrackingEnabled: false,
    refractionCorrectionEnabled: false,
    unattendedFlipEnabled: false,

    // Mount info (static once connected)
    mountProductName: '',
    mountFirmwareVersion: '',
    mountFirmwareTimestamp: '',
    mountIPAddress: '',
    mountMACAddress: '',

    // Mount live status
    mountStatus: '',
    gpsSyncState: 'Unknown',
    trackingRateArcsecPerSec: 0,
    slewSettleTimeSeconds: 0,
    meridianLimitDegrees: 0,
    refractionTemperature: 0,
    refractionPressure: 0,
    slewRate: null,
    slewRateMin: null,
    slewRateMax: null,
    horizonLimitHigh: null,
    horizonLimitLow: null,
    connectionType: '',
    deltaTValid: false,
    deltaTExpiration: null,

    // Builder
    goldenSpiralStarCount: 30,
    modelPoints: [],
    builderOptions: {
      minPointAltitude: 0,
      maxPointAltitude: 90,
      minPointAzimuth: 0.5,
      maxPointAzimuth: 359.5,
      maxPointRMS: 0,
      showRemovedPoints: true,
      minimizeMeridianFlips: true,
      builderNumRetries: 0,
      maxFailedPoints: 0,
      removeHighRMSAfterBuild: false,
      logCommands: false,
      maxConcurrency: 3,
      allowBlindSolves: false,
      optimizeDome: true,
      westToEast: false,
      plateSolveSubframe: 1.0,
      alternateDirection: true,
      disableRefractionCorrection: false,
      decJitter: 1.0,
      disableDAT: false,
    },

    // Alignment model
    modelLoaded: false,
    alignmentModel: {
      alignmentStarCount: 0,
      rmsError: 0,
      rightAscensionAltitude: 0,
      rightAscensionAzimuth: 0,
      polarAlignErrorDegrees: 0,
      paErrorAltitudeDegrees: 0,
      paErrorAzimuthDegrees: 0,
      rightAscensionPolarPositionAngleDegrees: 0,
      orthogonalityErrorDegrees: 0,
      azimuthAdjustmentTurns: 0,
      altitudeAdjustmentTurns: 0,
      modelTerms: 0,
      alignmentStars: [],
    },

    // Model library
    modelNames: [],

    // UI
    activeTab: 'builder',
    isLoading: false,
    isRefreshing: false,
    lastError: null,
    pollingInterval: null,
  }),

  actions: {
    setStatus(data) {
      this.pluginLoaded = data.PluginLoaded ?? false;
      this.connected = data.Connected ?? false;
      this.buildInProgress = data.BuildInProgress ?? false;
      this.dualAxisTrackingEnabled = data.DualAxisTrackingEnabled ?? this.dualAxisTrackingEnabled;
      this.refractionCorrectionEnabled =
        data.RefractionCorrectionEnabled ?? this.refractionCorrectionEnabled;
      this.unattendedFlipEnabled = data.UnattendedFlipEnabled ?? this.unattendedFlipEnabled;
      if (data.ProductName) this.mountProductName = data.ProductName;
      if (data.FirmwareVersion) this.mountFirmwareVersion = data.FirmwareVersion;
      if (data.FirmwareTimestamp) this.mountFirmwareTimestamp = data.FirmwareTimestamp;
      if (data.IPAddress) this.mountIPAddress = data.IPAddress;
      if (data.MACAddress) this.mountMACAddress = data.MACAddress;
      if (data.MountStatus) this.mountStatus = data.MountStatus;
      if (data.GpsSyncState !== undefined) this.gpsSyncState = data.GpsSyncState;
      if (data.TrackingRateArcsecPerSec !== undefined)
        this.trackingRateArcsecPerSec = data.TrackingRateArcsecPerSec;
      if (data.SlewSettleTimeSeconds !== undefined)
        this.slewSettleTimeSeconds = data.SlewSettleTimeSeconds;
      if (data.MeridianLimitDegrees !== undefined)
        this.meridianLimitDegrees = data.MeridianLimitDegrees;
      if (data.RefractionTemperature !== undefined)
        this.refractionTemperature = data.RefractionTemperature;
      if (data.RefractionPressure !== undefined) this.refractionPressure = data.RefractionPressure;
      if (data.SlewRate !== undefined && data.SlewRate !== null) this.slewRate = data.SlewRate;
      if (data.SlewRateMin !== undefined && data.SlewRateMin !== null)
        this.slewRateMin = data.SlewRateMin;
      if (data.SlewRateMax !== undefined && data.SlewRateMax !== null)
        this.slewRateMax = data.SlewRateMax;
      if (data.HorizonLimitHigh !== undefined && data.HorizonLimitHigh !== null)
        this.horizonLimitHigh = data.HorizonLimitHigh;
      if (data.HorizonLimitLow !== undefined && data.HorizonLimitLow !== null)
        this.horizonLimitLow = data.HorizonLimitLow;
      if (data.ConnectionType !== undefined) this.connectionType = data.ConnectionType;
      if (data.DeltaTValid !== undefined) this.deltaTValid = data.DeltaTValid;
      if (data.DeltaTExpiration !== undefined && data.DeltaTExpiration !== null)
        this.deltaTExpiration = data.DeltaTExpiration;
    },

    setBuilderStatus(data) {
      this.pluginLoaded = data.PluginLoaded ?? this.pluginLoaded;
      this.connected = data.Connected ?? this.connected;
      this.buildInProgress = data.BuildInProgress ?? false;
      this.goldenSpiralStarCount = data.GoldenSpiralStarCount ?? 30;
      this.modelPoints = data.ModelPoints ?? [];
    },

    setAlignmentModel(data) {
      this.modelLoaded = data.ModelLoaded ?? false;
      if (data.ModelLoaded) {
        this.alignmentModel = {
          alignmentStarCount: data.AlignmentStarCount ?? 0,
          rmsError: data.RMSError ?? 0,
          rightAscensionAltitude: data.RightAscensionAltitude ?? 0,
          rightAscensionAzimuth: data.RightAscensionAzimuth ?? 0,
          polarAlignErrorDegrees: data.PolarAlignErrorDegrees ?? 0,
          paErrorAltitudeDegrees: data.PAErrorAltitudeDegrees ?? 0,
          paErrorAzimuthDegrees: data.PAErrorAzimuthDegrees ?? 0,
          rightAscensionPolarPositionAngleDegrees:
            data.RightAscensionPolarPositionAngleDegrees ?? 0,
          orthogonalityErrorDegrees: data.OrthogonalityErrorDegrees ?? 0,
          azimuthAdjustmentTurns: data.AzimuthAdjustmentTurns ?? 0,
          altitudeAdjustmentTurns: data.AltitudeAdjustmentTurns ?? 0,
          modelTerms: data.ModelTerms ?? 0,
          alignmentStars: data.AlignmentStars ?? [],
        };
      }
    },

    setModelNames(names) {
      this.modelNames = names ?? [];
    },

    setBuilderOptions(data) {
      if (!data) return;
      if (data.MinPointAltitude !== undefined)
        this.builderOptions.minPointAltitude = data.MinPointAltitude;
      if (data.MaxPointAltitude !== undefined)
        this.builderOptions.maxPointAltitude = data.MaxPointAltitude;
      if (data.MinPointAzimuth !== undefined)
        this.builderOptions.minPointAzimuth = data.MinPointAzimuth;
      if (data.MaxPointAzimuth !== undefined)
        this.builderOptions.maxPointAzimuth = data.MaxPointAzimuth;
      if (data.MaxPointRMS !== undefined)
        this.builderOptions.maxPointRMS = isNaN(data.MaxPointRMS) ? 0 : data.MaxPointRMS;
      if (data.ShowRemovedPoints !== undefined)
        this.builderOptions.showRemovedPoints = data.ShowRemovedPoints;
      if (data.MinimizeMeridianFlips !== undefined)
        this.builderOptions.minimizeMeridianFlips = data.MinimizeMeridianFlips;
      if (data.BuilderNumRetries !== undefined)
        this.builderOptions.builderNumRetries = data.BuilderNumRetries;
      if (data.MaxFailedPoints !== undefined)
        this.builderOptions.maxFailedPoints = data.MaxFailedPoints;
      if (data.RemoveHighRMSAfterBuild !== undefined)
        this.builderOptions.removeHighRMSAfterBuild = data.RemoveHighRMSAfterBuild;
      if (data.LogCommands !== undefined) this.builderOptions.logCommands = data.LogCommands;
      if (data.MaxConcurrency !== undefined)
        this.builderOptions.maxConcurrency = data.MaxConcurrency;
      if (data.AllowBlindSolves !== undefined)
        this.builderOptions.allowBlindSolves = data.AllowBlindSolves;
      if (data.OptimizeDome !== undefined) this.builderOptions.optimizeDome = data.OptimizeDome;
      if (data.WestToEast !== undefined) this.builderOptions.westToEast = data.WestToEast;
      if (data.PlateSolveSubframe !== undefined)
        this.builderOptions.plateSolveSubframe = data.PlateSolveSubframe;
      if (data.AlternateDirection !== undefined)
        this.builderOptions.alternateDirection = data.AlternateDirection;
      if (data.DisableRefractionCorrection !== undefined)
        this.builderOptions.disableRefractionCorrection = data.DisableRefractionCorrection;
      if (data.DecJitter !== undefined) this.builderOptions.decJitter = data.DecJitter;
      if (data.DisableDAT !== undefined) this.builderOptions.disableDAT = data.DisableDAT;
    },

    clearError() {
      this.lastError = null;
    },
  },
});
