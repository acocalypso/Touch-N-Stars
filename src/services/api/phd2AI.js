import axios from 'axios';
import { getUrls, DEFAULT_TIMEOUT } from './core';
import { getHttpAbortSignal } from '@/utils/httpLifecycle';

// Expected job/compatibility failures belong in this panel. The global Axios
// interceptor replaces error bodies, which would hide native PHD2's explanation.
export const aiHttp = axios.create();

// The Pi/plugin owns model paths and jobs. Never persist Active mode in the browser.
export async function aiRequest(method, route, data) {
  const { API_URL } = getUrls();
  const response = await aiHttp.request({
    method,
    url: `${API_URL}phd2/ai/${route}`,
    data,
    timeout: DEFAULT_TIMEOUT,
    signal: getHttpAbortSignal(),
  });
  if (!response.data?.Success) {
    throw Object.assign(new Error(response.data?.Error || 'PHD2 AI request failed'), {
      response,
    });
  }
  return response.data.Response;
}

export default {
  status: () => aiRequest('get', 'status'),
  validate: () => aiRequest('get', 'validate'),
  models: () => aiRequest('get', 'models'),
  directory: (path) => aiRequest('put', 'directory', { path }),
  mode: (mode) => aiRequest('put', 'mode', { mode }),
  gain: (gain) => aiRequest('put', 'gain', { gain }),
  select: (path) => aiRequest('post', 'models/select', { path }),
  import: (path) => aiRequest('post', 'models/import', { path }),
  export: (path) => aiRequest('post', 'models/export', { path }),
  unload: () => aiRequest('post', 'models/unload'),
  start: (duration_sec, period_sec) =>
    aiRequest('post', 'training/start', { duration_sec, period_sec }),
  fit: (recording_path, period_sec) =>
    aiRequest('post', 'training/fit', { recording_path, period_sec }),
  training: () => aiRequest('get', 'training/status'),
  cancel: () => aiRequest('post', 'training/cancel'),
  recording: () => aiRequest('get', 'recording/status'),
  record: (duration_sec, output_path) =>
    aiRequest('post', 'recording/start', { mode: 'passive', duration_sec, output_path }),
  stopRecording: () => aiRequest('post', 'recording/stop'),
};
