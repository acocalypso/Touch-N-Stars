import test from 'node:test';
import assert from 'node:assert/strict';
import { buildKnowledgeIndex, lookupDevice } from '@/plugins/hardware-db/utils/knowledgeLookup';

function record({ id, driver, vendor, model, status = 'works', reportCount = 1, aliases = [] }) {
  return {
    id,
    driver,
    status,
    reportCount,
    expand: { device: { slug: id, category: 'camera', vendor, model, aliases } },
  };
}

function sampleIndex() {
  return buildKnowledgeIndex(
    [
      record({ id: 'e1', driver: 'ToupTek SDK', vendor: 'ToupTek', model: 'ATR585M' }),
      record({
        id: 'e2',
        driver: 'indi_asi_ccd',
        vendor: 'ZWO',
        model: 'ASI533MC Pro',
        status: 'caveat',
        reportCount: 7,
        aliases: ['ASI533MC-Pro'],
      }),
    ],
    [
      { id: 'n1', entry: 'e2', text: 'USB bandwidth > 60 drops frames on Pi 4' },
      { id: 'n2', entry: 'e2', text: '   ' },
      { id: 'n3', entry: 'gone', text: 'orphan' },
    ]
  );
}

test('a device is found by display name, bare name and alias', () => {
  const index = sampleIndex();

  assert.equal(lookupDevice(index, { displayName: 'ZWO ASI533MC Pro' })?.id, 'e2');
  assert.equal(lookupDevice(index, { name: 'ASI533MC Pro' })?.id, 'e2');
  assert.equal(lookupDevice(index, { displayName: 'ASI533MC-Pro' })?.id, 'e2');
});

test('the rig-specific USB suffix on either side does not prevent a match', () => {
  // Incoming side.
  const index = sampleIndex();
  assert.equal(
    lookupDevice(index, { name: 'ATR585M', displayName: 'ToupTek ATR585M (7c-2-2-3)' })?.id,
    'e1'
  );

  // Stored side - this is what the first published entry actually looked like.
  const polluted = buildKnowledgeIndex([
    record({ id: 'p', driver: 'ToupTek SDK', vendor: 'ToupTek', model: 'ATR585M (7c-2-2-3)' }),
  ]);
  assert.equal(lookupDevice(polluted, { displayName: 'ToupTek ATR585M' })?.id, 'p');
  assert.equal(polluted.entries[0].model, 'ATR585M');
});

test('an exact driver match beats severity and report count', () => {
  const index = buildKnowledgeIndex([
    record({
      id: 'a',
      driver: 'indi_asi_ccd',
      vendor: 'ZWO',
      model: 'ASI533MC Pro',
      status: 'broken',
      reportCount: 9,
    }),
    record({ id: 'b', driver: 'ZWO SDK', vendor: 'ZWO', model: 'ASI533MC Pro', reportCount: 2 }),
  ]);

  assert.equal(
    lookupDevice(index, { displayName: 'ZWO ASI533MC Pro', driverInfo: 'ZWO SDK' })?.id,
    'b'
  );
});

test('without a driver the most severe entry wins over the most reported', () => {
  // The user needs to see the warning, not the reassuring majority.
  const index = buildKnowledgeIndex([
    record({ id: 'ok', driver: 'drv_a', vendor: 'ZWO', model: 'ASI294', reportCount: 20 }),
    record({
      id: 'bad',
      driver: 'drv_b',
      vendor: 'ZWO',
      model: 'ASI294',
      status: 'broken',
      reportCount: 1,
    }),
  ]);

  assert.equal(lookupDevice(index, { displayName: 'ZWO ASI294' })?.id, 'bad');
});

test('an unknown device returns null rather than an empty result', () => {
  const index = sampleIndex();

  assert.equal(lookupDevice(index, { displayName: 'Vixen Nonesuch' }), null);
  assert.equal(lookupDevice(index, {}), null);
  assert.equal(lookupDevice(null, { displayName: 'ZWO ASI533MC Pro' }), null);
});

test('notes attach to their own entry, blank and orphaned ones are dropped', () => {
  const index = sampleIndex();

  assert.deepEqual(lookupDevice(index, { displayName: 'ZWO ASI533MC Pro' }).notes, [
    'USB bandwidth > 60 drops frames on Pi 4',
  ]);
  assert.deepEqual(lookupDevice(index, { displayName: 'ToupTek ATR585M' }).notes, []);
});

test('records without a device or driver are skipped instead of crashing', () => {
  const index = buildKnowledgeIndex(
    [
      { id: 'x', driver: 'indi_asi_ccd' },
      { id: 'y', expand: { device: { vendor: 'ZWO', model: 'ASI294' } } },
      record({ id: 'z', driver: 'indi_asi_ccd', vendor: 'ZWO', model: 'ASI294' }),
    ],
    null
  );

  assert.equal(index.entries.length, 1);
  assert.equal(index.entries[0].id, 'z');
});

test('an empty knowledge base yields an empty index, not an error', () => {
  const index = buildKnowledgeIndex();

  assert.deepEqual(index.entries, []);
  assert.equal(lookupDevice(index, { displayName: 'ZWO ASI533MC Pro' }), null);
});
