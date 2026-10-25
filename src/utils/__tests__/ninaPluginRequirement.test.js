import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNinaPluginRequirement,
  isNinaPluginLoaded,
  isRouteMissingError,
  parseLoadedNinaPlugins,
} from '../ninaPluginRequirement.js';

// Live response of a PINS Pi, 2026-10-25.
const PI_RESPONSE = {
  Response: [
    'PolarAlignment',
    'LiveStack',
    'GroundStation',
    'NINA.Plugin.NightSummary',
    'joko.nina.plugins',
    'Phd2 Tools',
    'PINS.LuckyCapture',
    'Touch-N-Stars',
    'pins.plugin',
    'ninaAPI',
  ],
  Error: '',
  StatusCode: 200,
  Success: true,
  Type: 'API',
};

test('reads the requirement from plugin metadata', () => {
  assert.deepEqual(
    getNinaPluginRequirement({
      ninaPlugin: {
        name: 'NINA.Plugin.NightSummary',
        displayName: ' Night Summary ',
        pinsPackage: 'pins-plugin-nightsummary',
      },
    }),
    {
      name: 'NINA.Plugin.NightSummary',
      displayName: 'Night Summary',
      pinsPackage: 'pins-plugin-nightsummary',
    }
  );
  assert.deepEqual(getNinaPluginRequirement({ ninaPlugin: { name: ' X ' } }), {
    name: 'X',
    displayName: 'X',
    pinsPackage: null,
  });
  assert.equal(getNinaPluginRequirement({}), null);
  assert.equal(getNinaPluginRequirement({ ninaPlugin: { name: '' } }), null);
  assert.equal(getNinaPluginRequirement(null), null);
});

test('matches the names NINA reports, ignoring case', () => {
  const loaded = parseLoadedNinaPlugins(PI_RESPONSE);
  for (const name of [
    'LiveStack',
    'PINS.LuckyCapture',
    'GroundStation',
    'NINA.Plugin.NightSummary',
  ]) {
    assert.equal(isNinaPluginLoaded(loaded, { name }), true, name);
  }
  assert.equal(isNinaPluginLoaded(loaded, { name: 'livestack' }), true);
  assert.equal(isNinaPluginLoaded(loaded, { name: 'Perihelion' }), false);
});

test('an unusable plugins response is reported as unknown, not as missing', () => {
  assert.equal(parseLoadedNinaPlugins({ Success: false, Response: [] }), null);
  assert.equal(parseLoadedNinaPlugins({ Success: true, Response: 'x' }), null);
  assert.equal(parseLoadedNinaPlugins(undefined), null);
  assert.equal(isNinaPluginLoaded(null, { name: 'LiveStack' }), false);
});

test('only 404 and 405 count as a missing daemon route', () => {
  assert.equal(isRouteMissingError({ response: { status: 404 } }), true);
  assert.equal(isRouteMissingError({ response: { status: 405 } }), true);
  assert.equal(isRouteMissingError({ response: { status: 500 } }), false);
  assert.equal(isRouteMissingError(new Error('Network Error')), false);
});
