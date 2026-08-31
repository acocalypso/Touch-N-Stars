import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

const { useFramingStore } = await import('@/store/framingStore');

function setup() {
  freshPinia();
  return useFramingStore();
}

const T1 = '2026-08-26T22:00:00.0000';
const T2 = '2026-08-26T22:05:00.0000';

test('a solve fills the measured value and, by "last value wins", the target angle', () => {
  const framingStore = setup();
  framingStore.rotationAngle = 10;

  assert.equal(framingStore.applySolvedRotation(123.5, T1), true);
  assert.equal(framingStore.solvedRotationAngle, 123.5);
  assert.equal(framingStore.solvedRotationTime, T1);
  assert.equal(framingStore.rotationAngle, 123.5);
});

test('the same solve is never applied twice, so a manual angle survives', () => {
  const framingStore = setup();
  framingStore.applySolvedRotation(123.5, T1);

  // The log line stays inside the 500-entry window and is re-read every second;
  // without the timestamp guard it would overwrite the user's angle each tick.
  framingStore.rotationAngle = 42;
  assert.equal(framingStore.applySolvedRotation(123.5, T1), false);
  assert.equal(framingStore.rotationAngle, 42);
  assert.equal(framingStore.solvedRotationAngle, 123.5);
});

test('an older solve never overwrites a newer one', () => {
  const framingStore = setup();
  framingStore.applySolvedRotation(200, T2);

  assert.equal(framingStore.applySolvedRotation(100, T1), false);
  assert.equal(framingStore.solvedRotationAngle, 200);
  assert.equal(framingStore.solvedRotationTime, T2);
});

test('a newer solve wins', () => {
  const framingStore = setup();
  framingStore.applySolvedRotation(100, T1);

  assert.equal(framingStore.applySolvedRotation(200, T2), true);
  assert.equal(framingStore.solvedRotationAngle, 200);
  assert.equal(framingStore.rotationAngle, 200);
});

test('an invalid angle or timestamp is discarded and leaves the state untouched', () => {
  const framingStore = setup();
  framingStore.rotationAngle = 10;

  for (const angle of [Number.NaN, null, undefined, '123', Number.POSITIVE_INFINITY]) {
    assert.equal(framingStore.applySolvedRotation(angle, T1), false);
  }
  assert.equal(framingStore.applySolvedRotation(123, 'not-a-date'), false);

  assert.equal(framingStore.solvedRotationAngle, null);
  assert.equal(framingStore.solvedRotationTime, null);
  assert.equal(framingStore.rotationAngle, 10);
});

test('hasSolvedRotation reflects whether a solve has arrived', () => {
  const framingStore = setup();
  assert.equal(framingStore.hasSolvedRotation, false);

  framingStore.applySolvedRotation(0, T1);
  // 0° is a valid solve, not "no value" — a truthiness check would drop it.
  assert.equal(framingStore.hasSolvedRotation, true);
});

test('resetSolvedRotation clears the measured value for the next instance', () => {
  const framingStore = setup();
  framingStore.applySolvedRotation(123.5, T1);

  framingStore.resetSolvedRotation();

  assert.equal(framingStore.solvedRotationAngle, null);
  assert.equal(framingStore.solvedRotationTime, null);
  assert.equal(framingStore.hasSolvedRotation, false);
  // With the timestamp marker gone the same solve may be adopted again on the
  // next poll; that is the documented behaviour of criterion 6, not a leak.
  assert.equal(framingStore.applySolvedRotation(123.5, T1), true);
});
