import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  aggregateAndroidMeminfo,
  parseAndroidMeminfo,
  parsePackageWebViewProcessPids,
  summarizeAndroidMemorySamples,
} from './android-atlas-memory-profile-lib.mjs';

const execFileAsync = promisify(execFile);
const defaults = {
  packageName: 'com.TouchNStars.dev',
  durationSeconds: 300,
  intervalSeconds: 5,
  backgroundEverySamples: 12,
  warmupSamples: 3,
  settleSeconds: 30,
  stress: true,
};

function usage() {
  return `Usage: npm run profile:android-atlas -- [options]

Options:
  --serial <adb-serial>             Select a device when more than one is attached
  --package <application-id>        Package to profile (default: ${defaults.packageName})
  --duration-seconds <seconds>      Profile duration (default: ${defaults.durationSeconds})
  --interval-seconds <seconds>      Sampling interval (default: ${defaults.intervalSeconds})
  --background-every <samples>      Lifecycle cycle frequency (default: ${defaults.backgroundEverySamples})
  --warmup-samples <count>          Samples excluded from trend summary (default: ${defaults.warmupSamples})
  --settle-seconds <seconds>        No-input recovery tail (default: ${defaults.settleSeconds})
  --output <path>                   JSON report path under .cache by default
  --no-stress                       Sample only; perform the test workflow manually
  --help                            Show this help

Open Celestia Atlas and allow the survey to settle before starting. The default
stress loop pans the central canvas and backgrounds/foregrounds the app. Use
--no-stress while manually adding pinch, search, selection, settings and rotation.`;
}

function positiveNumber(value, option) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${option} must be positive`);
  return number;
}

function parseArgs(argv) {
  const options = { ...defaults };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${argument} requires a value`);
      return argv[index];
    };
    if (argument === '--help') options.help = true;
    else if (argument === '--no-stress') options.stress = false;
    else if (argument === '--serial') options.serial = next();
    else if (argument === '--package') options.packageName = next();
    else if (argument === '--duration-seconds')
      options.durationSeconds = positiveNumber(next(), argument);
    else if (argument === '--interval-seconds')
      options.intervalSeconds = positiveNumber(next(), argument);
    else if (argument === '--background-every')
      options.backgroundEverySamples = Math.floor(positiveNumber(next(), argument));
    else if (argument === '--warmup-samples')
      options.warmupSamples = Math.floor(positiveNumber(next(), argument));
    else if (argument === '--settle-seconds')
      options.settleSeconds = positiveNumber(next(), argument);
    else if (argument === '--output') options.output = next();
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function runAdb(adb, serial, args, options = {}) {
  const serialArgs = serial ? ['-s', serial] : [];
  return execFileAsync(adb, [...serialArgs, ...args], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    ...options,
  });
}

async function selectDevice(adb, requestedSerial) {
  const { stdout } = await runAdb(adb, null, ['devices', '-l']);
  const devices = stdout
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => /\sdevice(?:\s|$)/.test(line))
    .map((line) => ({ serial: line.split(/\s+/)[0], description: line }));
  if (requestedSerial) {
    const device = devices.find((candidate) => candidate.serial === requestedSerial);
    if (!device) throw new Error(`ADB device ${requestedSerial} is not connected`);
    return device;
  }
  if (devices.length !== 1) {
    throw new Error(`Expected one ADB device, found ${devices.length}; use --serial`);
  }
  return devices[0];
}

async function deviceProperty(adb, serial, name) {
  const { stdout } = await runAdb(adb, serial, ['shell', 'getprop', name]);
  return stdout.trim();
}

async function installedPackageInfo(adb, serial, packageName) {
  const { stdout } = await runAdb(adb, serial, ['shell', 'dumpsys', 'package', packageName]);
  return {
    versionName: stdout.match(/\bversionName=([^\s]+)/)?.[1] || null,
    versionCode: Number(stdout.match(/\bversionCode=(\d+)/)?.[1] || 0) || null,
    firstInstallTime: stdout.match(/\bfirstInstallTime=([^\r\n]+)/)?.[1]?.trim() || null,
    lastUpdateTime: stdout.match(/\blastUpdateTime=([^\r\n]+)/)?.[1]?.trim() || null,
  };
}

async function repositoryCommit() {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function screenSize(adb, serial) {
  const { stdout } = await runAdb(adb, serial, ['shell', 'wm', 'size']);
  const matches = [...stdout.matchAll(/(?:Override|Physical) size:\s*(\d+)x(\d+)/g)];
  const match = matches.at(-1);
  if (!match) throw new Error(`Could not parse screen size: ${stdout.trim()}`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

async function memorySample(adb, serial, packageName) {
  const [{ stdout: mainOutput }, { stdout: processOutput }] = await Promise.all([
    runAdb(adb, serial, ['shell', 'dumpsys', 'meminfo', packageName]),
    runAdb(adb, serial, ['shell', 'dumpsys', 'activity', 'processes']),
  ]);
  const mainProcess = parseAndroidMeminfo(mainOutput);
  if (!mainProcess.pid) throw new Error('Application process is not running');

  const webViewPids = parsePackageWebViewProcessPids(processOutput, packageName);
  const webViewProcesses = await Promise.all(
    webViewPids.map(async (pid) => {
      const { stdout } = await runAdb(adb, serial, ['shell', 'dumpsys', 'meminfo', String(pid)]);
      return parseAndroidMeminfo(stdout);
    })
  );
  const processPids = [mainProcess.pid, ...webViewProcesses.map((process) => process.pid)].toSorted(
    (a, b) => a - b
  );

  return {
    pid: mainProcess.pid,
    processPids,
    ...aggregateAndroidMeminfo([mainProcess, ...webViewProcesses]),
    mainProcess,
    webViewProcesses,
  };
}

async function stressAtlas(adb, serial, packageName, size, sampleIndex, backgroundEvery) {
  if (sampleIndex > 0 && sampleIndex % backgroundEvery === 0) {
    await runAdb(adb, serial, ['shell', 'input', 'keyevent', 'KEYCODE_HOME']);
    await wait(2500);
    await runAdb(adb, serial, ['shell', 'am', 'start', '-n', `${packageName}/.MainActivity`]);
    await wait(3000);
    return 'background-foreground';
  }

  const horizontal = sampleIndex % 2 === 0;
  const reverse = sampleIndex % 4 >= 2;
  const x1 = Math.round(size.width * (reverse ? 0.72 : 0.28));
  const x2 = Math.round(size.width * (reverse ? 0.28 : 0.72));
  const y1 = Math.round(size.height * (reverse ? 0.58 : 0.42));
  const y2 = Math.round(size.height * (reverse ? 0.42 : 0.58));
  const args = horizontal
    ? [
        'shell',
        'input',
        'swipe',
        String(x1),
        String(Math.round(size.height * 0.5)),
        String(x2),
        String(Math.round(size.height * 0.5)),
        '450',
      ]
    : [
        'shell',
        'input',
        'swipe',
        String(Math.round(size.width * 0.5)),
        String(y1),
        String(Math.round(size.width * 0.5)),
        String(y2),
        '450',
      ];
  await runAdb(adb, serial, args);
  return horizontal ? 'horizontal-pan' : 'vertical-pan';
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const adb = process.env.ADB || 'adb';
  const device = await selectDevice(adb, options.serial);
  const serial = device.serial;
  const size = await screenSize(adb, serial);
  const [manufacturer, model, androidVersion, sdk, abi, totalMemory, app, commit] =
    await Promise.all([
      deviceProperty(adb, serial, 'ro.product.manufacturer'),
      deviceProperty(adb, serial, 'ro.product.model'),
      deviceProperty(adb, serial, 'ro.build.version.release'),
      deviceProperty(adb, serial, 'ro.build.version.sdk'),
      deviceProperty(adb, serial, 'ro.product.cpu.abi'),
      runAdb(adb, serial, ['shell', 'cat', '/proc/meminfo']).then(({ stdout }) =>
        Number(stdout.match(/^MemTotal:\s*(\d+)/m)?.[1] || 0)
      ),
      installedPackageInfo(adb, serial, options.packageName),
      repositoryCommit(),
    ]);

  const startedAt = new Date();
  const safeTimestamp = startedAt.toISOString().replaceAll(':', '-');
  const output = path.resolve(
    options.output || `.cache/native-profile/android-atlas-memory-${safeTimestamp}.json`
  );
  const sampleCount = Math.max(2, Math.ceil(options.durationSeconds / options.intervalSeconds));
  const settleStartSeconds = Math.max(0, options.durationSeconds - options.settleSeconds);
  const samples = [];
  let stopRequested = false;
  process.once('SIGINT', () => {
    stopRequested = true;
    console.log('\nStopping after the current ADB operation...');
  });

  console.log(`Profiling ${options.packageName} on ${manufacturer} ${model} (${serial})`);
  console.log(
    `Samples: ${sampleCount} every ${options.intervalSeconds}s; stress: ${options.stress}`
  );
  console.log('Keep Celestia Atlas visible; reports are informational and device-specific.');

  const monotonicStart = performance.now();
  for (let index = 0; index < sampleCount && !stopRequested; index += 1) {
    const targetTime = monotonicStart + index * options.intervalSeconds * 1000;
    await wait(Math.max(0, targetTime - performance.now()));
    const elapsedSeconds = (performance.now() - monotonicStart) / 1000;
    const sample = { index, elapsedSeconds, timestamp: new Date().toISOString() };
    try {
      Object.assign(sample, await memorySample(adb, serial, options.packageName));
      if (!sample.pid || !sample.totalPssKb) throw new Error('Application process is not running');
      if (options.stress && elapsedSeconds < settleStartSeconds && index < sampleCount - 1) {
        sample.actionAfterSample = await stressAtlas(
          adb,
          serial,
          options.packageName,
          size,
          index,
          options.backgroundEverySamples
        );
      } else if (options.stress) {
        sample.actionAfterSample = 'settle';
      }
      console.log(
        `${String(index + 1).padStart(3)}/${sampleCount}: PSS ${(sample.totalPssKb / 1024).toFixed(1)} MiB, RSS ${(sample.totalRssKb / 1024).toFixed(1)} MiB, PIDs ${sample.processPids.join('+')}`
      );
    } catch (error) {
      sample.error = error?.message || String(error);
      console.error(`${String(index + 1).padStart(3)}/${sampleCount}: ${sample.error}`);
    }
    samples.push(sample);
  }

  const report = {
    schemaVersion: 1,
    startedAtUtc: startedAt.toISOString(),
    finishedAtUtc: new Date().toISOString(),
    options,
    repositoryCommitAtCapture: commit,
    installedApp: app,
    device: {
      serial,
      manufacturer,
      model,
      androidVersion,
      sdk: Number(sdk),
      abi,
      totalMemoryKb: totalMemory,
      screen: size,
      emulator: /^emulator-/.test(serial) || /sdk_gphone/i.test(model),
    },
    summary: summarizeAndroidMemorySamples(samples, { warmupSamples: options.warmupSamples }),
    samples,
  };

  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Report: ${output}`);
  console.log(JSON.stringify(report.summary, null, 2));
  if (!report.summary.validSamples) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
