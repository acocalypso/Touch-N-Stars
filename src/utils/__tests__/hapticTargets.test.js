import test from 'node:test';
import assert from 'node:assert/strict';
import { pickHapticStyle, HAPTIC_SELECTOR } from '@/utils/hapticTargets';

// pickHapticStyle takes a plain object, so no DOM is needed here - the test
// runner has no jsdom.
const el = (overrides) => ({ tag: 'button', classes: [], ...overrides });

test('a normal button gets a light tap', () => {
  assert.equal(pickHapticStyle(el({})), 'light');
});

test('tns-btn-danger gets the stronger tap', () => {
  assert.equal(pickHapticStyle(el({ classes: ['tns-btn-danger', 'shrink-0'] })), 'medium');
});

test('disabled elements stay silent', () => {
  assert.equal(pickHapticStyle(el({ disabled: true })), null);
  assert.equal(pickHapticStyle(el({ classes: ['tns-btn-danger'], disabled: true })), null);
});

test('data-haptic overrides the class-based guess', () => {
  assert.equal(pickHapticStyle(el({ classes: ['tns-btn-danger'], dataHaptic: 'none' })), null);
  assert.equal(pickHapticStyle(el({ classes: ['tns-btn-danger'], dataHaptic: 'light' })), 'light');
  assert.equal(pickHapticStyle(el({ tag: 'div', dataHaptic: 'medium' })), 'medium');
});

test('clickable rows and cards are recognised by cursor-pointer', () => {
  assert.equal(pickHapticStyle(el({ tag: 'div', classes: ['cursor-pointer'] })), 'light');
  assert.equal(pickHapticStyle(el({ tag: 'li', classes: ['cursor-pointer'] })), 'light');
});

test('a modal backdrop div stays silent', () => {
  assert.equal(
    pickHapticStyle(el({ tag: 'div', classes: ['fixed', 'inset-0', 'bg-black/70'] })),
    null
  );
});

test('links, selects, labels and role=button count as pressable', () => {
  assert.equal(pickHapticStyle(el({ tag: 'a' })), 'light');
  assert.equal(pickHapticStyle(el({ tag: 'select' })), 'light');
  assert.equal(pickHapticStyle(el({ tag: 'label' })), 'light');
  assert.equal(pickHapticStyle(el({ tag: 'div', role: 'button' })), 'light');
});

test('nothing to inspect means nothing to feel', () => {
  assert.equal(pickHapticStyle(null), null);
});

test('the selector covers every recognised kind of target', () => {
  for (const part of ['button', '[role="button"]', 'a[href]', 'select', '.cursor-pointer']) {
    assert.ok(HAPTIC_SELECTOR.includes(part), `${part} missing from HAPTIC_SELECTOR`);
  }
});
