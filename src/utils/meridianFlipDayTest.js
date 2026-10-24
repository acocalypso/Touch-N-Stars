// Planning helpers for the real meridian flip test.
//
// The test lets NINA flip for real: a sequence slews to a point a few minutes east of the
// meridian and waits in exposure-sized steps while NINA's MeridianFlipTrigger decides when
// to flip. Everything here is computed in the mount's own frame (its sidereal time and
// site latitude): the hour angle the mount believes in is what decides its pier side.

import { angularSeparationDeg, clampValue, normalizeDeg360, toDeg, toRad } from './astronomy';
import { isPierSideKnown } from './meridianFlipPresets';

export const FLIP_TEST_MIN_ALTITUDE_DEG = 20;
export const FLIP_TEST_MIN_SUN_SEPARATION_DEG = 45;
// Time to slew to the start point before tracking reaches the meridian (or the pause).
export const FLIP_TEST_LEAD_MINUTES = 2;
// Room for the flip slew, settling and recentering after the flip time.
const FLIP_DURATION_MINUTES = 3;
// The wait loop runs well past the latest flip time; the app stops it after the flip.
const WAIT_MARGIN_MINUTES = 15;

const DEC_LIMIT_DEG = 70;
const DEC_STEP_DEG = 5;
const PATH_STEP_HOURS = 0.1;

export function altitudeDeg(hourAngleHours, decDeg, latDeg) {
  const ha = toRad(hourAngleHours * 15);
  const dec = toRad(decDeg);
  const lat = toRad(latDeg);
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  return toDeg(Math.asin(clampValue(sinAlt, -1, 1)));
}

// RA (degrees) of the point at the given hour angle for the given local sidereal time.
function raAtHourAngle(lstHours, hourAngleHours) {
  return normalizeDeg360((lstHours - hourAngleHours) * 15);
}

// Lead time, number of wait steps and the expected duration for the flip settings and
// exposure length. NINA flips after the first exposure that ends inside the window, so the
// latest flip lands at min + one exposure, capped at max. A pause before the meridian
// stops tracking early, so the start point has to lie east of the pause.
export function planFlipTest(flipSettings, exposureSeconds) {
  const pause = Math.max(0, Number(flipSettings?.PauseTimeBeforeMeridian) || 0);
  const min = Math.max(0, Number(flipSettings?.MinutesAfterMeridian) || 0);
  const max = Math.max(min, Number(flipSettings?.MaxMinutesAfterMeridian) || 0);
  const exposureMinutes = Math.max(1, Number(exposureSeconds) || 0) / 60;

  const leadMinutes = pause + FLIP_TEST_LEAD_MINUTES;
  const latestFlipMinutes = pause > 0 ? min : Math.min(max, min + exposureMinutes);
  const waitTotalMinutes = leadMinutes + max + exposureMinutes + WAIT_MARGIN_MINUTES;

  return {
    leadMinutes,
    latestFlipMinutes,
    expectedMinutes: Math.ceil(leadMinutes + latestFlipMinutes + FLIP_DURATION_MINUTES),
    waitCount: Math.ceil(waitTotalMinutes / exposureMinutes),
    // Hour angles the scope passes through, start point to the latest flip.
    haFromHours: -leadMinutes / 60,
    haToHours: (Math.max(max, latestFlipMinutes) + FLIP_DURATION_MINUTES) / 60,
  };
}

// Picks the declination for the test. Every hour angle the scope passes through must stay
// above FLIP_TEST_MIN_ALTITUDE_DEG and at least FLIP_TEST_MIN_SUN_SEPARATION_DEG from the
// sun. Of the declinations that qualify, the one with the highest lowest altitude wins.
// Returns null when none qualifies.
export function findFlipTestDeclination({ lstHours, latDeg, sun, haFromHours, haToHours }) {
  if (![lstHours, latDeg, sun?.raDeg, sun?.decDeg, haFromHours, haToHours].every(Number.isFinite)) {
    return null;
  }

  const pathHourAngles = [];
  for (let h = haFromHours; h < haToHours; h += PATH_STEP_HOURS) pathHourAngles.push(h);
  pathHourAngles.push(haToHours);

  let best = null;
  for (let dec = -DEC_LIMIT_DEG; dec <= DEC_LIMIT_DEG; dec += DEC_STEP_DEG) {
    let minAltitude = Infinity;
    let minSunSeparation = Infinity;
    for (const h of pathHourAngles) {
      minAltitude = Math.min(minAltitude, altitudeDeg(h, dec, latDeg));
      const separation = angularSeparationDeg(
        raAtHourAngle(lstHours, h),
        dec,
        sun.raDeg,
        sun.decDeg
      );
      minSunSeparation = Math.min(minSunSeparation, separation);
    }
    if (minAltitude < FLIP_TEST_MIN_ALTITUDE_DEG) continue;
    if (minSunSeparation < FLIP_TEST_MIN_SUN_SEPARATION_DEG) continue;
    if (!best || minAltitude > best.minAltitudeDeg) {
      best = { decDeg: dec, minAltitudeDeg: minAltitude, minSunSeparationDeg: minSunSeparation };
    }
  }
  return best;
}

// True when any item, condition or trigger in a /sequence/state response is running.
export function isSequenceRunning(state) {
  if (Array.isArray(state)) return state.some(isSequenceRunning);
  if (!state || typeof state !== 'object') return false;
  if (state.Status === 'RUNNING') return true;
  return Object.values(state).some((v) => typeof v === 'object' && isSequenceRunning(v));
}

// Status of the flip trigger in a /sequence/state response of the test sequence, which
// carries exactly one global trigger. NINA keeps it RUNNING through the flip slew,
// settling and recentering, so leaving RUNNING marks the end of the flip.
export function flipTriggerStatus(state) {
  if (!Array.isArray(state)) return null;
  const block = state.find((entry) => Array.isArray(entry?.GlobalTriggers));
  return block?.GlobalTriggers?.[0]?.Status ?? null;
}

// NINA logs each flip step as "Meridian Flip - <step>" (English, independent of the UI
// language) and marks a failure with "... after meridian flip error", while the trigger
// itself still ends as FINISHED. This reads the most recent flip from a log list
// (any order) and names the step that ran right before the error.
const FLIP_STEP_PATTERNS = [
  ['recenter', /recenter/i],
  ['autofocus', /auto ?focus/i],
  ['settle', /settl/i],
  ['slew', /scope will flip|pier side|slew/i],
];

export function analyzeFlipLog(entries) {
  const flipLines = (Array.isArray(entries) ? entries : [])
    .filter((e) => typeof e?.message === 'string' && e.message.startsWith('Meridian Flip - '))
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  // No findLastIndex: it needs Safari 15.4, the app still targets iOS 15.
  let start = -1;
  flipLines.forEach((e, i) => {
    if (e.message.includes('Initializing Meridian Flip')) start = i;
  });
  if (start < 0) return { found: false, failed: false, failedStep: null };

  const run = flipLines.slice(start);
  const errorIndex = run.findIndex((e) => /after meridian flip error/i.test(e.message));
  if (errorIndex < 0) return { found: true, failed: false, failedStep: null };

  const before = run.slice(0, errorIndex).reverse();
  for (const entry of before) {
    const match = FLIP_STEP_PATTERNS.find(([, pattern]) => pattern.test(entry.message));
    if (match) return { found: true, failed: true, failedStep: match[0] };
  }
  return { found: true, failed: true, failedStep: 'unknown' };
}

// Outcome of the pier side comparison: 'changed', 'unchanged', or 'unknown' when the
// mount did not report a real side before and after.
export function comparePierSides(before, after) {
  if (!isPierSideKnown(before) || !isPierSideKnown(after)) return 'unknown';
  return before === after ? 'unchanged' : 'changed';
}
