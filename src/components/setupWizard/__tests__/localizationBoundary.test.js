import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const wizardSource = readFileSync(new URL('../SetupWizard.vue', import.meta.url), 'utf8');
const settingsSource = readFileSync(
  new URL('../../settings/SettingsGeneralTab.vue', import.meta.url),
  'utf8'
);

test('PINS localization is ordered before Wi-Fi in the setup assistant', () => {
  assert.match(
    wizardSource,
    /store\.isPINS\s*\?\s*\[step\('localization'\), step\('wifi'\), step\('updates'\)\]/
  );
});

test('system localization settings remain inside the PINS capability boundary', () => {
  assert.match(settingsSource, /<PinsLocalizationSettings v-if="store\.isPINS" \/>/);
});
