import { defineStore } from 'pinia';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useImagetStore } from './imageStore';
import { ref, computed, watch, nextTick } from 'vue';
import { timeSync } from '@/utils/timeSync';
import { useSettingsStore } from './settingsStore';
import { useMountStore } from './mountStore';
import apiService from '@/services/apiService';

export const useCameraStore = defineStore('cameraStore', () => {
  const framingStore = useFramingStore();
  const store = apiStore();
  const loading = ref(false);
  const isLoadingImage = ref(false);
  const loadingTimeout = ref(null);
  const isLooping = ref(false);
  const isAbort = ref(false);
  const showInfo = ref(false);
  const plateSolveError = ref(false);
  const plateSolveResult = ref('');
  const exposureCountdown = ref(0);
  const exposureProgress = ref(0);
  const countdownRunning = ref(false);
  const binningMode = ref('1x1');
  const readoutMode = ref(0);
  const containerSize = ref(100);
  const slewModal = ref(false);
  const showCameraInfo = ref(false); // eslint-disable-line no-unused-vars
  let countdownSessionId = 0; // Unique ID for each countdown session
  const cameraSettings = ref();

  // Helper function to wait briefly
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  //Read Camera settings (only PINS)
  async function readSettings() {
    if (!store.isPINS) return;
    if (!store.cameraInfo.Connected) return;
    try {
      const response = await apiService.cameraAction('get-settings');
      cameraSettings.value = response.Response;
      console.log('[Camerastore] Camera settings: ', response.Response);
    } catch (error) {
      console.error(' [cameraStore]Error fetching camera settings:', error.message);
    }
  }

  // --- Cooler state (single source of truth) -------------------------------

  // Optimistic intent right after a button press, cleared when the next
  // poll confirms the server state or after ~3 poll cycles (2s poll).
  const coolingPending = ref(null); // 'cooling' | 'warming' | 'cancel' | null
  let coolingPendingTimer = null;
  const COOLING_PENDING_MS = 6000;

  function setCoolingPending(kind) {
    coolingPending.value = kind;
    clearTimeout(coolingPendingTimer);
    if (kind) {
      coolingPendingTimer = setTimeout(() => {
        coolingPending.value = null;
      }, COOLING_PENDING_MS);
    }
  }

  // Latched direction of the running ramp. TargetTemp cannot be used here:
  // it always holds the cool-down target (e.g. -10°C) even while a warm-up
  // ramp runs towards ambient. The moving TemperatureSetPoint is the
  // reliable signal instead - NINA steps it towards the ramp destination.
  const rampDirection = ref(null); // 'cooling' | 'warming' | null

  // Instant guess from the current setpoint position: while a ramp runs the
  // setpoint leads the camera temperature in the ramp direction.
  function inferRampDirection() {
    const info = store.cameraInfo;
    if (info.TemperatureSetPoint == null || info.Temperature == null) return null;
    if (info.TemperatureSetPoint < info.Temperature) return 'cooling';
    if (info.TemperatureSetPoint > info.Temperature) return 'warming';
    return null;
  }

  // Is a temperature ramp running?
  // PINS / newer ninaAPI report the real NINA state via TempChangeRunning.
  // Heuristic fallback limits: a cooler manually switched on far from target
  // reads as "running"; a slow final approach (<1°C) reads as "holding".
  const isRampRunning = computed(() => {
    const info = store.cameraInfo;
    if (!info.Connected || !info.CoolerOn) return false;
    if (typeof info.TempChangeRunning === 'boolean') return info.TempChangeRunning;
    if (info.AtTargetTemp) return false;
    const target = info.TargetTemp ?? info.TemperatureSetPoint;
    if (target == null || info.Temperature == null) return false;
    return Math.abs(info.Temperature - target) > 1; // 1°C threshold
  });

  // 'off' | 'cooling' | 'warming' | 'holding'
  const coolingState = computed(() => {
    const info = store.cameraInfo;
    if (!info.Connected || !info.CanSetTemperature) return 'off';
    if (coolingPending.value === 'cooling') return 'cooling';
    if (coolingPending.value === 'warming') return 'warming';
    if (!info.CoolerOn) return 'off';
    if (coolingPending.value === 'cancel') return 'holding';
    if (isRampRunning.value) return rampDirection.value ?? inferRampDirection() ?? 'cooling';
    return 'holding';
  });

  // Clear the optimistic flag as soon as the poll confirms it, and manage
  // the direction latch over the ramp lifecycle.
  watch(isRampRunning, (running) => {
    if (running) {
      if (['cooling', 'warming'].includes(coolingPending.value)) setCoolingPending(null);
      if (!rampDirection.value) rampDirection.value = inferRampDirection();
    } else {
      rampDirection.value = null;
      if (coolingPending.value === 'cancel') setCoolingPending(null);
    }
  });

  // The setpoint trend is the authoritative direction signal for ramps
  // started outside of TNS (NINA UI, sequence): warming ramps step the
  // setpoint up, cooling ramps step it down.
  watch(
    () => store.cameraInfo.TemperatureSetPoint,
    (next, prev) => {
      if (!isRampRunning.value || next == null || prev == null) return;
      if (next > prev) rampDirection.value = 'warming';
      else if (next < prev) rampDirection.value = 'cooling';
    }
  );

  async function startCooling(temperature, minutes) {
    await apiService.stopCameraWarming();
    await apiService.startCameraCooling(temperature, minutes ?? 10);
    rampDirection.value = 'cooling';
    setCoolingPending('cooling');
  }

  async function startWarming(minutes) {
    await apiService.stopCameraCooling();
    await apiService.startCameraWarming(minutes ?? 10);
    rampDirection.value = 'warming';
    setCoolingPending('warming');
  }

  async function cancelTempChange() {
    // cancel=true on an idle ramp is a no-op, so cancel both to stay correct
    // even if the derived direction is momentarily wrong.
    await apiService.stopCameraCooling();
    await apiService.stopCameraWarming();
    setCoolingPending('cancel');
  }

  // Start capture + image fetch
  async function capturePhoto(apiService, exposureTime, gain, solve = false) {
    if (exposureTime <= 0) {
      exposureTime = 2; // Default value
      return;
    }

    loading.value = true;
    isLoadingImage.value = false;
    isAbort.value = false;
    plateSolveResult.value = null;
    const save = store.profileInfo.SnapShotControlSettings.Save;
    const imageStore = useImagetStore();
    const settingsStore = useSettingsStore();
    const mountSotre = useMountStore();
    const targetName = settingsStore.camera.snapshotTargetName;

    try {
      // Phase 1: Start exposure (Server provides ExposureEndTime and IsExposing)
      await apiService.startCapture(exposureTime, gain, solve, true, save, targetName);
      isLoadingImage.value = true;
      // This wait has no timeout, so it must honor aborts: resetCaptureState()
      // (backend teardown) and abortExposure() set isAbort while we may be
      // stuck here waiting for an exposure that will never report back.
      while (!imageStore.isImageFetching) {
        if (isAbort.value) return;
        await wait(100);
        //console.log('[cameraStore] Waiting for exposure to complete...');
      }

      // Phase 2: Load image with timeout
      if (!isAbort.value) {
        console.log('[cameraStore] Starting to load image data from API...');

        // Wait for image or timeout
        let attempts = 0;
        const maxAttempts = 60;
        const previousImage = imageStore.imageData;

        while (attempts < maxAttempts && !isAbort.value) {
          try {
            const resImageData = await apiService.getImageData();

            // Check if new image is available
            if (previousImage !== imageStore.imageData) {
              console.log('[cameraStore] Image data received from API.');

              if (solve === false) {
                return;
              }

              if (resImageData.Response !== 'Capture already in progress') {
                //save plate solve result
                plateSolveResult.value = resImageData?.Response?.PlateSolveResult || null;
                console.log('[cameraStore] PlateSolveResult:', plateSolveResult.value);
                //if solve to mount is enabled, sync coordinates
                if (plateSolveResult.value && settingsStore.camera.useSyncSolveToMount) {
                  await mountSotre.syncCoordinates(
                    plateSolveResult.value.Coordinates.RADegrees,
                    plateSolveResult.value.Coordinates.Dec
                  );
                }
                return;
              }
            }
          } catch (error) {
            console.error(' [cameraStore]Error fetching image:', error.message);
          }

          attempts++;
          //console.debug(`[cameraStore] Waiting for image... Attempt ${attempts}/${maxAttempts}`);
          await wait(1000);
        }

        try {
          console.log('[cameraStore] Image successfully loaded');
        } catch (error) {
          console.error('[cameraStore] Image loading failed:', error.message);
          if (!isAbort.value) {
            alert('Image was not provided in time');
          }
        } finally {
          // Clear timeout
          if (loadingTimeout.value) {
            clearTimeout(loadingTimeout.value);
            loadingTimeout.value = null;
          }
        }
      }
    } catch (error) {
      console.error('[cameraStore] Error during capture:', error.message);
    } finally {
      loading.value = false;
      isLoadingImage.value = false;
      await nextTick(); // Force DOM update for Safari

      // Continuous loop?
      if (isLooping.value && !isAbort.value) {
        console.log('[cameraStore] Starting next looped exposure...');
        capturePhoto(apiService, exposureTime, gain, solve, false, save);
        console.log('[cameraStore] save value in loop: ', save);
      }
    }
  }

  /**
   * Aborts the exposure
   */
  async function abortExposure(apiService) {
    try {
      console.log('[cameraStore] Canceling exposure...');
      await apiService.cameraAction('abort-exposure');

      isAbort.value = true;
      isLoadingImage.value = false;
      await nextTick(); // Force DOM update for Safari
      isLooping.value = false;

      // Clear timeout if running
      if (loadingTimeout.value) {
        clearTimeout(loadingTimeout.value);
        loadingTimeout.value = null;
      }

      console.log('E[cameraStore] xposure successfully aborted.');
    } catch (error) {
      console.error('[cameraStore] Error aborting exposure:', error);
    } finally {
      loading.value = false;
    }
  }

  async function getCameraRotation(apiService, exposureTime = 2, gain) {
    loading.value = true;
    isLoadingImage.value = true;
    plateSolveError.value = false;

    try {
      // Start capture via API
      let result; // Variable declaration for result
      let plateSolveResult = null;
      let plateSolveStatusCode = 0;
      isLoadingImage.value = true;
      result = await apiService.getPlatesovle(exposureTime, gain);
      console.log('[cameraStore] result platesolve: ', result);

      plateSolveResult = result?.Response?.PlateSolveResult;
      plateSolveStatusCode = result?.StatusCode;
      if (plateSolveStatusCode != 200) {
        plateSolveError.value = true;
        console.log('[cameraStore] plateSolveError: ', plateSolveStatusCode, plateSolveError.value);
      }
      if (plateSolveResult) {
        framingStore.rotationAngle = plateSolveResult.PositionAngle;
        console.log('[cameraStore] Camera position angle: ', framingStore.rotationAngle);
      }
    } catch (error) {
      console.error('[cameraStore] Error during capture:', error.message);
    } finally {
      loading.value = false;
      isLoadingImage.value = false;
      await nextTick(); // Force DOM update for Safari
    }
  }

  // Tear down all client-driven capture activity. Called from
  // apiStore.clearAllStates() when the backend session ends (instance switch,
  // connection lost): without this, a running snapshot loop survives the
  // teardown and starts commanding whatever backend connects next, and the
  // wait loops in capturePhoto() can hang forever. Backend-derived settings
  // (cameraSettings, binning/readout indices) are dropped too - they belong
  // to the previous instance's camera.
  function resetCaptureState() {
    isLooping.value = false;
    // Releases capturePhoto()'s wait loops; every new capture resets it.
    isAbort.value = true;
    stopCountdown();
    exposureCountdown.value = 0;
    exposureProgress.value = 0;
    loading.value = false;
    isLoadingImage.value = false;
    cameraSettings.value = undefined;
    binningMode.value = '1x1';
    readoutMode.value = 0;
    setCoolingPending(null);
    rampDirection.value = null;
  }

  // Stop countdown (e.g. when app is paused)
  function stopCountdown() {
    if (countdownRunning.value) {
      console.log('[cameraStore] Stopping exposure countdown...');
      countdownRunning.value = false;
    }
  }

  // Countdown for status display with server time synchronization
  async function updateCountdown() {
    const exposureEndTime = store.cameraInfo.ExposureEndTime;

    if (!exposureEndTime) {
      exposureCountdown.value = 0;
      exposureProgress.value = 0;
      return;
    }

    // Create new session ID for this countdown instance
    const currentSessionId = ++countdownSessionId;

    // Stop all existing countdown loops immediately
    countdownRunning.value = false;

    // Wait briefly to ensure running loops are definitely terminated
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Ensure time synchronization before starting countdown
    await timeSync.ensureSync();

    const endTime = new Date(exposureEndTime).getTime();
    if (isNaN(endTime)) {
      console.error('[cameraStore] Invalid date format for ExposureEndTime.');
      exposureCountdown.value = 0;
      exposureProgress.value = 0;
      return;
    }

    // Reset progress to 0 at the start
    exposureProgress.value = 0;

    // Start the new countdown
    countdownRunning.value = true;

    // Store initial countdown value to calculate the total duration
    let initialCountdown = null;

    // Watchdog: Track previous countdown value to detect stuck timer
    let previousCountdown = null;
    let stuckCounter = 0;
    const maxStuckIterations = 3; // Restart after 3 seconds of no change

    while (countdownRunning.value && currentSessionId === countdownSessionId) {
      // Use server-synchronized time for an accurate countdown
      const remainingTime = timeSync.calculateCountdown(exposureEndTime);

      if (remainingTime <= 0 || !store.cameraInfo.IsExposing) {
        exposureProgress.value = 100;
        exposureCountdown.value = 0;
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        exposureProgress.value = 0;
        countdownRunning.value = false;
        break;
      }

      // Watchdog: Check if the countdown value changed
      if (previousCountdown !== null && previousCountdown === remainingTime) {
        stuckCounter++;
        console.warn(
          `[cameraStore] Watchdog Countdown stuck at ${remainingTime}s (${stuckCounter}/${maxStuckIterations})`
        );

        if (stuckCounter >= maxStuckIterations) {
          console.error(
            '[cameraStore] Watchdog Countdown stuck for too long, restarting countdown with time resynchronization...'
          );
          // Force time resynchronization
          await timeSync.ensureSync();
          stuckCounter = 0;
          previousCountdown = null;
          initialCountdown = null;
          continue; // Continue with a fresh calculation
        }
      } else {
        // Countdown is progressing normally, reset stuck counter
        stuckCounter = 0;
      }

      previousCountdown = remainingTime;
      exposureCountdown.value = remainingTime;

      // Set initial countdown on the first iteration
      if (initialCountdown === null) {
        initialCountdown = remainingTime;
      }

      // Calculate progress based on countdown: 0% when countdown = initial, 100% when countdown = 0
      if (initialCountdown > 0) {
        const elapsedTime = initialCountdown - remainingTime;
        exposureProgress.value = Math.max(0, Math.min(100, (elapsedTime / initialCountdown) * 100));
      } else {
        exposureProgress.value = 0;
      }

      // Re-synchronize periodically during long exposures
      if (remainingTime % 30 === 0) {
        timeSync.ensureSync();
      }

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    }
  }

  return {
    loading,
    isLoadingImage,
    isLooping,
    isAbort,
    showInfo,
    coolingPending,
    rampDirection,
    isRampRunning,
    coolingState,
    plateSolveError,
    plateSolveResult,
    exposureCountdown,
    exposureProgress,
    countdownRunning,
    binningMode,
    readoutMode,
    containerSize,
    slewModal,
    cameraSettings,

    // Actions
    capturePhoto,
    getCameraRotation,
    abortExposure,
    updateCountdown,
    stopCountdown,
    resetCaptureState,
    readSettings,
    startCooling,
    startWarming,
    cancelTempChange,
  };
});
