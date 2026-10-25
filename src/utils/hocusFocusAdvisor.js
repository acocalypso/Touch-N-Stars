// Plain-language advice for Hocus Focus autofocus runs. Pure functions only, so the focus page,
// the setup assistant and the tests share one set of rules.
//
// The target comes from the Hocus Focus quick start: the sweep should bracket focus with roughly
// four points per side, and the stars at the outer points should be about three times as wide as
// in focus. The thresholds below are deliberately loose around that target; they are tuned on
// real runs (see docs/features/hocus-focus-simple-setup.md).

export const EDGE_RATIO_TOO_FLAT = 1.8;
export const EDGE_RATIO_TOO_STEEP = 5;
export const STEP_SIZE_GROW = 1.5;
export const STEP_SIZE_SHRINK = 0.7;
export const MIN_STARS = 15;
export const STAR_LOSS_RATIO = 0.3;
export const EXPOSURE_GROW = 2;
export const FINAL_HFR_WORSE_RATIO = 1.1;
export const DEFAULT_R2_THRESHOLD = 0.8;

// Upper bounds of the matching NINA profile inputs in FocusSettingsPanel.vue.
const MAX_OFFSET_STEPS = 10;
const MAX_EXPOSURE = 9999;
const MAX_STEP_SIZE = 100000;

// Image scale in arcsec per pixel.
export function imageScale(focalLength, pixelSize, binning = 1) {
  const f = Number(focalLength);
  const px = Number(pixelSize);
  const bin = Number(binning) > 0 ? Number(binning) : 1;
  if (!(f > 0) || !(px > 0)) return null;
  return (206.265 * px * bin) / f;
}

// Maps the image scale onto Hocus Focus' simple-mode "Pixel Scale" preset.
export function suggestPixelScalePreset(scale) {
  if (!(scale > 0)) return null;
  if (scale > 3) return 'WideField';
  if (scale < 1) return 'LongFocalLength';
  return 'Typical';
}

const SEVERITY_RANK = { error: 0, warn: 1, info: 2 };

function finding(id, severity, params = {}, fix = null) {
  return { id, severity, params, fix };
}

function round(value, max) {
  return Math.min(max, Math.max(1, Math.round(value)));
}

// Evaluates a response of GET hocusfocus/autofocus/last-run.
//
// `settings` carries the values a fix builds on:
//   stepSize, offsetSteps, exposureTime   NINA FocuserSettings
//   rSquaredThreshold                     Hocus Focus AF option
//   focusRange                            Hocus Focus Simple_FocusRange
//
// Returns null when there is nothing to judge (no run, run still going, too few points),
// otherwise { findings } sorted by severity; an empty list means the run looks good.
export function evaluateRun(run, settings = {}) {
  if (!run || run.Success === false) return null;

  if (run.IsActiveAutoFocuser === false) {
    return { findings: [finding('notActive', 'error')] };
  }
  if (run.InProgress) return null;

  const points = (Array.isArray(run.Points) ? run.Points : []).filter(
    (p) => !p?.Rejected && Number.isFinite(p?.HFR) && Number.isFinite(p?.Position)
  );
  if (points.length < 3) return null;
  points.sort((a, b) => a.Position - b.Position);

  const findings = [];
  const { stepSize, offsetSteps, exposureTime, focusRange } = settings;
  const hasStep = Number(stepSize) > 0;

  // Star count first: with too few stars every other number is noise.
  const starMax = Number(run.AcceptedStarCountMax);
  const starMin = Number(run.AcceptedStarCountMin);
  if (Number.isFinite(starMax) && starMax < MIN_STARS) {
    const exposure = Number(exposureTime);
    findings.push(
      finding(
        'fewStars',
        'error',
        { stars: starMax, narrowband: isNarrowband(run.Filter) },
        exposure > 0
          ? {
              target: 'profile',
              key: 'FocuserSettings-AutoFocusExposureTime',
              value: Math.min(MAX_EXPOSURE, Math.round(exposure * EXPOSURE_GROW * 10) / 10),
            }
          : null
      )
    );
  }

  let minIndex = 0;
  points.forEach((p, i) => {
    if (p.HFR < points[minIndex].HFR) minIndex = i;
  });
  const minHfr = points[minIndex].HFR;

  if (minIndex === 0 || minIndex === points.length - 1) {
    const steps = Number(offsetSteps);
    findings.push(
      finding(
        'notBracketed',
        'error',
        { side: minIndex === 0 ? 'inward' : 'outward' },
        steps > 0 && steps < MAX_OFFSET_STEPS
          ? {
              target: 'profile',
              key: 'FocuserSettings-AutoFocusInitialOffsetSteps',
              value: Math.min(MAX_OFFSET_STEPS, steps + 2),
            }
          : null
      )
    );
  } else if (minHfr > 0) {
    // Both ends have to rise, so the flatter end decides.
    const edgeRatio = Math.min(points[0].HFR, points[points.length - 1].HFR) / minHfr;
    const ratio = Math.round(edgeRatio * 10) / 10;
    if (edgeRatio < EDGE_RATIO_TOO_FLAT) {
      findings.push(
        finding(
          'tooFlat',
          'warn',
          { ratio },
          hasStep
            ? {
                target: 'profile',
                key: 'FocuserSettings-AutoFocusStepSize',
                value: round(stepSize * STEP_SIZE_GROW, MAX_STEP_SIZE),
              }
            : null
        )
      );
    } else if (edgeRatio > EDGE_RATIO_TOO_STEEP) {
      findings.push(
        finding(
          'tooSteep',
          'warn',
          { ratio },
          hasStep
            ? {
                target: 'profile',
                key: 'FocuserSettings-AutoFocusStepSize',
                value: round(stepSize * STEP_SIZE_SHRINK, MAX_STEP_SIZE),
              }
            : null
        )
      );
    }
  }

  // Many stars in focus but few at the defocused ends: the detector drops the donuts.
  if (
    Number.isFinite(starMax) &&
    starMax >= MIN_STARS &&
    Number.isFinite(starMin) &&
    starMin < starMax * STAR_LOSS_RATIO &&
    focusRange !== 'WideRange'
  ) {
    findings.push(
      finding(
        'starsLost',
        'warn',
        { min: starMin, max: starMax },
        { target: 'hf-sd', key: 'Simple_FocusRange', value: 'WideRange' }
      )
    );
  }

  const r2 = run.RSquares?.Hyperbolic;
  const r2Threshold = Number(settings.rSquaredThreshold) || DEFAULT_R2_THRESHOLD;
  if (typeof r2 === 'number' && r2 < r2Threshold) {
    findings.push(finding('poorFit', 'warn', { r2: Math.round(r2 * 100) / 100 }));
  }

  const initial = Number(run.InitialHFR);
  const final = Number(run.FinalHFR);
  if (initial > 0 && final > initial * FINAL_HFR_WORSE_RATIO) {
    findings.push(
      finding('worseAfter', 'info', {
        initial: Math.round(initial * 100) / 100,
        final: Math.round(final * 100) / 100,
      })
    );
  }

  findings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  return { findings };
}

function isNarrowband(filter) {
  return /\b(ha|h-alpha|halpha|oiii|o3|sii|s2|nb|narrow)/i.test(String(filter || ''));
}

// Setup problems that are visible before any run.
//   profile             NINA profile (TelescopeSettings, CameraSettings, FocuserSettings)
//   starDetection       Hocus Focus star-detection options
//   autoFocus           Hocus Focus AF options
export function checkPrerequisites(profile, starDetection, autoFocus) {
  const issues = [];
  const focalLength = Number(profile?.TelescopeSettings?.FocalLength);
  const pixelSize = Number(profile?.CameraSettings?.PixelSize);
  if (!(focalLength > 0) || !(pixelSize > 0)) issues.push('missingOptics');

  if (autoFocus && (!autoFocus.Save || !String(autoFocus.SavePath || '').trim())) {
    issues.push('saveDisabled');
  }

  const afBinning = Number(profile?.FocuserSettings?.AutoFocusBinning) || 1;
  if (starDetection && starDetection.DetectionBinning !== 'Bin1' && afBinning > 1) {
    issues.push('binningStacked');
  }
  return issues;
}

// The values evaluateRun() builds its fixes on, from the NINA profile and the two HF option sets.
export function advisorSettings(profile, autoFocus, starDetection) {
  const focuser = profile?.FocuserSettings || {};
  return {
    stepSize: focuser.AutoFocusStepSize,
    offsetSteps: focuser.AutoFocusInitialOffsetSteps,
    exposureTime: focuser.AutoFocusExposureTime,
    rSquaredThreshold: autoFocus?.RSquaredRejectionThreshold,
    focusRange: starDetection?.Simple_FocusRange,
  };
}

const FIX_LABELS = {
  'FocuserSettings-AutoFocusStepSize': 'stepSize',
  'FocuserSettings-AutoFocusInitialOffsetSteps': 'offsetSteps',
  'FocuserSettings-AutoFocusExposureTime': 'exposure',
  Simple_FocusRange: 'focusRange',
};

// i18n key suffix for the button that applies a fix.
export function fixLabelKey(fix) {
  return FIX_LABELS[fix?.key] || 'generic';
}

// Identifies an image-history entry; older backends may omit the Id.
export function historyEntryId(entry) {
  return entry?.Id || `${entry?.Date}|${entry?.Filename}`;
}

// The newest and the sharpest frame among the image-history entries not in `ignoreIds` (the
// frames that existed before focusing by hand started). Each entry carries the focuser position
// NINA recorded for that frame, so moving the focuser while the next frame downloads cannot mix
// up the pairing. History is oldest first.
export function focusSamples(history, ignoreIds = new Set()) {
  let latest = null;
  let best = null;
  for (const entry of Array.isArray(history) ? history : []) {
    const hfr = Number(entry?.HFR);
    const position = entry?.FocuserPosition;
    // typeof, not Number(): Number(null) would turn a missing position into 0.
    if (!(hfr > 0) || typeof position !== 'number' || !Number.isFinite(position)) continue;
    if (ignoreIds.has(historyEntryId(entry))) continue;
    latest = { hfr, position, stars: entry.Stars ?? null };
    if (!best || hfr < best.hfr) best = latest;
  }
  return { latest, best };
}
