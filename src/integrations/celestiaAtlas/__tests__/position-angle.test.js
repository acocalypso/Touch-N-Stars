import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  ATLAS_POSITION_ANGLE_CONVENTION,
  POSITION_ANGLE_SOURCE,
  normalizePositionAngleDegrees,
  positionAngleFromFitsAnalysis,
  positionAngleFromNinaPlateSolve,
  toAtlasPositionAngle,
} from '../positionAngle.js';

test('normalizes the canonical Atlas position angle to [0, 360)', () => {
  assert.equal(ATLAS_POSITION_ANGLE_CONVENTION, 'clockwise-from-celestial-north');
  assert.equal(normalizePositionAngleDegrees(360), 0);
  assert.equal(normalizePositionAngleDegrees(-10), 350);
  assert.equal(normalizePositionAngleDegrees(721.5), 1.5);
  assert.equal(normalizePositionAngleDegrees(Number.NaN), null);
  assert.equal(normalizePositionAngleDegrees(undefined), null);
});

test('passes NINA plate-solve PositionAngle through after range normalization', () => {
  assert.equal(positionAngleFromNinaPlateSolve(37.5), 37.5);
  assert.equal(positionAngleFromNinaPlateSolve(-1), 359);
  assert.equal(toAtlasPositionAngle(90, POSITION_ANGLE_SOURCE.NINA_PLATE_SOLVE), 90);
});

test('converts NINA FITS WCS Rotation to its PositionAngle', () => {
  assert.equal(positionAngleFromFitsAnalysis({ rotation: 0, solvedFromWcs: true }), 0);
  assert.equal(positionAngleFromFitsAnalysis({ rotation: 90, solvedFromWcs: true }), 270);
  assert.equal(positionAngleFromFitsAnalysis({ rotation: 350, solvedFromWcs: true }), 10);
  assert.equal(positionAngleFromFitsAnalysis({ rotation: 90, solvedFromWcs: false }), 90);
  assert.equal(positionAngleFromFitsAnalysis({ rotation: null, solvedFromWcs: true }), null);
  assert.equal(positionAngleFromFitsAnalysis({ solvedFromWcs: true }), null);
});

test('routes both automatic image-angle sources through the provenance boundary', async () => {
  const [cameraStore, fitsSolve, atlasView] = await Promise.all([
    readFile(new URL('../../../store/cameraStore.js', import.meta.url), 'utf8'),
    readFile(
      new URL('../../../components/fitsPlatesolve/FitsPlateSolve.vue', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../../../views/CelestiaAtlasView.vue', import.meta.url), 'utf8'),
  ]);

  assert.match(cameraStore, /positionAngleFromNinaPlateSolve\(plateSolveResult\.PositionAngle\)/);
  assert.doesNotMatch(cameraStore, /rotationAngle\s*=\s*plateSolveResult\.PositionAngle/);
  assert.match(fitsSolve, /solvedFromWcs: data\.SolvedFromWcs \?\? data\.solvedFromWcs/);
  assert.match(fitsSolve, /positionAngleFromFitsAnalysis\(result\.value\)/);
  assert.doesNotMatch(fitsSolve, /rotationAngle\s*=\s*result\.value\.rotation/);
  assert.match(atlasView, /rotationConvention: ATLAS_POSITION_ANGLE_CONVENTION/);
});
