import test from 'node:test';
import assert from 'node:assert/strict';
import { findLatestSolvedRotation, parseSolvedPositionAngle } from '../plateSolveLog.js';

const INVARIANT_LINE =
  'Platesolve successful: Coordinates: RA: 05:35:17; Dec: -05° 23\' 28"; Epoch: J2000 - Position Angle: 123.45';
const GERMAN_LINE =
  'Platesolve successful: Coordinates: RA: 05:35:17; Dec: -05° 23\' 28"; Epoch: J2000 - Position Angle: 123,45';

// The [0, 360) normalisation runs through a modulo, so compare with a tolerance.
function assertAngle(actual, expected) {
  assert.ok(
    typeof actual === 'number' && Math.abs(actual - expected) < 1e-9,
    `expected ${actual} to be ${expected}`
  );
}

test('parses the position angle in the invariant and the German culture', () => {
  assertAngle(parseSolvedPositionAngle(INVARIANT_LINE), 123.45);
  assertAngle(parseSolvedPositionAngle(GERMAN_LINE), 123.45);
});

test('normalises the angle into [0, 360)', () => {
  assert.equal(parseSolvedPositionAngle('Platesolve successful: Position Angle: 360'), 0);
  assertAngle(parseSolvedPositionAngle('Platesolve successful: Position Angle: -10.5'), 349.5);
  assert.equal(parseSolvedPositionAngle('Platesolve successful: Position Angle: 0'), 0);
});

test('ignores failed solves, foreign lines and unparsable angles', () => {
  assert.equal(parseSolvedPositionAngle('Platesolve failed after 3 attempts'), null);
  assert.equal(parseSolvedPositionAngle('Starting Autofocus - Position Angle: 12'), null);
  assert.equal(parseSolvedPositionAngle('Platesolve successful: Coordinates: RA: 05:35:17'), null);
  assert.equal(parseSolvedPositionAngle('Platesolve successful: Position Angle: n/a'), null);
  assert.equal(parseSolvedPositionAngle(undefined), null);
  assert.equal(parseSolvedPositionAngle(42), null);
});

test('picks the newest solve out of a log array regardless of order', () => {
  const logs = [
    { timestamp: '2026-08-26T21:00:00.0000', message: 'Platesolve successful: Position Angle: 10' },
    { timestamp: '2026-08-26T22:00:00.0000', message: 'Platesolve successful: Position Angle: 20' },
    { timestamp: '2026-08-26T23:00:00.0000', message: 'Platesolve failed' },
    { timestamp: '2026-08-26T21:30:00.0000', message: 'Autofocus finished' },
  ];
  assert.deepEqual(findLatestSolvedRotation(logs), {
    angle: 20,
    timestamp: '2026-08-26T22:00:00.0000',
  });
});

test('returns null for empty, malformed or missing log arrays', () => {
  assert.equal(findLatestSolvedRotation(null), null);
  assert.equal(findLatestSolvedRotation([]), null);
  assert.equal(findLatestSolvedRotation([null, {}, { message: 'nope' }]), null);
  assert.equal(
    findLatestSolvedRotation([
      { timestamp: 'not-a-date', message: 'Platesolve successful: Position Angle: 20' },
    ]),
    null
  );
});
