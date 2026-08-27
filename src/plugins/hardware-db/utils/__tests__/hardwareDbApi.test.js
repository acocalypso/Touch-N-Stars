import test from 'node:test';
import assert from 'node:assert/strict';
import { createHardwareDbApi } from '@/plugins/hardware-db/utils/hardwareDbApi';

function response(body, { ok = true, status = 200 } = {}) {
  return { ok, status, text: async () => JSON.stringify(body) };
}

test('submits schema v2 to the website endpoint without client-owned moderation state', async () => {
  let request;
  const api = createHardwareDbApi({
    baseUrl: 'https://touch-n-stars.test/',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response({ success: true, status: 'pending' }, { status: 201 });
    },
  });
  const payload = { schemaVersion: 2, installId: 'install', devices: [{ name: 'camera' }] };
  await api.submitReport({ reportToken: 'TNS-HW-TEST-123', installId: 'install', payload });
  assert.equal(request.url, 'https://touch-n-stars.test/api/hardware-db/submissions');
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(JSON.parse(request.options.body), {
    schemaVersion: 2,
    reportToken: 'TNS-HW-TEST-123',
    installId: 'install',
    payload,
  });
});

test('reads submission status from the token capability endpoint', async () => {
  let url;
  const api = createHardwareDbApi({
    baseUrl: 'https://touch-n-stars.test',
    fetchImpl: async (value) => {
      url = value;
      return response({ status: 'approved' });
    },
  });
  assert.equal(await api.fetchSubmissionStatus('token/value'), 'approved');
  assert.equal(url, 'https://touch-n-stars.test/api/hardware-db/submissions/token%2Fvalue/status');
});

test('adapts approved website devices for the existing knowledge lookup', async () => {
  const api = createHardwareDbApi({
    baseUrl: 'https://touch-n-stars.test',
    fetchImpl: async () =>
      response({
        items: [
          {
            id: 4,
            category: 'camera',
            name: 'ASI533MC Pro',
            displayName: 'ZWO ASI533MC Pro',
            manufacturer: 'ZWO',
            model: 'ASI533MC Pro',
            driverInfo: 'indi_asi_ccd',
            userStatus: 'works',
            notes: 'Stable',
          },
        ],
      }),
  });
  const result = await api.fetchKnowledge();
  assert.equal(result.entries[0].expand.device.vendor, 'ZWO');
  assert.equal(result.entries[0].driver, 'indi_asi_ccd');
  assert.deepEqual(result.notes, [{ id: 'note-4', entry: '4', text: 'Stable' }]);
});
