import test from 'node:test';
import assert from 'node:assert/strict';

const {
  FLIP_TEST_LEAD_MINUTES,
  FLIP_TEST_MIN_ALTITUDE_DEG,
  FLIP_TEST_MIN_SUN_SEPARATION_DEG,
  altitudeDeg,
  analyzeFlipLog,
  comparePierSides,
  findFlipTestDeclination,
  flipTriggerStatus,
  isSequenceRunning,
  planFlipTest,
} = await import('@/utils/meridianFlipDayTest');
const { angularSeparationDeg } = await import('@/utils/astronomy');

const LST_HOURS = 6;
const LAT_DEG = 48;
const FEW = { PauseTimeBeforeMeridian: 0, MinutesAfterMeridian: 5, MaxMinutesAfterMeridian: 15 };

// Checks the promises findFlipTestDeclination makes about the declination it returns.
function assertSafe(result, sun, latDeg, plan) {
  for (let h = plan.haFromHours; h <= plan.haToHours; h += 0.05) {
    const raDeg = ((((LST_HOURS - h) * 15) % 360) + 360) % 360;
    assert.ok(altitudeDeg(h, result.decDeg, latDeg) >= FLIP_TEST_MIN_ALTITUDE_DEG - 0.5);
    assert.ok(
      angularSeparationDeg(raDeg, result.decDeg, sun.raDeg, sun.decDeg) >=
        FLIP_TEST_MIN_SUN_SEPARATION_DEG - 0.5
    );
  }
}

test('altitudeDeg: on the meridian the altitude is 90 - |lat - dec|', () => {
  assert.ok(Math.abs(altitudeDeg(0, 20, 48) - 62) < 1e-9);
  assert.ok(Math.abs(altitudeDeg(0, 48, 48) - 90) < 1e-9);
});

test('planFlipTest: short exposures flip one exposure after the earliest time', () => {
  const plan = planFlipTest(FEW, 60);
  assert.equal(plan.leadMinutes, FLIP_TEST_LEAD_MINUTES);
  assert.equal(plan.latestFlipMinutes, 6);
  assert.equal(plan.haFromHours, -FLIP_TEST_LEAD_MINUTES / 60);
});

test('planFlipTest: long exposures are capped at the latest time', () => {
  assert.equal(planFlipTest(FEW, 1200).latestFlipMinutes, 15);
});

test('planFlipTest: a pause starts the test east of the pause and flips at the earliest time', () => {
  const plan = planFlipTest(
    { PauseTimeBeforeMeridian: 2, MinutesAfterMeridian: 0, MaxMinutesAfterMeridian: 2 },
    300
  );
  assert.equal(plan.leadMinutes, 2 + FLIP_TEST_LEAD_MINUTES);
  assert.equal(plan.latestFlipMinutes, 0);
});

test('planFlipTest: the wait loop outlasts the latest flip', () => {
  const plan = planFlipTest(FEW, 300);
  assert.ok(plan.waitCount * 5 > plan.leadMinutes + 15 + 5);
});

test('findFlipTestDeclination keeps the sun at a distance at summer noon', () => {
  const plan = planFlipTest(FEW, 300);
  const sun = { raDeg: LST_HOURS * 15, decDeg: 23.4 };
  const result = findFlipTestDeclination({ lstHours: LST_HOURS, latDeg: LAT_DEG, sun, ...plan });
  assert.ok(result);
  assertSafe(result, sun, LAT_DEG, plan);
});

test('findFlipTestDeclination works in the southern hemisphere', () => {
  const plan = planFlipTest(FEW, 300);
  const sun = { raDeg: LST_HOURS * 15, decDeg: -23.4 };
  const result = findFlipTestDeclination({ lstHours: LST_HOURS, latDeg: -33, sun, ...plan });
  assert.ok(result);
  assertSafe(result, sun, -33, plan);
});

test('findFlipTestDeclination returns null without mount time, site or sun position', () => {
  const plan = planFlipTest(FEW, 300);
  const sun = { raDeg: 0, decDeg: 0 };
  assert.equal(findFlipTestDeclination({ lstHours: NaN, latDeg: LAT_DEG, sun, ...plan }), null);
  assert.equal(findFlipTestDeclination({ lstHours: 6, latDeg: undefined, sun, ...plan }), null);
  assert.equal(findFlipTestDeclination({ lstHours: 6, latDeg: LAT_DEG, sun: null, ...plan }), null);
});

test('findFlipTestDeclination returns null when the sun blocks every declination', () => {
  // Not a real sky (the sun never reaches dec 45), but it exercises the refusal path:
  // at lat 80 only dec 20..70 clears the altitude limit, and all of it lies within 45°
  // of a sun on the meridian at dec 45.
  const plan = planFlipTest(FEW, 300);
  const sun = { raDeg: LST_HOURS * 15, decDeg: 45 };
  assert.equal(findFlipTestDeclination({ lstHours: LST_HOURS, latDeg: 80, sun, ...plan }), null);
});

test('isSequenceRunning finds a running item anywhere in the state', () => {
  const idle = [{ GlobalTriggers: [{ Status: 'CREATED' }] }, { Items: [{ Status: 'FINISHED' }] }];
  assert.equal(isSequenceRunning(idle), false);
  const running = [{ Items: [{ Items: [{ Status: 'RUNNING' }] }] }];
  assert.equal(isSequenceRunning(running), true);
  assert.equal(isSequenceRunning(null), false);
});

test('flipTriggerStatus reads the global trigger of the test sequence', () => {
  const state = [
    { GlobalTriggers: [{ Name: 'Meridianflip_Trigger', Status: 'RUNNING' }] },
    { Items: [], Name: 'Start_Container' },
  ];
  assert.equal(flipTriggerStatus(state), 'RUNNING');
  assert.equal(flipTriggerStatus([{ GlobalTriggers: [] }]), null);
  assert.equal(flipTriggerStatus(null), null);
});

// Recorded from NINA (PINS, INDI telescope simulator, no camera), newest first as the
// plugin's /api/logs returns it.
const FAILED_FLIP_LOG = [
  ['20:01:48.315', 'Meridian Flip - Re-enable Tracking after meridian flip error'],
  ['20:01:48.306', 'Meridian Flip - Resuming Autoguider'],
  ['20:01:48.300', 'Meridian Flip - Resuming Autoguider after meridian flip error'],
  ['20:01:48.223', 'Meridian Flip - Recenter after meridian flip'],
  ['20:01:19.198', 'Meridian Flip - Settling scope for 30'],
  ['20:00:40.861', 'Meridian Flip - Scope will flip to coordinates RA: 20:58:24'],
  ['20:00:39.818', 'Meridian Flip - Initializing Meridian Flip.'],
  ['19:52:17.692', 'Meridian Flip - Telescope is not tracking. Skip flip evaluation'],
].map(([time, message]) => ({ timestamp: `2026-10-24T${time}`, message }));

test('analyzeFlipLog names the step that failed', () => {
  assert.deepEqual(analyzeFlipLog(FAILED_FLIP_LOG), {
    found: true,
    failed: true,
    failedStep: 'recenter',
  });
});

test('analyzeFlipLog reports a clean flip and an absent one', () => {
  const clean = FAILED_FLIP_LOG.filter((e) => !/error|Recenter|Autoguider/.test(e.message));
  assert.deepEqual(analyzeFlipLog(clean), { found: true, failed: false, failedStep: null });
  assert.deepEqual(analyzeFlipLog([]), { found: false, failed: false, failedStep: null });
  assert.deepEqual(analyzeFlipLog(null), { found: false, failed: false, failedStep: null });
});

test('analyzeFlipLog only looks at the most recent flip', () => {
  const older = FAILED_FLIP_LOG.map((e) => ({
    ...e,
    timestamp: e.timestamp.replace('2026-10-24', '2026-10-23'),
  }));
  const newer = FAILED_FLIP_LOG.filter((e) => !/error|Recenter|Autoguider/.test(e.message));
  assert.equal(analyzeFlipLog([...older, ...newer]).failed, false);
});

test('comparePierSides', () => {
  assert.equal(comparePierSides('pierWest', 'pierEast'), 'changed');
  assert.equal(comparePierSides('pierWest', 'pierWest'), 'unchanged');
  assert.equal(comparePierSides('pierUnknown', 'pierEast'), 'unknown');
  assert.equal(comparePierSides(undefined, undefined), 'unknown');
});
