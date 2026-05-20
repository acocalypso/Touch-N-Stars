import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import apiService from '@/services/apiService';
import { getConstellationFull } from '../utils/constellation.js';
import { saveData, loadData } from '../utils/idb-cache.js';

const ROCHESTER_URL = 'https://rochesterastronomy.org/snimages/snactive.html';

function parseRA(str) {
  const m = str.trim().match(/^(\d+):(\d+):([\d.]+)$/);
  if (!m) return null;
  return (parseInt(m[1]) + parseInt(m[2]) / 60 + parseFloat(m[3]) / 3600) * 15;
}

function parseDec(str) {
  const m = str.trim().match(/^([+-]?)(\d+):(\d+):([\d.]+)$/);
  if (!m) return null;
  const abs = parseInt(m[2]) + parseInt(m[3]) / 60 + parseFloat(m[4]) / 3600;
  return m[1] === '-' ? -abs : abs;
}

function parseMag(str) {
  const n = parseFloat(str.trim().replace('*', ''));
  return isNaN(n) ? null : n;
}

function parseSnactiveHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('table tr');
  const entries = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td');
    if (cells.length < 12) continue;
    const name = cells[0].textContent.trim();
    const raDeg = parseRA(cells[2].textContent);
    const decDeg = parseDec(cells[3].textContent);
    if (!name || raDeg === null || decDeg === null) continue;
    const firstObserved = cells[11].textContent.trim();
    entries.push({
      name,
      hostGalaxy: cells[1].textContent.trim(),
      raDeg,
      decDeg,
      constellation: getConstellationFull(raDeg, decDeg),
      latestMag: parseMag(cells[5].textContent),
      lastObserved: cells[6].textContent.trim(),
      type: cells[7].textContent.trim(),
      z: cells[8].textContent.trim(),
      maxMag: parseMag(cells[9].textContent),
      maxMagDate: cells[10].textContent.trim(),
      firstObserved,
      discoveryYear: firstObserved.slice(0, 4),
      discoverer: cells[12]?.textContent.trim() ?? '',
      aka: cells[13]?.textContent.trim() ?? '',
    });
  }
  return entries;
}

export const useSupernovaeStore = defineStore('supernovaeStore', {
  state: () => ({
    entries: [],
    knownIds: [],
    lastUpdated: null,
    downloading: false,
    downloadError: null,
  }),

  getters: {
    knownIdSet: (s) => new Set(s.knownIds),
  },

  actions: {
    async load() {
      try {
        const entries = await loadData('entries');
        const knownIds = await loadData('knownIds');
        const lastUpdated = await loadData('lastUpdated');
        this.entries = entries ?? [];
        this.knownIds = knownIds ?? [];
        this.lastUpdated = lastUpdated ?? null;
      } catch {
        this.entries = [];
        this.knownIds = [];
        this.lastUpdated = null;
      }
    },

    async download() {
      if (this.downloading) return;
      this.downloading = true;
      this.downloadError = null;
      try {
        const blob = await apiService.proxyRequest(ROCHESTER_URL);
        const html = await blob.text();
        const parsed = parseSnactiveHtml(html);
        if (!parsed.length)
          throw new Error('Rochester: No entries parsed — page format may have changed');

        const prev = this.knownIdSet;
        this.entries = parsed.map((e) => ({ ...e, isNew: !prev.has(e.name) }));
        this.knownIds = parsed.map((e) => e.name);
        this.lastUpdated = new Date().toISOString();

        const rawEntries = toRaw(this.entries).map(toRaw);
        await saveData('entries', rawEntries);
        await saveData('knownIds', [...this.knownIds]);
        await saveData('lastUpdated', this.lastUpdated);
      } catch (e) {
        this.downloadError = e.message ?? 'Download failed';
      } finally {
        this.downloading = false;
      }
    },
  },
});
