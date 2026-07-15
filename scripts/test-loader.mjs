// Module hooks for `node --test` so tests can import application modules that
// are otherwise only loadable through Vite:
//  - resolves the `@/` alias to `src/`
//  - resolves extension-less relative imports (`./imageStore` -> `imageStore.js`)
//  - loads `src/**/*.json` without requiring `with { type: 'json' }`
//  - stubs .vue/asset imports with an empty module
//  - rewrites `import.meta.env` (Vite-only) to `globalThis.__viteEnv`
//  - redirects `@microsoft/signalr` to the controllable fake in
//    `src/test-helpers/fakeSignalR.js`
// Registered via `node --import ./scripts/test-loader.mjs --test ...`.
import { registerHooks } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC_DIR = fileURLToPath(new URL('../src/', import.meta.url));
const SIGNALR_FAKE_URL = pathToFileURL(path.join(SRC_DIR, 'test-helpers', 'fakeSignalR.js')).href;
const STUB_EXTENSIONS = /\.(vue|css|png|jpe?g|svg|gif|webp|woff2?)$/i;

function tryFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.js`,
    `${basePath}.json`,
    path.join(basePath, 'index.js'),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // keep trying
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@microsoft/signalr') {
      return { url: SIGNALR_FAKE_URL, shortCircuit: true };
    }

    let filePath = null;
    if (specifier.startsWith('@/')) {
      filePath = path.join(SRC_DIR, specifier.slice(2));
    } else if (
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      context.parentURL?.startsWith('file:')
    ) {
      filePath = path.join(path.dirname(fileURLToPath(context.parentURL)), specifier);
    }

    if (filePath) {
      const resolved = tryFile(filePath);
      if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },

  load(url, context, nextLoad) {
    if (STUB_EXTENSIONS.test(url)) {
      return { format: 'module', source: 'export default {};', shortCircuit: true };
    }

    const isSrcFile = url.startsWith('file:') && url.includes('/src/');
    if (isSrcFile && url.endsWith('.json')) {
      const text = fs.readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', source: `export default ${text};`, shortCircuit: true };
    }

    const result = nextLoad(url, context);
    if (isSrcFile && url.endsWith('.js') && result.source) {
      const source = result.source.toString();
      if (source.includes('import.meta.env')) {
        return {
          ...result,
          source: source.replaceAll('import.meta.env', '(globalThis.__viteEnv ?? {})'),
        };
      }
    }
    return result;
  },
});
