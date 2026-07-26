import test from 'node:test';
import assert from 'node:assert/strict';
import { reactive } from 'vue';
import { installBrowserGlobals } from '../../test-helpers/browserEnv.js';

installBrowserGlobals();

const { identifySelectedRig, initializeRigConnectionSupervisor, recoverRigConnection } =
  await import('@/services/rigConnectionSupervisor');

test('pinsdaemon recovery is inert for a non-PINS backend', async (t) => {
  let backendSwitches = 0;
  let healthProbes = 0;
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => {
    healthProbes += 1;
    throw new Error('A Windows backend must not be probed as pinsdaemon');
  };

  const instance = { id: 'windows-rig', ip: '192.168.1.20', port: 5000 };
  const settingsStore = {
    selectedInstanceId: instance.id,
    connection: { ip: instance.ip, port: instance.port },
    getInstance: () => instance,
  };
  const backendStore = reactive({
    isPINS: false,
    async switchBackend() {
      backendSwitches += 1;
    },
  });

  await initializeRigConnectionSupervisor({ settingsStore, backendStore });
  const result = await recoverRigConnection({ timeoutMs: 10 });

  assert.equal(result, null);
  assert.equal(healthProbes, 0);
  assert.equal(backendSwitches, 0);
  await assert.rejects(() => identifySelectedRig(), /unavailable for this backend/);
});
