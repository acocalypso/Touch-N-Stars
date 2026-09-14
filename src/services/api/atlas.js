import axios from 'axios';
import { getUrls } from './core';

// Plugin-server endpoints for the Atlas DSS survey download (DssSurveyController).
// A plugin without the controller answers 404, which the global interceptor turns into
// a resolved mock response with `status: 404`; the methods report that as
// `supported: false` instead of throwing so the UI can show an "update the plugin" hint.
function isMissingEndpoint(response) {
  return response?.status === 404 || response?.data?.StatusCode === 404;
}

function unwrapSurveyResponse(response) {
  if (isMissingEndpoint(response)) return { success: false, supported: false };
  const data = response?.data;
  if (!data || typeof data !== 'object' || data.Success === false) {
    return { success: false, supported: true, error: data?.Error || 'Request failed' };
  }
  return { supported: true, ...data };
}

export default {
  async getDssSurveyStatus() {
    const { API_URL } = getUrls();
    const response = await axios.get(`${API_URL}atlas/survey/status`, {
      headers: { 'X-Suppress-Toast-404': 'true' },
      validateStatus: (status) => status < 500 || status === 404,
    });
    return unwrapSurveyResponse(response);
  },

  async startDssSurveyDownload(targetOrder) {
    const { API_URL } = getUrls();
    const response = await axios.post(`${API_URL}atlas/survey/download`, { targetOrder });
    return unwrapSurveyResponse(response);
  },

  async cancelDssSurveyDownload() {
    const { API_URL } = getUrls();
    const response = await axios.post(`${API_URL}atlas/survey/cancel`);
    return unwrapSurveyResponse(response);
  },

  async deleteDssSurvey() {
    const { API_URL } = getUrls();
    const response = await axios.post(`${API_URL}atlas/survey/delete`);
    return unwrapSurveyResponse(response);
  },
};
