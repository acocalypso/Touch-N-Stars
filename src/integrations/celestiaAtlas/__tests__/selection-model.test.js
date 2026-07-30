import test from 'node:test';
import assert from 'node:assert/strict';
import { atlasSelectionToCommandModel } from '../selectionModel.js';

test('normalizes aliases and creates one proven J2000 action model', () => {
  const model = atlasSelectionToCommandModel({
    name: 'M 31',
    displayName: 'M31 · Andromeda Galaxy',
    aliases: ['Andromeda Galaxy', 'M 31', '', null],
    coordinates: { raDeg: 10.6847, decDeg: 41.269, frame: 'ICRS' },
  });

  assert.deepEqual(model.names, ['M31 · Andromeda Galaxy', 'M 31', 'Andromeda Galaxy']);
  assert.equal(model.raString, '0:42:44.3');
  assert.equal(model.decString, '+41:16:08.4');
  assert.ok(Math.abs(model.raDeg - 10.684711539261059) < 1e-12);
  assert.ok(Math.abs(model.decDeg - 41.26900145907812) < 1e-12);
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
      raDeg: null,
      decDeg: null,
      raString: '',
      decString: '',
      commandTarget: null,
    }
  );
  assert.equal(atlasSelectionToCommandModel(null), null);
});
