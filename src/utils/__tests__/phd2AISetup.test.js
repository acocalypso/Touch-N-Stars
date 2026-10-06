import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiSetupOverview } from '../phd2AISetup.js';
test('preparation requires ordinary guiding', () => {
  assert.equal(aiSetupOverview({}, false).step, 'prepare');
  assert.equal(aiSetupOverview({}, true).step, 'train');
});
test('reopening resumes server duration and ETA', () => {
  const result = aiSetupOverview(
    { training: { state: 'recording', duration_sec: 600, elapsed_sec: 240 } },
    false,
    1800
  );
  assert.equal(result.step, 'train');
  assert.equal(result.duration, 600);
  assert.equal(result.remaining, 360);
  assert.equal(result.progress, 40);
});
test('recording overrun does not create negative remaining time', () => {
  const result = aiSetupOverview(
    { training: { state: 'recording', duration_sec: 60, elapsed_sec: 80 } },
    true
  );
  assert.equal(result.remaining, 0);
  assert.equal(result.progress, 100);
});
test('fitting cannot promise a finish time or allow testing', () => {
  const result = aiSetupOverview(
    { training: { state: 'fitting' }, model_loaded: true, fingerprint_ok: true },
    true
  );
  assert.equal(result.step, 'train');
  assert.equal(result.remaining, null);
  assert.equal(result.canTest, false);
});
test('old completed and cancelled jobs do not imply a loaded model', () => {
  for (const state of ['complete', 'failed', 'cancelled']) {
    assert.equal(aiSetupOverview({ training: { state } }, true).step, 'train');
  }
});
test('assistant follows externally selected model modes', () => {
  for (const [mode, step] of [
    ['disabled', 'review'],
    ['shadow', 'shadow'],
    ['active', 'active'],
  ]) {
    assert.equal(aiSetupOverview({ model_loaded: true, mode }, true).step, step);
  }
});
test('testing requires guiding and matching equipment', () => {
  const status = { model_loaded: true, fingerprint_ok: true };
  assert.equal(aiSetupOverview(status, true).canTest, true);
  assert.equal(aiSetupOverview(status, false).canTest, false);
  assert.equal(aiSetupOverview({ ...status, fingerprint_ok: false }, true).canTest, false);
});
