import test from 'node:test';
import assert from 'node:assert/strict';

import { MANIFEST_VERSION, buildLogManifest } from '../manifestBuilder.js';

test('buildLogManifest omits diagnostics key when none is given (NINA mode)', () => {
  const manifest = buildLogManifest({
    generatedAt: '2026-01-01T00:00:00.000Z',
    description: 'Mount stalls during meridian flip',
    logToken: 'log_abc_123',
    app: { tnsVersion: '6.3.1', platform: 'android', mode: 'nina', locale: 'en' },
    versions: { api: '', pins: '', tnsPlugin: '2.1.0' },
    diagnostics: null,
  });

  assert.equal(manifest.manifestVersion, MANIFEST_VERSION);
  assert.equal('diagnostics' in manifest, false);
  assert.equal(manifest.description, 'Mount stalls during meridian flip');
  assert.equal(manifest.logToken, 'log_abc_123');
});

test('buildLogManifest includes diagnostics key when an object is given (PINS mode)', () => {
  const diagnostics = {
    requested: {
      includePinsJournal: true,
      includeUsb: false,
      journalLines: 2000,
      dmesgLines: 4000,
    },
    outcome: {
      status: 'success',
      archiveId: 'arc-1',
      error: null,
      startedAt: null,
      finishedAt: null,
    },
  };

  const manifest = buildLogManifest({
    generatedAt: '2026-01-01T00:00:00.000Z',
    description: 'Camera disconnects randomly',
    logToken: 'log_abc_456',
    app: { tnsVersion: '6.3.1', platform: 'web', mode: 'pins', locale: 'de' },
    versions: { api: '2.2.2.1', pins: '1.0.0', tnsPlugin: '2.1.0' },
    diagnostics,
  });

  assert.deepEqual(manifest.diagnostics, diagnostics);
});

test('buildLogManifest defaults description to empty string and logToken to null', () => {
  const manifest = buildLogManifest({
    generatedAt: '2026-01-01T00:00:00.000Z',
    app: { tnsVersion: '6.3.1', platform: 'ios', mode: 'nina', locale: 'en' },
    versions: { api: '', pins: '', tnsPlugin: '' },
    diagnostics: null,
  });

  assert.equal(manifest.description, '');
  assert.equal(manifest.logToken, null);
});
