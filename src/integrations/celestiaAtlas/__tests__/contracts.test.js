import test from 'node:test';
import assert from 'node:assert/strict';
import {
  atlasSelectionToFraming,
  ninaMountToAtlas,
  ninaObserverToAtlas,
  toAtlasCoordinates,
} from '../contracts.js';

test('normalizes RA at the wrap boundary without changing units', () => {
  assert.deepEqual(toAtlasCoordinates({ raDeg: 360, decDeg: 0, frame: 'ICRS' }), {
    raDeg: 0,
    decDeg: 0,
    frame: 'ICRS',
  });
  assert.equal(toAtlasCoordinates({ raDeg: -0.25, decDeg: 90, frame: 'J2000' }).raDeg, 359.75);
});

test('normalizes east-positive observer longitude', () => {
  assert.deepEqual(ninaObserverToAtlas({ Latitude: -33.9, Longitude: 181, Elevation: 12 }), {
    latitudeDeg: -33.9,
    longitudeDeg: -179,
    elevationM: 12,
  });
});

test('blocks an untagged mount coordinate from the viewer boundary', () => {
  assert.throws(
    () => ninaMountToAtlas({ Connected: true, RightAscension: 12, Declination: -20 }),
    /unknown/
  );
});

test('converts proven mount RA hours to atlas degrees', () => {
  const value = ninaMountToAtlas(
    { Connected: true, RightAscension: 23.5, Declination: -20, Coordinates: { Epoch: 'J2000' } },
    123
  );
  assert.equal(value.coordinates.raDeg, 352.5);
  assert.equal(value.timestampUtcMs, 123);
});

test('prefers Advanced API tagged degree coordinates', () => {
  const value = ninaMountToAtlas(
    {
      Connected: true,
      RightAscension: 1,
      Declination: 2,
      Coordinates: { RADegrees: 123.4, Dec: -55.6, Epoch: 'J2000' },
    },
    123
  );
  assert.equal(value.coordinates.raDeg, 123.4);
  assert.equal(value.coordinates.decDeg, -55.6);
});

test('rejects JNOW until precession is explicit', () => {
  assert.throws(
    () =>
      ninaMountToAtlas({
        Connected: true,
        Coordinates: { RADegrees: 1, Dec: 2, Epoch: 'JNOW' },
      }),
    /Unsupported/
  );
});

test('keeps a tagged selection safe for framing', () => {
  assert.deepEqual(
    atlasSelectionToFraming({
      name: 'M 31',
      coordinates: { raDeg: 10.6847, decDeg: 41.269, frame: 'ICRS' },
    }),
    { Name: 'M 31', RA: 10.6847, Dec: 41.269, coordinateFrame: 'ICRS', epochJulianYear: undefined }
  );
  assert.throws(
    () => atlasSelectionToFraming({ name: 'unsafe', coordinates: { raDeg: 1, decDeg: 2 } }),
    /explicit/
  );
});
