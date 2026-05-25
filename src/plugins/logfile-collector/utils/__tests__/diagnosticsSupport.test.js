import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DIAGNOSTICS_DEFAULTS,
  DIAGNOSTICS_STATUS,
  applyArchiveStatusTransition,
  buildDiagnosticsPayload,
  getDiagnosticsUiStatus,
  validateDiagnosticsConfig,
} from '../diagnosticsSupport.js';

test('buildDiagnosticsPayload constructs API body from checkbox state', () => {
  const payload = buildDiagnosticsPayload({
    sections: [
      { key: 'includePinsJournal', enabled: true },
      { key: 'includeApiJournal', enabled: false },
      { key: 'includeUsb', enabled: true },
    ],
    journalLines: 2000,
    dmesgLines: 4000,
  });

  assert.deepEqual(payload, {
    includePinsJournal: true,
    includeApiJournal: false,
    includeUsb: true,
    journalLines: 2000,
    dmesgLines: 4000,
  });
});

test('validateDiagnosticsConfig enforces sections and line limits', () => {
  const noSections = validateDiagnosticsConfig({
    sections: [{ key: 'includePinsJournal', enabled: false }],
    journalLines: 2000,
    dmesgLines: 4000,
  });
  assert.equal(noSections.isValid, false);
  assert.match(noSections.errors.sections, /at least one/i);

  const invalidLines = validateDiagnosticsConfig({
    sections: [{ key: 'includePinsJournal', enabled: true }],
    journalLines: 50,
    dmesgLines: 50001,
  });
  assert.equal(invalidLines.isValid, false);
  assert.match(invalidLines.errors.journalLines, /between 100 and 50000/i);
  assert.match(invalidLines.errors.dmesgLines, /between 100 and 50000/i);

  const valid = validateDiagnosticsConfig({
    sections: [{ key: 'includePinsJournal', enabled: true }],
    journalLines: 100,
    dmesgLines: 50000,
  });
  assert.equal(valid.isValid, true);
  assert.deepEqual(valid.errors, {});
});

test('applyArchiveStatusTransition follows queued -> running -> success lifecycle', () => {
  const start = {
    archiveId: 'abc',
    status: DIAGNOSTICS_STATUS.QUEUED,
    startedAt: 1000,
    finishedAt: null,
    error: null,
    pollUrl: '',
    downloadUrl: '',
  };

  const running = applyArchiveStatusTransition(
    start,
    { status: 'running' },
    { nowMs: 2000, maxDurationMs: DIAGNOSTICS_DEFAULTS.maxPollingDurationMs }
  );
  assert.equal(running.status, DIAGNOSTICS_STATUS.RUNNING);
  assert.equal(running.finishedAt, null);

  const success = applyArchiveStatusTransition(
    running,
    { status: 'success', downloadUrl: '/diagnostics/archive/abc/download' },
    { nowMs: 3000, maxDurationMs: DIAGNOSTICS_DEFAULTS.maxPollingDurationMs }
  );
  assert.equal(success.status, DIAGNOSTICS_STATUS.SUCCESS);
  assert.equal(success.finishedAt, 3000);
  assert.equal(success.downloadUrl, '/diagnostics/archive/abc/download');
});

test('applyArchiveStatusTransition produces failed state with backend error', () => {
  const state = {
    archiveId: 'abc',
    status: DIAGNOSTICS_STATUS.RUNNING,
    startedAt: 1000,
    finishedAt: null,
    error: null,
    pollUrl: '',
    downloadUrl: '',
  };

  const failed = applyArchiveStatusTransition(
    state,
    { status: 'failed', message: 'boom' },
    { nowMs: 5000 }
  );
  assert.equal(failed.status, DIAGNOSTICS_STATUS.FAILED);
  assert.equal(failed.error, 'boom');
  assert.equal(failed.finishedAt, 5000);
});

test('getDiagnosticsUiStatus maps success and failure rendering states', () => {
  const successUi = getDiagnosticsUiStatus({ status: DIAGNOSTICS_STATUS.SUCCESS });
  assert.deepEqual(successUi, { kind: 'success', canDownload: true, isBusy: false });

  const failedUi = getDiagnosticsUiStatus({ status: DIAGNOSTICS_STATUS.FAILED });
  assert.deepEqual(failedUi, { kind: 'failed', canDownload: false, isBusy: false });
});
