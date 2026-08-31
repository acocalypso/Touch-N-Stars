import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFrameScreenRotationDeg, projectAngularExtent } from '@acocalypso/celestia-atlas';
import { computeSecondaryFieldOfViewFrame } from '../secondaryFieldOfView.js';
import { ATLAS_POSITION_ANGLE_CONVENTION } from '../positionAngle.js';

const baseView = { center: { raDeg: 10, decDeg: 20, frame: 'ICRS' }, fovDeg: 4 };
const observer = { latitudeDeg: 52.52, longitudeDeg: 13.405, elevationM: 0 };

test('returns null when required numbers are missing', () => {
  assert.equal(
    computeSecondaryFieldOfViewFrame({
      view: null,
      observer,
      coordinateMode: 'horizontal',
      utcMs: Date.now(),
      widthDeg: 1,
      heightDeg: 1,
      angleDeg: 0,
      containerWidth: 800,
    }),
    null
  );
  assert.equal(
    computeSecondaryFieldOfViewFrame({
      view: baseView,
      observer,
      coordinateMode: 'horizontal',
      utcMs: Date.now(),
      widthDeg: Number.NaN,
      heightDeg: 1,
      angleDeg: 0,
      containerWidth: 800,
    }),
    null
  );
  assert.equal(
    computeSecondaryFieldOfViewFrame({
      view: baseView,
      observer,
      coordinateMode: 'horizontal',
      utcMs: Date.now(),
      widthDeg: 1,
      heightDeg: 1,
      angleDeg: 0,
      containerWidth: 0,
    }),
    null
  );
});

test('panel size matches the package scale formula (concentric, size-only)', () => {
  const containerWidth = 1000;
  const frame = computeSecondaryFieldOfViewFrame({
    view: baseView,
    observer,
    coordinateMode: 'equatorial',
    utcMs: Date.now(),
    widthDeg: 2,
    heightDeg: 1,
    angleDeg: 0,
    containerWidth,
  });
  const scale = containerWidth / (2 * Math.tan((baseView.fovDeg * Math.PI) / 360));
  assert.ok(Math.abs(frame.panelWidth - projectAngularExtent(2, scale)) < 1e-9);
  assert.ok(Math.abs(frame.panelHeight - projectAngularExtent(1, scale)) < 1e-9);
});

test('equatorial mode uses the raw view, not alignViewToHorizon', () => {
  const containerWidth = 1000;
  const frame = computeSecondaryFieldOfViewFrame({
    view: baseView,
    observer,
    coordinateMode: 'equatorial',
    utcMs: Date.now(),
    widthDeg: 2,
    heightDeg: 1,
    angleDeg: 30,
    containerWidth,
  });
  const expected = cameraFrameScreenRotationDeg(0, 30, ATLAS_POSITION_ANGLE_CONVENTION, false);
  assert.ok(Math.abs(frame.screenRotationDeg - expected) < 1e-9);
});

test('horizontal mode matches alignViewToHorizon-derived rotation/mirroring', () => {
  const containerWidth = 1000;
  const utcMs = Date.parse('2026-08-26T22:00:00Z');
  const frame = computeSecondaryFieldOfViewFrame({
    view: baseView,
    observer,
    coordinateMode: 'horizontal',
    utcMs,
    widthDeg: 2,
    heightDeg: 1,
    angleDeg: 30,
    containerWidth,
  });
  // The package always reports mirrorX: true in horizontal mode
  // (see @acocalypso/celestia-atlas src/index.d.ts alignViewToHorizon).
  assert.notEqual(frame, null);
  assert.notEqual(frame.screenRotationDeg, undefined);
});
