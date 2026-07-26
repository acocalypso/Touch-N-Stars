import axios from 'axios';
import { DEFAULT_TIMEOUT, getUrls, getPinsDaemonAuthHeaders } from './core';

export default {
  // Directory listing via HocusFocus plugin API (more reliable than PINS daemon for local paths)
  async listDirectories(path, timeout = DEFAULT_TIMEOUT) {
    if (!path || typeof path !== 'string') {
      return [];
    }
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}hocusfocus/browse-directories`, {
        params: { path },
        timeout,
      });
      if (response.data?.Success) {
        return response.data.directories || [];
      }
      const errMsg = response.data?.Error || 'Failed to load directory';
      const err = new Error(errMsg);
      throw err;
    } catch (error) {
      const status = error?.response?.status;
      const detail =
        error?.response?.data?.Error ||
        error?.response?.data?.message ||
        error?.message ||
        'Unknown error';
      const mappedError = new Error(detail);
      if (status) mappedError.status = status;
      throw mappedError;
    }
  },

  // api to get filesystem paths for image save path selection in settings
  async getFileDevices(timeout = DEFAULT_TIMEOUT) {
    try {
      const { PINSDAEMON_URL } = getUrls();
      const response = await axios.get(`${PINSDAEMON_URL}/files/devices`, {
        timeout,
        headers: getPinsDaemonAuthHeaders(),
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      if (error?.response?.status === 401) {
        const unauthorizedError = new Error('Unauthorized: missing or invalid API token');
        unauthorizedError.status = 401;
        throw unauthorizedError;
      }
      console.error('getFileDevices error:', error);
      return [];
    }
  },

  async listFileDirectories(path, timeout = DEFAULT_TIMEOUT) {
    if (!path || typeof path !== 'string') {
      return [];
    }

    try {
      const { PINSDAEMON_URL } = getUrls();
      const response = await axios.get(`${PINSDAEMON_URL}/files/list`, {
        params: { path },
        timeout,
        headers: getPinsDaemonAuthHeaders(),
      });
      // Backend contract: this endpoint returns an array and uses [] as a valid empty result.
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      if (error?.response?.status === 401) {
        const unauthorizedError = new Error('Unauthorized: missing or invalid API token');
        unauthorizedError.status = 401;
        throw unauthorizedError;
      }
      // Backend may return [] on failures; frontend treats empty list as the safe fallback.
      console.warn('listFileDirectories fallback to []:', error?.message || error);
      return [];
    }
  },

  async createFileDirectory(path, name, timeout = DEFAULT_TIMEOUT) {
    try {
      const { PINSDAEMON_URL } = getUrls();
      const response = await axios.post(
        `${PINSDAEMON_URL}/files/create-dir`,
        { path, name },
        {
          timeout,
          headers: getPinsDaemonAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;

      if (status === 401) {
        const mappedError = new Error(detail || 'Unauthorized: missing or invalid API token');
        mappedError.status = status;
        throw mappedError;
      }

      if ((status === 400 || status === 403) && detail) {
        const mappedError = new Error(detail);
        mappedError.status = status;
        throw mappedError;
      }

      console.error('createFileDirectory error:', error);
      throw error;
    }
  },

  // New filesystem endpoints
  async browseFilesystem(path = '') {
    const { API_URL } = getUrls();
    const params = path ? { path } : {};
    const response = await axios.get(`${API_URL}filesystem/browse`, {
      params,
      timeout: DEFAULT_TIMEOUT,
    });
    return response.data; // { success, currentPath, parentPath, directories[], files[] }
  },

  async createFilesystemDirectory(path) {
    const { API_URL } = getUrls();
    const response = await axios.post(
      `${API_URL}filesystem/directory`,
      { path },
      { timeout: DEFAULT_TIMEOUT }
    );
    return response.data;
  },

  async deleteFilesystemDirectory(path) {
    const { API_URL } = getUrls();
    const response = await axios.delete(`${API_URL}filesystem/directory`, {
      params: { path },
      timeout: DEFAULT_TIMEOUT,
    });
    return response.data;
  },

  async deleteFilesystemFile(path) {
    const { API_URL } = getUrls();
    const response = await axios.delete(`${API_URL}filesystem/file`, {
      params: { path },
      timeout: DEFAULT_TIMEOUT,
    });
    return response.data;
  },

  async renameFilesystemEntry(sourcePath, targetPath) {
    const { API_URL } = getUrls();
    const response = await axios.put(
      `${API_URL}filesystem/rename`,
      { sourcePath, targetPath },
      { timeout: DEFAULT_TIMEOUT }
    );
    return response.data;
  },

  getFilesystemFileStreamUrl(path) {
    const { API_URL } = getUrls();
    return `${API_URL}filesystem/file?path=${encodeURIComponent(path || '')}`;
  },

  async fetchFilesystemFileBuffer(path) {
    const { API_URL } = getUrls();
    const response = await axios.get(`${API_URL}filesystem/file`, {
      params: { path },
      responseType: 'arraybuffer',
      timeout: DEFAULT_TIMEOUT,
    });
    return response.data;
  },

  async fetchFilesystemFileText(path) {
    const { API_URL } = getUrls();
    const response = await axios.get(`${API_URL}filesystem/file`, {
      params: { path },
      responseType: 'text',
      timeout: DEFAULT_TIMEOUT,
    });
    return response.data;
  },

  // Available Serial Ports
  async availableSerialPorts() {
    try {
      const { API_URL } = getUrls();
      const response = await axios.get(`${API_URL}indi/serialports`);
      const data = response.data.Response;
      if (data && Array.isArray(data.Ports)) {
        const byIdLinks = (data.ByIdLinks || []).map((link) => ({
          Port: link.Path,
          Description: '',
        }));
        if (byIdLinks.length > 0) {
          return [
            ...data.Ports,
            { Port: '', Description: '', separator: true, label: '─── by-id ───' },
            ...byIdLinks,
          ];
        }
        return data.Ports;
      }
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching available serial ports:', error);
      return [];
    }
  },
};
