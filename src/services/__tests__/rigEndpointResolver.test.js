import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPinsEndpointCandidates,
  probePinsHealth,
  resolvePinsEndpoint,
} from '@/services/rigEndpointResolver';

test('endpoint candidates prefer remembered rig addresses and always include the field fallback', () => {
  const candidates = buildPinsEndpointCandidates({
    instance: {
      ip: '192.168.1.44',
      preferredEndpoint: { host: 'rig.local' },
      candidateHosts: ['192.168.1.44', '10.42.0.1'],
    },
    currentHost: '192.168.1.10',
    mdnsHosts: ['192.168.1.44', 'pins.local'],
  });

  assert.deepEqual(
    candidates.map(({ host, source }) => [host, source]),
    [
      ['rig.local', 'preferred'],
      ['192.168.1.44', 'instance'],
      ['10.42.0.1', 'remembered'],
      ['192.168.1.10', 'page'],
      ['pins.local', 'mdns'],
    ]
  );
});

test('health probes are unauthenticated and do not send browser credentials', async () => {
  let request;
  const result = await probePinsHealth(
    { host: '10.42.0.1', source: 'field-hotspot' },
    {
      fetchImpl: async (url, options) => {
        request = { url, options };
        return {
          ok: true,
          json: async () => ({
            status: 'ok',
            service: 'pinsdaemon',
            rigId: 'rig-123',
          }),
        };
      },
    }
  );

  assert.equal(request.url, 'http://10.42.0.1:8000/health');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.options.headers.Authorization, undefined);
  assert.equal(result.health.rigId, 'rig-123');
});

test('resolver rejects a reachable different rig and selects the matching identity', async () => {
  const fetchImpl = async (url) => ({
    ok: true,
    json: async () => ({
      status: 'ok',
      service: 'pinsdaemon',
      rigId: url.includes('wrong.local') ? 'rig-wrong' : 'rig-right',
    }),
  });

  const result = await resolvePinsEndpoint({
    candidates: [{ host: 'wrong.local' }, { host: '10.42.0.1' }],
    expectedRigId: 'rig-right',
    fetchImpl,
    concurrency: 1,
  });

  assert.equal(result.host, '10.42.0.1');
  assert.match(result.attempts[0].error, /identity mismatch/i);
});
