import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

const { useFramingStore } = await import('@/store/framingStore');
const { useLogStore } = await import('@/store/logStore');

// The [0, 360) normalisation runs through a modulo, so compare with a tolerance.
function assertAngle(actual, expected) {
  assert.ok(
    typeof actual === 'number' && Math.abs(actual - expected) < 1e-9,
    `expected ${actual} to be ${expected}`
  );
}

function setup() {
  freshPinia();
  return { framingStore: useFramingStore(), logStore: useLogStore() };
}

function solveLine(timestamp, angle) {
  return {
    timestamp,
    level: 'INFO',
    source: 'ImageSolver.cs',
    member: 'Solve',
    message: `Platesolve successful: Coordinates: RA: 20:26:12; Dec: 88° 43' 10"; Epoch: J2000 - Position Angle: ${angle}`,
  };
}

function otherLine(timestamp) {
  return {
    timestamp,
    level: 'INFO',
    source: 'MyMessageBoxHub.cs',
    member: 'OnConnectedAsync',
    message: 'Client connected to MyMessageBoxHub',
  };
}

test('a fresh solve is applied although the host clock is a day behind the phone', () => {
  const { framingStore, logStore } = setup();
  // PINS right after boot: the host still runs on a stale clock, so a solve
  // written seconds ago looks more than a day old to the phone.
  logStore.updateSolvedRotation([
    otherLine('2026-09-25T17:40:05.0000'),
    solveLine('2026-09-25T17:40:02.0000', 89.658),
  ]);
  assertAngle(framingStore.solvedRotationAngle, 89.658);
  assertAngle(framingStore.rotationAngle, 89.658);
});

test('a solve older than ten minutes by the host clock is not applied at start', () => {
  const { framingStore, logStore } = setup();
  framingStore.rotationAngle = 10;
  logStore.updateSolvedRotation([
    otherLine('2026-09-26T21:40:00.0000'),
    solveLine('2026-09-26T21:10:00.0000', 89.658),
  ]);
  assert.equal(framingStore.hasSolvedRotation, false);
  assert.equal(framingStore.rotationAngle, 10);
});

test('after the host clock is corrected the next solve still wins', () => {
  const { framingStore, logStore } = setup();
  logStore.updateSolvedRotation([solveLine('2026-09-25T17:40:02.0000', 89.658)]);
  logStore.updateSolvedRotation([
    otherLine('2026-09-26T21:01:00.0000'),
    solveLine('2026-09-26T21:00:50.0000', 85.6),
    solveLine('2026-09-25T17:40:02.0000', 89.658),
  ]);
  assertAngle(framingStore.solvedRotationAngle, 85.6);
});
