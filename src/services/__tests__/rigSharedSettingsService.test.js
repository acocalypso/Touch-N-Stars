import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeRigSharedSettings } from '@/services/rigSharedSettingsService';

test('rig-shared settings exclude device-local and secret-bearing state', () => {
  const serialized = serializeRigSharedSettings({
    monitorViewSetting: { showImage: true },
    livestack: { showFilters: false },
    celestiaAtlas: { atmosphereVisible: true },
    language: 'de',
    keepAwakeEnabled: true,
    wifiBindingEnabled: true,
    connection: { ip: '10.42.0.1' },
    wifiPassword: 'must-not-leak',
  });
  const payload = JSON.parse(serialized);

  assert.deepEqual(Object.keys(payload).sort(), [
    'celestiaAtlas',
    'livestack',
    'monitorViewSetting',
    'schemaVersion',
  ]);
  assert.equal(serialized.includes('must-not-leak'), false);
  assert.equal(serialized.includes('10.42.0.1'), false);
  assert.equal(serialized.includes('"language"'), false);
});
