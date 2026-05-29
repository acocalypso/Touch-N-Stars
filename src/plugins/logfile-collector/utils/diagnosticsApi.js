import axios from 'axios';

/**
 * @typedef {Object} DiagnosticsOptionsSection
 * @property {string} key
 * @property {string} [label]
 * @property {boolean} [defaultEnabled]
 */

/**
 * @typedef {Object} DiagnosticsOptionsResponse
 * @property {DiagnosticsOptionsSection[]} [sections]
 * @property {number} [journalLines]
 * @property {number} [dmesgLines]
 */

/**
 * @typedef {Object} DiagnosticsArchiveStartRequest
 * @property {boolean} includePinsJournal
 * @property {boolean} includeApiJournal
 * @property {boolean} includeSystemJournal
 * @property {boolean} includeDmesg
 * @property {boolean} includeUsb
 * @property {boolean} includeSystemInfo
 * @property {number} journalLines
 * @property {number} dmesgLines
 */

/**
 * @typedef {Object} DiagnosticsArchiveStartResponse
 * @property {string} archiveId
 * @property {'queued'|'running'|'success'|'failed'} status
 * @property {string} [pollUrl]
 * @property {string} [downloadUrl]
 * @property {string} [message]
 */

/**
 * @typedef {Object} DiagnosticsArchiveStatusResponse
 * @property {string} [archiveId]
 * @property {'queued'|'running'|'success'|'failed'} [status]
 * @property {string} [pollUrl]
 * @property {string} [downloadUrl]
 * @property {string} [error]
 * @property {string} [message]
 */

/**
 * @typedef {Object} DiagnosticsArchiveDownloadResponse
 * @property {Blob} blob
 * @property {string} filename
 */

export function createDiagnosticsApi({ getIp, port, token }) {
  function getBaseUrl() {
    const ip = getIp();
    if (!ip) {
      throw new Error('Missing host IP');
    }
    return `http://${ip}:${port}`;
  }

  function getHeaders() {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /** @returns {Promise<DiagnosticsOptionsResponse>} */
  async function fetchDiagnosticsOptions() {
    const response = await axios.get(`${getBaseUrl()}/diagnostics/options`, {
      headers: getHeaders(),
      timeout: 10000,
    });
    return response.data || {};
  }

  /**
   * @param {DiagnosticsArchiveStartRequest|Record<string, boolean|number>} payload
   * @returns {Promise<DiagnosticsArchiveStartResponse>}
   */
  async function startDiagnosticsArchive(payload) {
    const response = await axios.post(`${getBaseUrl()}/diagnostics/archive/start`, payload, {
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
      },
      timeout: 15000,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 202,
    });
    return response.data || {};
  }

  /** @returns {Promise<DiagnosticsArchiveStatusResponse>} */
  async function getDiagnosticsArchiveStatus(archiveId) {
    const response = await axios.get(`${getBaseUrl()}/diagnostics/archive/${archiveId}`, {
      headers: getHeaders(),
      timeout: 10000,
    });
    return response.data || {};
  }

  /** @returns {Promise<DiagnosticsArchiveDownloadResponse>} */
  async function downloadDiagnosticsArchive(archiveId) {
    const response = await axios.get(`${getBaseUrl()}/diagnostics/archive/${archiveId}/download`, {
      headers: getHeaders(),
      responseType: 'blob',
      timeout: 60000,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 409,
    });

    if (response.status === 409) {
      const err = new Error('Archive is still preparing.');
      err.httpStatus = 409;
      throw err;
    }

    const contentDisposition = response.headers?.['content-disposition'] || '';
    const filenameMatch = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(
      contentDisposition
    );
    const encodedName = filenameMatch?.[1] || filenameMatch?.[2] || '';
    const filename = encodedName ? decodeURIComponent(encodedName) : `diagnostics-${archiveId}.zip`;

    return {
      blob: response.data,
      filename,
    };
  }

  return {
    fetchDiagnosticsOptions,
    startDiagnosticsArchive,
    getDiagnosticsArchiveStatus,
    downloadDiagnosticsArchive,
  };
}
