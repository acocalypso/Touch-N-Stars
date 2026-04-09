import i18n from '@/i18n';

const MAX_CACHE_ENTRIES = 20;
const scheduleCache = new Map();

export const DEFAULT_STEP_MINUTES = 5;
export const DEFAULT_MAX_CHUNK_MINUTES = 90;

export const DEFAULT_CONSTRAINTS = Object.freeze({
  enabled: true,
  minAltitude: 25,
  maxAltitude: 89,
  minMoonSeparation: 0,
  timeWindowStart: '',
  timeWindowEnd: '',
});

export const DEFAULT_EXPOSURE = Object.freeze({
  id: '',
  filterName: 'L',
  durationSeconds: 180,
  gain: 100,
  offset: 0,
  binning: 1,
  count: 10,
  imageType: 'LIGHT',
});

function createId(prefix = 'ts') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e8).toString(16)}`;
}

export function createExposure(overrides = {}) {
  return {
    ...DEFAULT_EXPOSURE,
    id: createId('exp'),
    ...overrides,
  };
}

export function createDefaultTarget(overrides = {}) {
  return {
    id: createId('target'),
    name: i18n.global.t('plugins.targetScheduler.defaults.newTargetName'),
    ra: 0,
    dec: 0,
    rotation: 0,
    priority: 50,
    isFavoriteLinked: false,
    favoriteId: null,
    exposures: [createExposure()],
    constraints: { ...DEFAULT_CONSTRAINTS },
    ...overrides,
  };
}

export function parseRaToDeg(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    if (value >= 0 && value <= 24) return value * 15;
    return value;
  }

  const txt = String(value).trim();
  if (!txt) return null;

  if (/^-?\d+(\.\d+)?$/.test(txt)) {
    const n = Number(txt);
    if (!Number.isFinite(n)) return null;
    return n >= 0 && n <= 24 ? n * 15 : n;
  }

  const normalized = txt
    .replace(/[hH]/g, ':')
    .replace(/[mM]/g, ':')
    .replace(/[sS]/g, '')
    .replace(/\s+/g, ':')
    .replace(/:+/g, ':')
    .replace(/^:|:$/g, '');

  const parts = normalized.split(':').map((v) => Number(v));
  if (!parts.length || parts.some((v) => Number.isNaN(v))) return null;

  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const seconds = parts[2] ?? 0;

  return ((hours + minutes / 60 + seconds / 3600) * 15 + 360) % 360;
}

export function parseDecToDeg(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const txt = String(value).trim();
  if (!txt) return null;

  if (/^-?\d+(\.\d+)?$/.test(txt)) {
    const n = Number(txt);
    return Number.isFinite(n) ? n : null;
  }

  const sign = txt.startsWith('-') ? -1 : 1;
  const normalized = txt
    .replace(/^[+-]/, '')
    .replace(/[dD°]/g, ':')
    .replace(/[mM']/g, ':')
    .replace(/[sS"]/g, '')
    .replace(/\s+/g, ':')
    .replace(/:+/g, ':')
    .replace(/^:|:$/g, '');

  const parts = normalized.split(':').map((v) => Number(v));
  if (!parts.length || parts.some((v) => Number.isNaN(v))) return null;

  const deg = parts[0] ?? 0;
  const min = parts[1] ?? 0;
  const sec = parts[2] ?? 0;

  return sign * (Math.abs(deg) + min / 60 + sec / 3600);
}

export function favoriteToTarget(favorite) {
  const name =
    favorite?.Name ??
    favorite?.name ??
    favorite?.TargetName ??
    favorite?.title ??
    i18n.global.t('plugins.targetScheduler.defaults.favoriteTargetName');

  const ra =
    parseRaToDeg(
      favorite?.Ra ?? favorite?.ra ?? favorite?.RA ?? favorite?.RADegrees ?? favorite?.RaString
    ) ?? 0;

  const dec =
    parseDecToDeg(
      favorite?.Dec ??
        favorite?.dec ??
        favorite?.DEC ??
        favorite?.Declination ??
        favorite?.DecString
    ) ?? 0;

  const favoriteId = favorite?.Id ?? favorite?.id ?? null;

  return createDefaultTarget({
    id: createId('target-fav'),
    name,
    ra,
    dec,
    rotation: Number.isFinite(Number(favorite?.Rotation)) ? Number(favorite.Rotation) : 0,
    isFavoriteLinked: true,
    favoriteId,
  });
}

export function totalRequestedMinutes(target) {
  const exposures = Array.isArray(target?.exposures) ? target.exposures : [];
  if (!exposures.length) return 0;
  return exposures.reduce((sum, exp) => {
    const seconds = Number(exp?.durationSeconds) || 0;
    const count = Number(exp?.count) || 0;
    return sum + (seconds * count) / 60;
  }, 0);
}

function deepClone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function addCacheEntry(key, value) {
  if (scheduleCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = scheduleCache.keys().next().value;
    scheduleCache.delete(oldestKey);
  }
  scheduleCache.set(key, value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function normalizeDeg360(deg) {
  return ((deg % 360) + 360) % 360;
}

function toJulianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function gmstDeg(date) {
  const jd = toJulianDate(date);
  const t = (jd - 2451545.0) / 36525.0;
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000.0;
  return normalizeDeg360(gmst);
}

function localSiderealTimeDeg(date, lonDeg) {
  return normalizeDeg360(gmstDeg(date) + lonDeg);
}

function radecToAltAz(raDeg, decDeg, date, latDeg, lonDeg) {
  const ra = toRad(raDeg);
  const dec = toRad(decDeg);
  const lat = toRad(latDeg);
  const lst = toRad(localSiderealTimeDeg(date, lonDeg));

  const hourAngle = lst - ra;

  const sinAlt =
    Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(hourAngle);
  const alt = Math.asin(clamp(sinAlt, -1, 1));

  const cosAz = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat));
  let az = Math.acos(clamp(cosAz, -1, 1));
  if (Math.sin(hourAngle) > 0) az = 2 * Math.PI - az;

  return { altDeg: toDeg(alt), azDeg: toDeg(az) };
}

function daysSinceJ2000(date) {
  return toJulianDate(date) - 2451545.0;
}

function eclipticToEquatorial(lambdaDeg, betaDeg, date) {
  const epsDeg = 23.439291 - 0.00000036 * daysSinceJ2000(date);
  const lambda = toRad(lambdaDeg);
  const beta = toRad(betaDeg);
  const eps = toRad(epsDeg);

  const sinDec = Math.sin(beta) * Math.cos(eps) + Math.cos(beta) * Math.sin(eps) * Math.sin(lambda);
  const dec = Math.asin(clamp(sinDec, -1, 1));

  const y = Math.sin(lambda) * Math.cos(eps) - Math.tan(beta) * Math.sin(eps);
  const x = Math.cos(lambda);
  const ra = Math.atan2(y, x);

  return {
    raDeg: normalizeDeg360(toDeg(ra)),
    decDeg: toDeg(dec),
  };
}

function getSunEquatorial(date) {
  const d = daysSinceJ2000(date);
  const m = normalizeDeg360(357.52911 + 0.98560028 * d);
  const l0 = normalizeDeg360(280.46646 + 0.98564736 * d);

  const c =
    1.914602 * Math.sin(toRad(m)) +
    0.019993 * Math.sin(toRad(2 * m)) +
    0.000289 * Math.sin(toRad(3 * m));

  const lambda = normalizeDeg360(l0 + c);
  return eclipticToEquatorial(lambda, 0, date);
}

function getMoonEquatorial(date) {
  const d = daysSinceJ2000(date);

  const l0 = normalizeDeg360(218.316 + 13.176396 * d);
  const mMoon = normalizeDeg360(134.963 + 13.064993 * d);
  const mSun = normalizeDeg360(357.529 + 0.98560028 * d);
  const dArg = normalizeDeg360(297.85 + 12.190749 * d);
  const fArg = normalizeDeg360(93.272 + 13.22935 * d);

  const lon =
    l0 +
    6.289 * Math.sin(toRad(mMoon)) +
    1.274 * Math.sin(toRad(2 * dArg - mMoon)) +
    0.658 * Math.sin(toRad(2 * dArg)) +
    0.214 * Math.sin(toRad(2 * mMoon)) -
    0.186 * Math.sin(toRad(mSun));

  const lat =
    5.128 * Math.sin(toRad(fArg)) +
    0.28 * Math.sin(toRad(mMoon + fArg)) +
    0.277 * Math.sin(toRad(mMoon - fArg));

  return eclipticToEquatorial(normalizeDeg360(lon), lat, date);
}

function angularSeparationDeg(ra1Deg, dec1Deg, ra2Deg, dec2Deg) {
  const ra1 = toRad(ra1Deg);
  const dec1 = toRad(dec1Deg);
  const ra2 = toRad(ra2Deg);
  const dec2 = toRad(dec2Deg);

  const cosSep =
    Math.sin(dec1) * Math.sin(dec2) + Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2);

  return toDeg(Math.acos(clamp(cosSep, -1, 1)));
}

function getMoonDataForTarget(targetRaDeg, targetDecDeg, date) {
  const sun = getSunEquatorial(date);
  const moon = getMoonEquatorial(date);

  const elongationDeg = angularSeparationDeg(sun.raDeg, sun.decDeg, moon.raDeg, moon.decDeg);
  const illumination = (1 - Math.cos(toRad(elongationDeg))) / 2;

  const separationDeg = angularSeparationDeg(targetRaDeg, targetDecDeg, moon.raDeg, moon.decDeg);

  return {
    separationDeg,
    illumination,
  };
}

function parseTimeStringToDate(baseDate, hhmm) {
  if (!hhmm) return null;
  const match = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const out = new Date(baseDate);
  out.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return out;
}

function resolveTargetWindow(target, sessionStart, sessionEnd) {
  const windowStartRaw = parseTimeStringToDate(sessionStart, target.constraints.timeWindowStart);
  const windowEndRaw = parseTimeStringToDate(sessionStart, target.constraints.timeWindowEnd);

  let start = windowStartRaw ?? sessionStart;
  let end = windowEndRaw ?? sessionEnd;

  if (windowStartRaw && windowEndRaw && end <= start) {
    end.setDate(end.getDate() + 1);
  }

  if (start < sessionStart) start = sessionStart;
  if (end > sessionEnd) end = sessionEnd;

  if (end <= start) return null;

  return { start, end };
}

function normalizeExposure(exp) {
  const durationSeconds = Math.max(
    1,
    Number(exp?.durationSeconds) || DEFAULT_EXPOSURE.durationSeconds
  );
  const count = Math.max(1, Number(exp?.count) || DEFAULT_EXPOSURE.count);

  return {
    ...DEFAULT_EXPOSURE,
    ...exp,
    id: exp?.id || createId('exp'),
    filterName: exp?.filterName || DEFAULT_EXPOSURE.filterName,
    durationSeconds,
    gain: Number.isFinite(Number(exp?.gain)) ? Number(exp.gain) : DEFAULT_EXPOSURE.gain,
    offset: Number.isFinite(Number(exp?.offset)) ? Number(exp.offset) : DEFAULT_EXPOSURE.offset,
    binning: [1, 2, 3, 4].includes(Number(exp?.binning)) ? Number(exp.binning) : 1,
    count,
    imageType: exp?.imageType || DEFAULT_EXPOSURE.imageType,
  };
}

function normalizeTarget(target) {
  const exposures = Array.isArray(target?.exposures) ? target.exposures.map(normalizeExposure) : [];

  return {
    ...createDefaultTarget(),
    ...target,
    id: target?.id || createId('target'),
    name: target?.name || i18n.global.t('plugins.targetScheduler.defaults.targetName'),
    ra: Number(target?.ra),
    dec: Number(target?.dec),
    rotation: Number.isFinite(Number(target?.rotation)) ? Number(target.rotation) : 0,
    priority: clamp(Number(target?.priority) || 1, 1, 100),
    exposures: exposures.length ? exposures : [createExposure()],
    constraints: {
      ...DEFAULT_CONSTRAINTS,
      ...(target?.constraints || {}),
      enabled: target?.constraints?.enabled !== false,
      minAltitude: clamp(
        Number(target?.constraints?.minAltitude) || DEFAULT_CONSTRAINTS.minAltitude,
        0,
        89
      ),
      maxAltitude: clamp(
        Number(target?.constraints?.maxAltitude) || DEFAULT_CONSTRAINTS.maxAltitude,
        1,
        90
      ),
      minMoonSeparation: clamp(Number(target?.constraints?.minMoonSeparation) || 0, 0, 180),
    },
  };
}

function buildTargetTrack(target, sessionStart, sessionEnd, location, stepMinutes) {
  const samples = [];
  const window = resolveTargetWindow(target, sessionStart, sessionEnd);

  if (!window) {
    return {
      samples,
      visibleMinutes: 0,
      bestSample: null,
      firstVisible: null,
      lastVisible: null,
      window,
    };
  }

  let bestSample = null;
  let visibleMinutes = 0;
  let firstVisible = null;
  let lastVisible = null;

  for (let t = sessionStart.getTime(); t <= sessionEnd.getTime(); t += stepMinutes * 60 * 1000) {
    const at = new Date(t);
    const inWindow = at >= window.start && at <= window.end;

    const { altDeg, azDeg } = radecToAltAz(
      target.ra,
      target.dec,
      at,
      location.latitude,
      location.longitude
    );
    const moon = getMoonDataForTarget(target.ra, target.dec, at);

    const visibleByAltitude =
      altDeg >= target.constraints.minAltitude && altDeg <= target.constraints.maxAltitude;
    const visibleByMoon =
      target.constraints.minMoonSeparation <= 0 ||
      moon.separationDeg >= target.constraints.minMoonSeparation;

    const visible = inWindow && visibleByAltitude && visibleByMoon;

    if (visible) {
      visibleMinutes += stepMinutes;
      if (!firstVisible) firstVisible = at;
      lastVisible = at;
    }

    if (!bestSample || altDeg > bestSample.altDeg) {
      bestSample = {
        time: at,
        altDeg,
        azDeg,
        moonSeparationDeg: moon.separationDeg,
        moonIllumination: moon.illumination,
      };
    }

    samples.push({
      time: at,
      altDeg,
      azDeg,
      moonSeparationDeg: moon.separationDeg,
      moonIllumination: moon.illumination,
      visible,
      inWindow,
    });
  }

  return {
    samples,
    visibleMinutes,
    bestSample,
    firstVisible,
    lastVisible,
    window,
  };
}

function findNextVisibleIndex(samples, fromTime) {
  for (let i = 0; i < samples.length; i++) {
    if (samples[i].time >= fromTime && samples[i].visible) return i;
  }
  return -1;
}

function findVisibleRunEndIndex(samples, startIndex) {
  let i = startIndex;
  while (i + 1 < samples.length && samples[i + 1].visible) {
    i += 1;
  }
  return i;
}

function computeCandidateScore(target, startSample, waitMinutes) {
  const altitudeScore = startSample.altDeg * 0.8;
  const waitPenalty = waitMinutes * 1.9;
  const priorityScore = target.priority * 8;

  let moonPenalty = 0;
  if (target.constraints.minMoonSeparation > 0) {
    const diff = target.constraints.minMoonSeparation - startSample.moonSeparationDeg;
    moonPenalty = diff > 0 ? diff * 5 : 0;
  }

  const visibleNowBonus = waitMinutes <= 0.1 ? 120 : 0;

  return priorityScore + altitudeScore + visibleNowBonus - waitPenalty - moonPenalty;
}

function buildCacheKey(input) {
  const payload = {
    targets: input.targets.map((t) => ({
      id: t.id,
      ra: t.ra,
      dec: t.dec,
      rotation: t.rotation,
      priority: t.priority,
      exposures: t.exposures.map((e) => ({
        filterName: e.filterName,
        durationSeconds: e.durationSeconds,
        gain: e.gain,
        offset: e.offset,
        binning: e.binning,
        count: e.count,
        imageType: e.imageType,
      })),
      constraints: t.constraints,
    })),
    sessionStart: input.sessionStart.toISOString(),
    sessionEnd: input.sessionEnd.toISOString(),
    location: input.location,
    stepMinutes: input.stepMinutes,
    maxChunkMinutes: input.maxChunkMinutes,
  };

  return JSON.stringify(payload);
}

export function computeSchedulePlan(options) {
  const sessionStart = new Date(options.sessionStart);
  const sessionEnd = new Date(options.sessionEnd);

  if (
    Number.isNaN(sessionStart.getTime()) ||
    Number.isNaN(sessionEnd.getTime()) ||
    sessionEnd <= sessionStart
  ) {
    return {
      generatedAt: new Date().toISOString(),
      session: null,
      segments: [],
      idleSegments: [],
      targets: [],
      unscheduled: [],
      errors: [i18n.global.t('plugins.targetScheduler.errors.invalidSessionRange')],
    };
  }

  const location = {
    latitude: Number(options?.location?.latitude),
    longitude: Number(options?.location?.longitude),
    altitude: Number(options?.location?.altitude) || 0,
  };

  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
    return {
      generatedAt: new Date().toISOString(),
      session: null,
      segments: [],
      idleSegments: [],
      targets: [],
      unscheduled: [],
      errors: [i18n.global.t('plugins.targetScheduler.errors.missingSiteCoordinates')],
    };
  }

  const stepMinutes = Math.max(2, Number(options.stepMinutes) || DEFAULT_STEP_MINUTES);
  const maxChunkMinutes = Math.max(
    stepMinutes,
    Number(options.maxChunkMinutes) || DEFAULT_MAX_CHUNK_MINUTES
  );

  const normalizedTargets = (Array.isArray(options.targets) ? options.targets : [])
    .map(normalizeTarget)
    .filter((t) => t.constraints.enabled)
    .filter((t) => Number.isFinite(t.ra) && Number.isFinite(t.dec));

  const key = buildCacheKey({
    targets: normalizedTargets,
    sessionStart,
    sessionEnd,
    location,
    stepMinutes,
    maxChunkMinutes,
  });

  if (scheduleCache.has(key)) {
    return deepClone(scheduleCache.get(key));
  }

  const targetState = normalizedTargets.map((target) => {
    const track = buildTargetTrack(target, sessionStart, sessionEnd, location, stepMinutes);
    const requestedMinutes = totalRequestedMinutes(target);

    return {
      target,
      track,
      requestedMinutes,
      remainingMinutes: requestedMinutes,
      scheduledMinutes: 0,
    };
  });

  const segments = [];
  const idleSegments = [];

  let cursor = new Date(sessionStart);
  let safetyCounter = 0;

  while (cursor < sessionEnd && safetyCounter < 5000) {
    safetyCounter += 1;

    const active = targetState.filter((t) => t.remainingMinutes > 0.01);
    if (!active.length) break;

    let bestCandidate = null;

    for (const state of active) {
      const startIndex = findNextVisibleIndex(state.track.samples, cursor);
      if (startIndex < 0) continue;

      const startSample = state.track.samples[startIndex];
      const runEndIndex = findVisibleRunEndIndex(state.track.samples, startIndex);
      const runEndSample = state.track.samples[runEndIndex];

      const runAvailableMinutes =
        (runEndSample.time.getTime() - startSample.time.getTime()) / 60000 + stepMinutes;
      const allocMinutes = Math.min(runAvailableMinutes, state.remainingMinutes, maxChunkMinutes);

      if (allocMinutes < stepMinutes) continue;

      const waitMinutes = (startSample.time.getTime() - cursor.getTime()) / 60000;
      const score = computeCandidateScore(state.target, startSample, waitMinutes);

      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = {
          state,
          start: startSample.time,
          allocMinutes,
          score,
        };
      }
    }

    if (!bestCandidate) {
      const idleEnd = new Date(
        Math.min(sessionEnd.getTime(), cursor.getTime() + stepMinutes * 60 * 1000)
      );
      idleSegments.push({
        id: createId('idle'),
        start: cursor.toISOString(),
        end: idleEnd.toISOString(),
        durationMinutes: (idleEnd.getTime() - cursor.getTime()) / 60000,
      });
      cursor = idleEnd;
      continue;
    }

    if (bestCandidate.start > cursor) {
      idleSegments.push({
        id: createId('idle'),
        start: cursor.toISOString(),
        end: bestCandidate.start.toISOString(),
        durationMinutes: (bestCandidate.start.getTime() - cursor.getTime()) / 60000,
      });
      cursor = new Date(bestCandidate.start);
    }

    const end = new Date(cursor.getTime() + bestCandidate.allocMinutes * 60 * 1000);

    segments.push({
      id: createId('segment'),
      targetId: bestCandidate.state.target.id,
      start: cursor.toISOString(),
      end: end.toISOString(),
      durationMinutes: bestCandidate.allocMinutes,
      score: Number(bestCandidate.score.toFixed(3)),
    });

    bestCandidate.state.remainingMinutes = Math.max(
      0,
      bestCandidate.state.remainingMinutes - bestCandidate.allocMinutes
    );
    bestCandidate.state.scheduledMinutes += bestCandidate.allocMinutes;

    cursor = end;
  }

  const targets = targetState.map((state) => ({
    id: state.target.id,
    name: state.target.name,
    priority: state.target.priority,
    requestedMinutes: state.requestedMinutes,
    scheduledMinutes: Number(state.scheduledMinutes.toFixed(2)),
    remainingMinutes: Number(state.remainingMinutes.toFixed(2)),
    visibleMinutes: Number(state.track.visibleMinutes.toFixed(2)),
    bestAltitudeDeg: Number((state.track.bestSample?.altDeg ?? 0).toFixed(2)),
    bestTime: state.track.bestSample?.time?.toISOString() ?? null,
    firstVisible: state.track.firstVisible?.toISOString() ?? null,
    lastVisible: state.track.lastVisible?.toISOString() ?? null,
    windowStart: state.track.window?.start?.toISOString() ?? null,
    windowEnd: state.track.window?.end?.toISOString() ?? null,
  }));

  const unscheduled = targets
    .filter((t) => t.remainingMinutes > 0.01)
    .map((t) => ({
      targetId: t.id,
      name: t.name,
      remainingMinutes: t.remainingMinutes,
    }));

  const result = {
    generatedAt: new Date().toISOString(),
    session: {
      start: sessionStart.toISOString(),
      end: sessionEnd.toISOString(),
      totalMinutes: (sessionEnd.getTime() - sessionStart.getTime()) / 60000,
      stepMinutes,
      maxChunkMinutes,
    },
    segments,
    idleSegments,
    targets,
    unscheduled,
    errors: [],
  };

  addCacheEntry(key, result);
  return deepClone(result);
}
