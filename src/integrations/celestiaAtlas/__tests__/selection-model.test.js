import test from 'node:test';
import assert from 'node:assert/strict';
import { atlasSelectionToCommandModel } from '../selectionModel.js';

test('normalizes aliases and creates one proven J2000 action model', () => {
  const model = atlasSelectionToCommandModel({
    name: 'M 31',
    displayName: 'M31 · Andromeda Galaxy',
    aliases: ['Andromeda Galaxy', 'M 31', '', null],
    coordinates: { raDeg: 10.6847, decDeg: 41.269, frame: 'ICRS' },
    typeCode: 'G',
    mag: 3.44,
    shape: { kind: 'ellipse', majorArcmin: 177.83, minorArcmin: 69.66, positionAngleDeg: 35 },
  });

  assert.deepEqual(model.names, ['M31 · Andromeda Galaxy', 'M 31', 'Andromeda Galaxy']);
  assert.equal(model.raString, '0:42:44.3');
  assert.equal(model.decString, '+41:16:08.4');
  assert.ok(Math.abs(model.raDeg - 10.684711539261059) < 1e-12);
  assert.ok(Math.abs(model.decDeg - 41.26900145907812) < 1e-12);
  assert.deepEqual(model.info, {
    typeKey: 'g',
    magnitude: 3.44,
    sizeArcmin: { major: 177.83, minor: 69.66 },
    constellation: null,
  });
  assert.deepEqual(model.commandTarget, {
    Name: 'M 31',
    RA: model.raDeg,
    Dec: model.decDeg,
    coordinateFrame: 'J2000',
    epochJulianYear: 2000,
    sourceCoordinateFrame: 'ICRS',
  });
});

test('clears every command value when a selection lacks an explicit coordinate frame', () => {
  assert.deepEqual(
    atlasSelectionToCommandModel({
      name: 'Unsafe target',
      aliases: ['Legacy alias'],
      coordinates: { raDeg: 10, decDeg: 20 },
    }),
    {
      names: ['Unsafe target', 'Legacy alias'],
      info: { typeKey: null, magnitude: null, sizeArcmin: null, constellation: null },
      raDeg: null,
      decDeg: null,
      raString: '',
      decString: '',
      commandTarget: null,
    }
  );
  assert.equal(atlasSelectionToCommandModel(null), null);
});

test('catalogue info falls back per field and never yields NaN', () => {
  const star = atlasSelectionToCommandModel({
    name: 'Sirius',
    type: 'Star',
    mag: '-1.46',
    con: 'CMa',
    coordinates: { raDeg: 101.287, decDeg: -16.716, frame: 'ICRS' },
  });
  assert.deepEqual(star.info, {
    typeKey: 'star',
    magnitude: -1.46,
    sizeArcmin: null,
    constellation: 'CMa',
  });

  const labelOnly = atlasSelectionToCommandModel({
    name: 'M 33',
    objectType: 'Galaxy',
    coordinates: { raDeg: 23.46, decDeg: 30.66, frame: 'ICRS' },
  });
  assert.equal(labelOnly.info.typeKey, 'g');

  const openNgc = atlasSelectionToCommandModel({
    name: 'NGC 7000',
    typeCode: 'Neb',
    major: 120,
    minor: 'n/a',
    coordinates: { raDeg: 314.7, decDeg: 44.3, frame: 'ICRS' },
  });
  assert.deepEqual(openNgc.info, {
    typeKey: 'neb',
    magnitude: null,
    sizeArcmin: { major: 120, minor: null },
    constellation: null,
  });
});
