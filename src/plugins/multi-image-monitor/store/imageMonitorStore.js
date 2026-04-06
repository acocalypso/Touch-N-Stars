import { defineStore } from 'pinia';

// Intervals stored outside reactive state to avoid Pinia proxy side-effects
const intervals = new Map();
const pausedCameras = new Set();
let visibilityListenerAdded = false;

export const useImageMonitorStore = defineStore('imageMonitorStore', {
  state: () => ({
    cameras: [],
    status: {},
  }),

  getters: {
    getCameraById: (state) => (id) => state.cameras.find((c) => c.id === id),
    getCameraStatus: (state) => (id) =>
      state.status[id] || {
        isConnected: false,
        lastUpdate: null,
        errorMessage: null,
        currentImageUrl: null,
        displayUrl: null,
      },
  },

  actions: {
    addCamera(cameraData) {
      const id = Date.now().toString();
      const newCamera = {
        id,
        name: cameraData.name || 'New Camera',
        url: cameraData.url || '',
        interval: cameraData.interval || 60000,
        icon: cameraData.icon || 'camera',
        autoRefresh: cameraData.autoRefresh !== undefined ? cameraData.autoRefresh : false,
        quality: cameraData.quality || 'medium',
        width: cameraData.width || 640,
        height: cameraData.height || 480,
        useCacheBuster: cameraData.useCacheBuster !== undefined ? cameraData.useCacheBuster : true,
        useProxy: cameraData.useProxy !== undefined ? cameraData.useProxy : true,
      };
      this.cameras.push(newCamera);
      this.initCameraStatus(id);
      this.saveToLocalStorage();
      if (newCamera.autoRefresh) {
        this.startAutoRefresh(id);
      }
      return id;
    },

    updateCamera(id, updates) {
      const index = this.cameras.findIndex((c) => c.id === id);
      if (index !== -1) {
        const wasAutoRefresh = this.cameras[index].autoRefresh;
        const hadInterval = this.cameras[index].interval;
        this.cameras[index] = { ...this.cameras[index], ...updates };
        this.saveToLocalStorage();
        const cam = this.cameras[index];
        if (cam.autoRefresh && !wasAutoRefresh) {
          this.startAutoRefresh(id);
        } else if (!cam.autoRefresh && wasAutoRefresh) {
          this.stopAutoRefresh(id);
        } else if (cam.autoRefresh && updates.interval && updates.interval !== hadInterval) {
          this.startAutoRefresh(id);
        }
      }
    },

    removeCamera(id) {
      this.stopAutoRefresh(id);
      this.cameras = this.cameras.filter((c) => c.id !== id);
      delete this.status[id];
      this.saveToLocalStorage();
    },

    reorderCameras(newOrder) {
      this.cameras = newOrder;
      this.saveToLocalStorage();
    },

    initCameraStatus(id) {
      if (!this.status[id]) {
        // Replace the whole object so Vue detects the new key reactively
        this.status = {
          ...this.status,
          [id]: {
            isConnected: false,
            lastUpdate: null,
            errorMessage: null,
            currentImageUrl: null,
            displayUrl: null,
          },
        };
      }
    },

    setDisplayUrl(id, url) {
      this.status = {
        ...this.status,
        [id]: {
          ...(this.status[id] || {}),
          displayUrl: url,
        },
      };
    },

    buildUrl(camera) {
      const rawUrl = camera.url;
      const separator = rawUrl.includes('?') ? '&' : '?';
      const timedUrl = camera.useCacheBuster ? `${rawUrl}${separator}t=${Date.now()}` : rawUrl;
      if (camera.useProxy !== false) {
        const proxyBase = `${window.location.protocol}//${window.location.host}/api/proxy`;
        return `${proxyBase}?url=${encodeURIComponent(timedUrl)}`;
      }
      return timedUrl;
    },

    refreshCamera(id) {
      const camera = this.getCameraById(id);
      if (!camera || !camera.url) {
        this.status = {
          ...this.status,
          [id]: {
            ...(this.status[id] || {}),
            isConnected: false,
            errorMessage: 'No URL configured',
          },
        };
        return;
      }
      const url = this.buildUrl(camera);
      this.status = {
        ...this.status,
        [id]: {
          ...(this.status[id] || {}),
          currentImageUrl: url,
          isConnected: true,
          lastUpdate: new Date().toISOString(),
          errorMessage: null,
        },
      };
    },

    // Stubs kept so existing template bindings don't break
    onCurrentImageLoad() {},
    onCurrentImageError() {},
    onNextImageLoad() {},
    onNextImageError() {},
    onImageLoad() {},
    onImageError() {},

    startAutoRefresh(id) {
      this.setupVisibilityHandling();
      this.stopAutoRefresh(id);
      this.initCameraStatus(id);
      this.refreshCamera(id);

      const camera = this.getCameraById(id);
      if (!camera || camera.interval <= 0) return;

      const intervalMs = camera.interval;
      const interval = setInterval(() => {
        const cam = this.getCameraById(id);
        if (!cam || !cam.autoRefresh) {
          this.stopAutoRefresh(id);
          return;
        }
        this.refreshCamera(id);
      }, intervalMs);

      intervals.set(id, interval);
    },

    stopAutoRefresh(id) {
      if (intervals.has(id)) {
        clearInterval(intervals.get(id));
        intervals.delete(id);
      }
    },

    setupVisibilityHandling() {
      if (visibilityListenerAdded) return;
      visibilityListenerAdded = true;

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // Pause all running intervals — remember which ones were active
          intervals.forEach((interval, id) => {
            clearInterval(interval);
            pausedCameras.add(id);
          });
          intervals.clear();
        } else {
          // Resume: trigger an immediate background refresh so the image
          // updates as soon as possible, then restart the normal interval cycle.
          // displayUrl stays visible until the preloader has finished loading.
          pausedCameras.forEach((id) => {
            const cam = this.getCameraById(id);
            if (!cam || !cam.autoRefresh) return;
            this.refreshCamera(id); // loads in background via preloader
            const iv = setInterval(() => {
              const c = this.getCameraById(id);
              if (!c || !c.autoRefresh) {
                this.stopAutoRefresh(id);
                return;
              }
              this.refreshCamera(id);
            }, cam.interval);
            intervals.set(id, iv);
          });
          pausedCameras.clear();
        }
      });
    },

    loadFromLocalStorage() {
      this.setupVisibilityHandling();
      const saved = localStorage.getItem('multi-image-monitor-settings');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          this.cameras.forEach((c) => this.stopAutoRefresh(c.id));
          this.cameras = settings.cameras || [];
          this.cameras.forEach((c) => {
            this.initCameraStatus(c.id);
            if (c.autoRefresh) {
              this.startAutoRefresh(c.id);
            }
          });
        } catch (error) {
          console.error('Error loading image-monitor settings:', error);
        }
      }
    },

    saveToLocalStorage() {
      const settings = {
        cameras: this.cameras.map((c) => ({
          id: c.id,
          name: c.name,
          url: c.url,
          interval: c.interval,
          icon: c.icon,
          autoRefresh: c.autoRefresh,
          quality: c.quality,
          width: c.width,
          height: c.height,
          useCacheBuster: c.useCacheBuster,
          useProxy: c.useProxy !== undefined ? c.useProxy : true,
        })),
      };
      localStorage.setItem('multi-image-monitor-settings', JSON.stringify(settings));
    },
  },
});
