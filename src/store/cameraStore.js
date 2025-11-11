import { defineStore } from 'pinia';
import { apiStore } from '@/store/store';
import { useFramingStore } from '@/store/framingStore';
import { useImagetStore } from './imageStore';
import { ref } from 'vue';
import { timeSync } from '@/utils/timeSync';
import { useSettingsStore } from './settingsStore';

export const useCameraStore = defineStore('cameraStore', () => {
  const framingStore = useFramingStore();
  const store = apiStore();
  const loading = ref(false);
  const isLoadingImage = ref(false);
  const loadingTimeout = ref(null);
  const isLooping = ref(false);
  const isAbort = ref(false);
  const showInfo = ref(false);
  const coolingTemp = ref(-10);
  const coolingTime = ref(10);
  const warmingTime = ref(10);
  const buttonCoolerOn = ref(false);
  const buttonWarmingOn = ref(false);
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

  // Helper function to wait briefly
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
    const targetName = settingsStore.camera.snapshotTargetName;

    try {
      // Phase 1: Start exposure (Server provides ExposureEndTime and IsExposing)
      await apiService.startCapture(exposureTime, gain, solve, true, save, targetName);
      isLoadingImage.value = true;
      while (!imageStore.isImageFetching) {
        await wait(500);
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
                plateSolveResult.value = resImageData?.Response?.PlateSolveResult || null;
                return;
              }
            }
          } catch (error) {
            console.error(' [cameraStore]Error fetching image:', error.message);
          }

          attempts++;
          //console.log(`[cameraStore] Waiting for image... Attempt ${attempts}/${maxAttempts}`);
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
    }
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
    coolingTemp,
    coolingTime,
    warmingTime,
    buttonCoolerOn,
    buttonWarmingOn,
    plateSolveError,
    plateSolveResult,
    exposureCountdown,
    exposureProgress,
    countdownRunning,
    binningMode,
    readoutMode,
    containerSize,
    slewModal,

    // Actions
    capturePhoto,
    getCameraRotation,
    abortExposure,
    updateCountdown,
    stopCountdown,
  };
});
