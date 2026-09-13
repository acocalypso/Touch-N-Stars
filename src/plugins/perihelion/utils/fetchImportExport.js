import axios from 'axios';
import { getUrls } from '@/services/api/core';

/** @returns {Promise<{ ok: boolean, message: string, count?: number }>} */
export async function importComets(rawText) {
  return doImport('/import/comets', rawText, 'text/plain');
}

/** @returns {Promise<{ ok: boolean, message: string, count?: number }>} */
export async function importAsteroids(json) {
  return doImport('/import/asteroids', json, 'application/json');
}

/** @returns {Promise<string|null>} raw MPC text, or null if nothing's ever been synced */
export async function exportComets() {
  return doExport('/export/comets');
}

/** @returns {Promise<string|null>} raw JSON, or null if nothing's ever been synced */
export async function exportAsteroids() {
  return doExport('/export/asteroids');
}

/** @returns {Promise<{ ok: boolean, message: string }>} */
export async function clearComets() {
  return doClear('/clear/comets');
}

/** @returns {Promise<{ ok: boolean, message: string }>} */
export async function clearAsteroids() {
  return doClear('/clear/asteroids');
}

/** @returns {Promise<{ ok: boolean, message: string }>} */
export async function clearCobs() {
  return doClear('/clear/cobs');
}

async function doImport(path, body, contentType) {
  const { PERIHELION_URL } = getUrls();
  try {
    const response = await axios.post(`${PERIHELION_URL}${path}`, body, {
      headers: { 'Content-Type': contentType },
    });
    return {
      ok: response.data.Success === true,
      message: response.data.Message,
      count: response.data.Count,
    };
  } catch (error) {
    return { ok: false, message: error.response?.data?.Message ?? error.message };
  }
}

async function doExport(path) {
  const { PERIHELION_URL } = getUrls();
  try {
    const response = await axios.get(`${PERIHELION_URL}${path}`, { responseType: 'text' });
    return response.data;
  } catch {
    return null;
  }
}

async function doClear(path) {
  const { PERIHELION_URL } = getUrls();
  try {
    const response = await axios.post(`${PERIHELION_URL}${path}`);
    return { ok: response.data.Success === true, message: response.data.Message };
  } catch (error) {
    return { ok: false, message: error.response?.data?.Message ?? error.message };
  }
}
