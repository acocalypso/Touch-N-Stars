// Regenerates the apiService surface snapshot used by
// src/services/__tests__/apiServiceSurface.test.js.
// Run after intentionally adding/removing apiService methods:
//   node --import ./scripts/test-loader.mjs scripts/dump-api-surface.mjs
import { writeFileSync } from 'node:fs';
import { installBrowserGlobals } from '../src/test-helpers/browserEnv.js';

installBrowserGlobals();

const { default: apiService } = await import('../src/services/apiService.js');

const surface = {};
for (const key of Object.keys(apiService).sort()) {
  const value = apiService[key];
  // Nested plugin namespaces (e.g. nightsummary) are snapshotted by their keys
  surface[key] = typeof value === 'function' ? 'function' : Object.keys(value).sort();
}

const target = new URL('../src/services/__tests__/apiServiceSurface.snapshot.json', import.meta.url);
writeFileSync(target, JSON.stringify(surface, null, 2) + '\n');
console.log(`API surface snapshot written: ${Object.keys(surface).length} top-level entries`);
