import { spawn } from 'node:child_process';
import { access, readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const EXPECTED_SURVEY_FILES = Object.freeze({
  Norder3: 769,
  Norder4: 3072,
});

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

async function countWebpFiles(directory) {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.webp'))
    .length;
}

async function verifyDeployment(outputDirectory) {
  const surveyDirectory = join(outputDirectory, 'celestia-atlas-data', 'surveys', 'dss');
  const requiredFiles = [
    [join(outputDirectory, 'index.html'), 'application entry point'],
    [join(surveyDirectory, 'properties'), 'DSS HiPS properties'],
    [join(surveyDirectory, 'Norder3', 'Allsky.webp'), 'DSS order-3 Allsky preview'],
    [join(surveyDirectory, 'Norder3', 'Dir0', 'Npix0.webp'), 'first DSS order-3 tile'],
    [join(surveyDirectory, 'Norder3', 'Dir0', 'Npix767.webp'), 'last DSS order-3 tile'],
    [join(surveyDirectory, 'Norder4', 'Dir0', 'Npix0.webp'), 'first DSS order-4 tile'],
    [join(surveyDirectory, 'Norder4', 'Dir0', 'Npix3071.webp'), 'last DSS order-4 tile'],
  ];

  await Promise.all(requiredFiles.map(([path, label]) => requireFile(path, label)));

  const properties = await readFile(join(surveyDirectory, 'properties'), 'utf8');
  if (!/^hips_order\s*=\s*4$/m.test(properties)) {
    throw new Error('Deployed DSS HiPS properties do not declare order 4');
  }
  if (!/^hips_service_url\s*=\s*\/celestia-atlas-data\/surveys\/dss$/m.test(properties)) {
    throw new Error('Deployed DSS HiPS properties do not use the local Celestia data endpoint');
  }

  for (const [order, expectedCount] of Object.entries(EXPECTED_SURVEY_FILES)) {
    const actualCount = await countWebpFiles(join(surveyDirectory, order));
    if (actualCount !== expectedCount) {
      throw new Error(
        `NINA test deployment has ${actualCount} ${order} WebP files; expected ${expectedCount}`
      );
    }
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
