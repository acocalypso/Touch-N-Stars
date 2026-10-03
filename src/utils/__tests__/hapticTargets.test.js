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

test('checkboxes and radios change a setting and get a tap', () => {
  assert.equal(pickHapticStyle(el({ tag: 'input', type: 'checkbox' })), 'light');
  assert.equal(pickHapticStyle(el({ tag: 'input', type: 'radio' })), 'light');
});

test('text and number inputs stay silent', () => {
  assert.equal(pickHapticStyle(el({ tag: 'input', type: 'text' })), null);
  assert.equal(pickHapticStyle(el({ tag: 'input', type: 'number' })), null);
});

test('navigation entries keep their tap', () => {
  assert.equal(pickHapticStyle(el({ tag: 'a', classes: ['nav-button'] })), 'light');
  assert.equal(pickHapticStyle(el({ tag: 'div', role: 'button' })), 'light');
});

test('elements that only navigate or select stay silent', () => {
  assert.equal(pickHapticStyle(el({ tag: 'select', classes: ['tns-select'] })), null);
  assert.equal(pickHapticStyle(el({ tag: 'a' })), null);
  assert.equal(pickHapticStyle(el({ tag: 'label' })), null);
});

test('clickable rows, cards and modal backdrops stay silent', () => {
  assert.equal(pickHapticStyle(el({ tag: 'div', classes: ['cursor-pointer'] })), null);
  assert.equal(pickHapticStyle(el({ tag: 'li', classes: ['cursor-pointer'] })), null);
  assert.equal(pickHapticStyle(el({ tag: 'div', classes: ['fixed', 'inset-0'] })), null);
});

test('nothing to inspect means nothing to feel', () => {
  assert.equal(pickHapticStyle(null), null);
});

test('the selector covers every recognised kind of target', () => {
  for (const part of ['button', '[role="button"]', 'input[type="checkbox"]', '.nav-button']) {
    assert.ok(HAPTIC_SELECTOR.includes(part), `${part} missing from HAPTIC_SELECTOR`);
  }
  for (const part of ['select', 'a[href]', 'cursor-pointer', 'label']) {
    assert.ok(!HAPTIC_SELECTOR.includes(part), `${part} should not be in HAPTIC_SELECTOR`);
  }
});
