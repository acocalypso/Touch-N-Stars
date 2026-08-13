import test from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals, freshPinia } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

const { default: axios } = await import('axios');
const { default: apiPinsService } = await import('@/services/apiPinsService');
const { useSettingsStore } = await import('@/store/settingsStore');

freshPinia();
const settingsStore = useSettingsStore();
settingsStore.connection.ip = '10.0.0.25';
settingsStore.connection.port = 5000;

test('localization reads current system values and available choices from pinsdaemon', async (t) => {
  const calls = [];
  t.mock.method(axios, 'get', async (url, config) => {
    calls.push({ url, config });
    return { data: {} };
  });

  await apiPinsService.getPinsSystemLocalization();
  await apiPinsService.getPinsSystemLocalizationOptions();

  assert.deepEqual(
    calls.map((call) => call.url),
    [
      'http://10.0.0.25:8000/system/localization',
      'http://10.0.0.25:8000/system/localization/options',
    ]
  );
  assert.match(calls[0].config.headers.Authorization, /^Bearer /);
});

test('localization updates use the authenticated pinsdaemon endpoint', async (t) => {
  let call;
  t.mock.method(axios, 'put', async (url, data, config) => {
    call = { url, data, config };
    return { data: { jobId: 'localization-1', status: 'queued' } };
  });
  const payload = {
    locale: 'en_GB.UTF-8',
    wifiCountry: 'DE',
    timezone: 'Europe/Berlin',
    keyboardLayout: 'de',
  };

  const result = await apiPinsService.updatePinsSystemLocalization(payload);

  assert.equal(call.url, 'http://10.0.0.25:8000/system/localization');
  assert.deepEqual(call.data, payload);
  assert.match(call.config.headers.Authorization, /^Bearer /);
  assert.equal(result.jobId, 'localization-1');
});
