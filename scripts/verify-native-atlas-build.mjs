import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_NATIVE_WEB_BUDGET_BYTES = 40 * 1024 * 1024;

const forbiddenDirectories = new Set(['celestia-atlas-data', 'stellarium-data', 'stellarium-js']);

const requiredAssetPatterns = [
  /^assets\/CelestiaAtlasView-[^/]+\.js$/,
  /^assets\/celestia-engine-[^/]+\.js$/,
  /^assets\/celestia-catalog-[^/]+\.js$/,
  /^assets\/celestia-catalog-supplement-[^/]+\.js$/,
  /^assets\/celestia-star-catalog-[^/]+\.js$/,
];

const forbiddenSurveyUrlPatterns = [
  /https?:\/\/alasky\.u-strasbg\.fr\//i,
  /https?:\/\/alaskybis\.u-strasbg\.fr\//i,
  /https?:\/\/skyview\.gsfc\.nasa\.gov\//i,
];

async function collectFiles(root, directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(root, absolutePath)));
      continue;
    }

    const fileStat = await stat(absolutePath);
    files.push({
      absolutePath,
      relativePath: path.relative(root, absolutePath).replaceAll('\\', '/'),
      bytes: fileStat.size,
    });
  }

  return files;
}

export async function inspectNativeAtlasBuild(
  buildDirectory,
  { budgetBytes = DEFAULT_NATIVE_WEB_BUDGET_BYTES } = {}
) {
  const root = path.resolve(buildDirectory);
  const files = await collectFiles(root);
  const filePaths = files.map((file) => file.relativePath);
  const topLevelDirectories = new Set(
    filePaths.filter((name) => name.includes('/')).map((name) => name.split('/')[0])
  );
  const errors = [];

  if (!filePaths.includes('index.html')) errors.push('index.html is missing');

  for (const forbiddenDirectory of forbiddenDirectories) {
    if (topLevelDirectories.has(forbiddenDirectory)) {
      errors.push(`forbidden directory is packaged: ${forbiddenDirectory}`);
    }
  }

  for (const requiredPattern of requiredAssetPatterns) {
    if (!filePaths.some((name) => requiredPattern.test(name))) {
      errors.push(`required Celestia Atlas asset is missing: ${requiredPattern}`);
    }
  }

  const textAssets = files.filter((file) => /\.(?:html|js|json|css)$/.test(file.relativePath));
  for (const file of textAssets) {
    const source = await readFile(file.absolutePath, 'utf8');
    for (const forbiddenPattern of forbiddenSurveyUrlPatterns) {
      if (forbiddenPattern.test(source)) {
        errors.push(`online survey URL found in ${file.relativePath}: ${forbiddenPattern}`);
      }
    }
  }

  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  if (totalBytes > budgetBytes) {
    errors.push(
      `native web payload is ${formatMiB(totalBytes)}, above the ${formatMiB(budgetBytes)} budget`
    );
  }

  return {
    root,
    fileCount: files.length,
    totalBytes,
    budgetBytes,
    largestFiles: [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 10),
    errors,
  };
}

function formatMiB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function printReport(report) {
  console.log(
    `Native Atlas payload: ${formatMiB(report.totalBytes)} in ${report.fileCount} files ` +
      `(budget ${formatMiB(report.budgetBytes)})`
  );
  console.log('Largest packaged files:');
  for (const file of report.largestFiles) {
    console.log(`  ${formatMiB(file.bytes).padStart(10)}  ${file.relativePath}`);
  }
}

async function main() {
  const buildDirectory = process.argv[2] || 'dist';
  const report = await inspectNativeAtlasBuild(buildDirectory);
  printReport(report);

  if (report.errors.length > 0) {
    for (const error of report.errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log('Native Celestia Atlas package boundary verified.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
