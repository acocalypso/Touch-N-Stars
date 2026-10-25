import test from 'node:test';
import assert from 'node:assert/strict';

const advisor = await import('@/utils/hocusFocusAdvisor');
const { imageScale, suggestPixelScalePreset, evaluateRun, checkPrerequisites } = advisor;

// Builds a last-run response from HFR values at evenly spaced focuser positions.
function makeRun(hfrs, overrides = {}) {
  return {
    Success: true,
    IsActiveAutoFocuser: true,
    InProgress: false,
    Filter: '',
    InitialHFR: 3,
    FinalHFR: 2,
    AcceptedStarCountMin: 80,
    AcceptedStarCountMax: 120,
    RSquares: { Hyperbolic: 0.97, Quadratic: null, LeftTrend: 0, RightTrend: 0 },
    Points: hfrs.map((HFR, i) => ({
      Position: 1000 + i * 100,
      HFR,
      Error: 0.1,
      Rejected: false,
      Excluded: false,
    })),
    ...overrides,
  };
}

const settings = {
  stepSize: 50,
  offsetSteps: 4,
  exposureTime: 2,
  rSquaredThreshold: 0.8,
  focusRange: 'Typical',
};
const ids = (result) => result.findings.map((f) => f.id);

// Simulator run on the PINS test Pi (Sky Simulator camera + focuser, step size 50): the curve
// barely rises at the edges.
const simulatorRun = {
  Success: true,
  IsActiveAutoFocuser: true,
  InProgress: false,
  Filter: '',
  InitialHFR: 1.3821655311381282,
  FinalHFR: 1.3909506530518332,
  AcceptedStarCountMin: 98,
  AcceptedStarCountMax: 110,
  RSquares: { Hyperbolic: 0.9915386873417262, Quadratic: null, LeftTrend: 0, RightTrend: 0 },
  Points: [
    [24700, 1.828],
    [24750, 1.678],
    [24800, 1.529],
    [24850, 1.462],
    [24900, 1.412],
    [24950, 1.388],
    [25000, 1.414],
    [25050, 1.482],
    [25100, 1.537],
    [25150, 1.67],
  ].map(([Position, HFR]) => ({ Position, HFR, Error: 0.1, Rejected: false, Excluded: false })),
};

test('imageScale and the pixel-scale preset follow focal length, pixel size and binning', () => {
  assert.equal(Math.round(imageScale(512, 2.9) * 100) / 100, 1.17);
  assert.equal(Math.round(imageScale(512, 2.9, 2) * 100) / 100, 2.34);
  assert.equal(imageScale(0, 2.9), null);
  assert.equal(suggestPixelScalePreset(imageScale(512, 2.9)), 'Typical');
  assert.equal(suggestPixelScalePreset(imageScale(250, 3.76, 2)), 'WideField');
  assert.equal(suggestPixelScalePreset(imageScale(2000, 3.76)), 'LongFocalLength');
  assert.equal(suggestPixelScalePreset(null), null);
});

test('a well bracketed curve gives no findings', () => {
  const result = evaluateRun(makeRun([6, 4.5, 3.2, 2.3, 2, 2.3, 3.1, 4.4, 6.2]), settings);
  assert.deepEqual(result.findings, []);
});

test('the simulator run is too flat and proposes a larger step size', () => {
  const result = evaluateRun(simulatorRun, settings);
  assert.deepEqual(ids(result), ['tooFlat']);
  assert.deepEqual(result.findings[0].fix, {
    target: 'profile',
    key: 'FocuserSettings-AutoFocusStepSize',
    value: 75,
  });
});

test('a steep curve proposes a smaller step size', () => {
  const result = evaluateRun(makeRun([14, 9, 4, 2, 4, 9, 13]), settings);
  assert.deepEqual(ids(result), ['tooSteep']);
  assert.equal(result.findings[0].fix.value, 35);
});

test('a minimum at the edge means focus was not bracketed', () => {
  const result = evaluateRun(makeRun([2, 2.5, 3.2, 4, 5]), settings);
  assert.deepEqual(ids(result), ['notBracketed']);
  assert.equal(result.findings[0].params.side, 'inward');
  assert.deepEqual(result.findings[0].fix, {
    target: 'profile',
    key: 'FocuserSettings-AutoFocusInitialOffsetSteps',
    value: 6,
  });
});

test('too few stars come first and propose a longer exposure', () => {
  const result = evaluateRun(
    makeRun([6, 4, 2, 4, 6], {
      AcceptedStarCountMin: 3,
      AcceptedStarCountMax: 8,
      RSquares: { Hyperbolic: 0.5 },
      Filter: 'Ha',
    }),
    settings
  );
  assert.equal(ids(result)[0], 'fewStars');
  assert.equal(result.findings[0].params.narrowband, true);
  assert.equal(result.findings[0].fix.value, 4);
  assert.ok(ids(result).includes('poorFit'));
  // starsLost needs enough stars in focus to be meaningful
  assert.ok(!ids(result).includes('starsLost'));
});

test('stars lost at the defocused ends suggest the wide focus range once', () => {
  const run = makeRun([6, 4, 2, 4, 6], { AcceptedStarCountMin: 10, AcceptedStarCountMax: 120 });
  assert.deepEqual(evaluateRun(run, settings).findings[0].fix, {
    target: 'hf-sd',
    key: 'Simple_FocusRange',
    value: 'WideRange',
  });
  assert.deepEqual(evaluateRun(run, { ...settings, focusRange: 'WideRange' }).findings, []);
});

test('a worse final HFR is reported without a fix', () => {
  const result = evaluateRun(makeRun([6, 4, 2, 4, 6], { InitialHFR: 2, FinalHFR: 2.6 }), settings);
  assert.deepEqual(ids(result), ['worseAfter']);
  assert.equal(result.findings[0].fix, null);
});

test('a run from NINA’s own autofocus engine is flagged', () => {
  assert.deepEqual(ids(evaluateRun({ Success: true, IsActiveAutoFocuser: false }, settings)), [
    'notActive',
  ]);
});

test('nothing to judge yields null', () => {
  assert.equal(evaluateRun(null, settings), null);
  assert.equal(evaluateRun({ Success: false, Error: 'No AutoFocus run' }, settings), null);
  assert.equal(evaluateRun(makeRun([3, 2, 3], { InProgress: true }), settings), null);
  assert.equal(evaluateRun(makeRun([3, 2]), settings), null);
  assert.equal(evaluateRun({ Success: true, IsActiveAutoFocuser: true }, settings), null);
});

test('fixes are left out when the base value is unknown', () => {
  const result = evaluateRun(simulatorRun, {});
  assert.deepEqual(ids(result), ['tooFlat']);
  assert.equal(result.findings[0].fix, null);
});

test('checkPrerequisites reports missing optics, disabled saving and stacked binning', () => {
  const profile = {
    TelescopeSettings: { FocalLength: 0 },
    CameraSettings: { PixelSize: 3.76 },
    FocuserSettings: { AutoFocusBinning: 2 },
  };
  assert.deepEqual(
    checkPrerequisites(profile, { DetectionBinning: 'Bin2' }, { Save: true, SavePath: ' ' }),
    ['missingOptics', 'saveDisabled', 'binningStacked']
  );
  assert.deepEqual(
    checkPrerequisites(
      {
        TelescopeSettings: { FocalLength: 512 },
        CameraSettings: { PixelSize: 2.9 },
        FocuserSettings: { AutoFocusBinning: 1 },
      },
      { DetectionBinning: 'Bin2' },
      { Save: true, SavePath: '/home/pi/af' }
    ),
    []
  );
});

test('focusSamples returns the newest and the sharpest new frame with its focuser position', () => {
  const { focusSamples, historyEntryId } = advisor;
  const old = { Id: 'a', HFR: 1.1, FocuserPosition: 900, Stars: 80 };
  const history = [
    old,
    { Id: 'b', HFR: 2.4, FocuserPosition: 1000, Stars: 40 },
    { Id: 'c', HFR: 1.6, FocuserPosition: 1100, Stars: 70 },
    { Id: 'd', HFR: 1.9, FocuserPosition: 1150, Stars: 60 },
    { Id: 'e', HFR: 0, FocuserPosition: 1200 },
    { Id: 'f', HFR: 1.2, FocuserPosition: null },
  ];
  assert.deepEqual(focusSamples(history, new Set([historyEntryId(old)])), {
    latest: { hfr: 1.9, position: 1150, stars: 60 },
    best: { hfr: 1.6, position: 1100, stars: 70 },
  });
  assert.deepEqual(focusSamples([old], new Set(['a'])), { latest: null, best: null });
  assert.deepEqual(focusSamples(null), { latest: null, best: null });
  assert.equal(historyEntryId({ Date: 'x', Filename: 'y.fits' }), 'x|y.fits');
});
