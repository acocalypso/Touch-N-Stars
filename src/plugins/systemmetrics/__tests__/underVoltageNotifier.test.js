import test from 'node:test';
import assert from 'node:assert/strict';
import { createUnderVoltageNotifier } from '../services/underVoltageNotifier.js';

test('notifies once while PINS undervoltage remains active', () => {
  const toasts = [];
  const notify = createUnderVoltageNotifier({
    showToast: (toast) => toasts.push(toast),
    translate: (key) => key,
  });

  assert.equal(notify({ underVoltage: true }, true), true);
  assert.equal(notify({ underVoltage: true }, true), false);
  assert.deepEqual(toasts, [
    {
      type: 'warning',
      title: 'plugins.systemMetrics.underVoltageActive',
      message: 'plugins.systemMetrics.underVoltageActiveHelp',
      autoClose: false,
    },
  ]);
});

test('does not notify outside PINS mode or for historical undervoltage', () => {
  const toasts = [];
  const notify = createUnderVoltageNotifier({
    showToast: (toast) => toasts.push(toast),
    translate: (key) => key,
  });

  assert.equal(notify({ underVoltage: true }, false), false);
  assert.equal(notify({ underVoltage: false, underVoltageOccurred: true }, true), false);
  assert.deepEqual(toasts, []);
});

test('notifies again when undervoltage clears and recurs', () => {
  const toasts = [];
  const notify = createUnderVoltageNotifier({
    showToast: (toast) => toasts.push(toast),
    translate: (key) => key,
  });

  notify({ underVoltage: true }, true);
  notify({ underVoltage: false }, true);
  notify({ underVoltage: true }, true);

  assert.equal(toasts.length, 2);
});
