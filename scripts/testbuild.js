import { spawn } from 'node:child_process';
import { access, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

function requireEnvironment(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`${name} is required; run this command from npm on Windows`);
  }
  return value;
}

function runBuildApp({ projectRoot, outputDirectory }) {
  const npmExecutable = requireEnvironment('npm_execpath');

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [npmExecutable, 'run', 'build:app'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        VITE_OUT_DIR: outputDirectory,
      },
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const reason = signal ? `signal ${signal}` : `exit code ${code}`;
      reject(new Error(`NINA test deployment build failed with ${reason}`));
    });
  });
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function requireFile(path, label) {
  if (!(await pathExists(path))) {
    throw new Error(`NINA test deployment is missing ${label}: ${path}`);
  }
}

async function verifyDeployment(outputDirectory) {
  await requireFile(join(outputDirectory, 'index.html'), 'application entry point');

  // The DSS survey is no longer part of the deployment: the plugin server downloads it
  // on request into its persistent data directory and serves it from there.
  if (await pathExists(join(outputDirectory, 'celestia-atlas-data', 'surveys', 'dss'))) {
    throw new Error('NINA test deployment still contains a packaged DSS survey');
  }

  const assetNames = await readdir(join(outputDirectory, 'assets'));
  const requiredChunks = [
    [/^CelestiaAtlasView-.*\.js$/, 'Celestia Atlas view chunk'],
    [/^celestia-engine-.*\.js$/, 'Celestia Atlas engine chunk'],
  ];
  for (const [pattern, label] of requiredChunks) {
    if (!assetNames.some((name) => pattern.test(name))) {
      throw new Error(`NINA test deployment is missing the ${label}`);
    }
  }

  for (const legacyDirectory of ['stellarium-data', 'stellarium-js']) {
    if (await pathExists(join(outputDirectory, legacyDirectory))) {
      throw new Error(`NINA test deployment still contains legacy ${legacyDirectory}`);
    }
  }
}

if (process.platform !== 'win32') {
  throw new Error('npm run testbuild is only supported for the Windows NINA plugin deployment');
}

const localAppData = requireEnvironment('LOCALAPPDATA');
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = join(localAppData, 'NINA', 'Plugins', '3.0.0', "Touch 'N' Stars", 'app');

await runBuildApp({ projectRoot, outputDirectory });
await verifyDeployment(outputDirectory);

console.log(`Verified deterministic NINA test deployment: ${outputDirectory}`);
