import test from 'node:test';
import assert from 'node:assert/strict';

const { sequenceEditPath } = await import('@/utils/sequenceUtils');

const path = 'Imaging-Items-0-Items-2';

test('Smart Exposure routes exposure settings to its Take Exposure child', () => {
  const item = {
    _path: path,
    ExposureTime: 60,
    Gain: 100,
    Offset: 10,
    Iterations: 20,
    DitherTargetExposures: 1,
  };
  assert.equal(sequenceEditPath(item, 'ExposureTime'), `${path}-Items-1-ExposureTime`);
  assert.equal(sequenceEditPath(item, 'Gain'), `${path}-Items-1-Gain`);
  assert.equal(sequenceEditPath(item, 'Offset'), `${path}-Items-1-Offset`);
});

test('Take Many Exposures routes exposure settings to its only child', () => {
  const item = { _path: path, ExposureTime: 30, Gain: 0, Offset: 0, Iterations: 5 };
  assert.equal(sequenceEditPath(item, 'Gain'), `${path}-Items-0-Gain`);
});

test('Take Exposure and Take Subframe Exposure keep their own path', () => {
  assert.equal(
    sequenceEditPath({ _path: path, ExposureTime: 30, ExposureCount: 0 }, 'ExposureTime'),
    `${path}-ExposureTime`
  );
  assert.equal(sequenceEditPath({ _path: path, ExposureTime: 30, ROI: 1 }, 'Gain'), `${path}-Gain`);
});

test('keys other than the exposure settings are never rerouted', () => {
  const item = { _path: path, ExposureTime: 60, Iterations: 20, DitherTargetExposures: 1 };
  assert.equal(sequenceEditPath(item, 'Iterations'), `${path}-Iterations`);
});

test('a loop container with Iterations and child Items keeps its own path', () => {
  const item = { _path: path, ExposureTime: 1, Iterations: 3, Items: [] };
  assert.equal(sequenceEditPath(item, 'ExposureTime'), `${path}-ExposureTime`);
});
