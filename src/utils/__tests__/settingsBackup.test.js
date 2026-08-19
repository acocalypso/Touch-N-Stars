import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorage } from '@/test-helpers/browserEnv';
import {
  BACKUP_SCHEMA_VERSION,
  applyBackupPayload,
  buildBackupFilename,
  collectBackupPayload,
  isBackupKey,
} from '@/utils/settingsBackup';

function storageWith(entries) {
  const storage = new MemoryStorage();
  for (const [key, value] of Object.entries(entries)) {
    storage.setItem(key, value);
  }
  return storage;
}

test('collects the real persistence keys, including plugin stores', () => {
  // The Pinia persistence plugin keys these by store id - the `key` given in
  // the stores' v1-style persist config never takes effect on v4.
  const storage = storageWith({
    settings: '{"language":"de"}',
    pluginStore: '{"plugins":[]}',
    shortcuts: '{"shortcuts":[{"id":1}]}',
    'tppaStore.settings:192.168.1.5:1888': '{"Gain":100}',
    'webcam-plugin-settings': '{"url":"http://cam"}',
  });

  const { entries } = collectBackupPayload({ storage });

  assert.deepEqual(Object.keys(entries).sort(), [
    'pluginStore',
    'settings',
    'shortcuts',
    'tppaStore.settings:192.168.1.5:1888',
    'webcam-plugin-settings',
  ]);
});

test('payload carries the schema version, timestamp and app version', () => {
  const payload = collectBackupPayload({
    storage: storageWith({ settings: '{}' }),
    appVersion: '6.1.4-beta6',
  });

  assert.equal(payload.schemaVersion, BACKUP_SCHEMA_VERSION);
  assert.match(payload.exportedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(payload.appVersion, '6.1.4-beta6');
});

test('per-device identities, caches and token slots are never exported', () => {
  const storage = storageWith({
    settings: '{}',
    hardwareDb_installId: 'device-abc',
    hardwareDb_knowledgeCache: '{"cached":true}',
    tilterIsConnected: 'true',
    tilterDevicesList: '[]',
    'tns.pins.network-transition.v1': '{"from":"ap"}',
    tppaStore: '{"legacy":true}',
    PINS_API_TOKEN: 'secret',
    'psp.secondaryDrivers.v1:http://10.0.0.2': '[]',
  });

  const { entries } = collectBackupPayload({ storage });

  assert.deepEqual(Object.keys(entries), ['settings']);
});

test('non-JSON values survive the roundtrip unchanged', () => {
  // useImperialUnits stores 'true', the loupe zoom a bare number - parsing
  // these as JSON on export would corrupt them.
  const source = storageWith({
    useImperialUnits: 'true',
    'tns:image-loupe-zoom': '2.5',
    setupWizardStepId: 'camera',
  });
  const target = new MemoryStorage();

  applyBackupPayload(collectBackupPayload({ storage: source }), target);

  assert.equal(target.getItem('useImperialUnits'), 'true');
  assert.equal(target.getItem('tns:image-loupe-zoom'), '2.5');
  assert.equal(target.getItem('setupWizardStepId'), 'camera');
});

test('restore is additive and leaves unrelated keys alone', () => {
  const target = storageWith({ hardwareDb_installId: 'local-device', settings: '{"old":true}' });

  const restored = applyBackupPayload(
    {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      entries: { settings: '{"new":true}', shortcuts: '[]' },
    },
    target
  );

  assert.equal(restored, 2);
  assert.equal(target.getItem('settings'), '{"new":true}');
  assert.equal(target.getItem('shortcuts'), '[]');
  assert.equal(target.getItem('hardwareDb_installId'), 'local-device');
});

test('the deny-list also guards the import path', () => {
  // A hand-edited or foreign backup must not be able to clone an install id.
  const target = storageWith({ hardwareDb_installId: 'local-device' });

  const restored = applyBackupPayload(
    {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      entries: { hardwareDb_installId: 'foreign-device', PINS_API_TOKEN: 'injected' },
    },
    target
  );

  assert.equal(restored, 0);
  assert.equal(target.getItem('hardwareDb_installId'), 'local-device');
  assert.equal(target.getItem('PINS_API_TOKEN'), null);
});

test('rejects payloads that are not a supported backup', () => {
  const target = new MemoryStorage();

  assert.throws(() => applyBackupPayload(null, target), /valid Touch-N-Stars backup/);
  assert.throws(
    () => applyBackupPayload({ schemaVersion: 99, entries: {} }, target),
    /Unsupported backup version/
  );
  assert.throws(
    () => applyBackupPayload({ schemaVersion: BACKUP_SCHEMA_VERSION }, target),
    /no settings/
  );
});

test('non-string entry values are skipped rather than stored', () => {
  const target = new MemoryStorage();

  const restored = applyBackupPayload(
    {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      entries: { settings: '{}', broken: { nested: true }, alsoBroken: 42 },
    },
    target
  );

  assert.equal(restored, 1);
  assert.equal(target.getItem('broken'), null);
  assert.equal(target.getItem('alsoBroken'), null);
});

test('isBackupKey ignores empty and non-string keys', () => {
  assert.equal(isBackupKey(''), false);
  assert.equal(isBackupKey(null), false);
  assert.equal(isBackupKey('settings'), true);
});

test('filename carries the export date', () => {
  assert.equal(buildBackupFilename(new Date('2026-08-19T21:30:00Z')), 'tns-backup-2026-08-19.json');
});
