// Parses PHD2 guide log text into structured sessions.

const DITHER_SETTLE_FRAMES = 30;

function splitCsv(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') {
      inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function parsePhd2Log(text) {
  const lines = text.split(/\r?\n/);
  const sessions = [];
  const calibrations = [];
  let info = {};
  let calibLines = [];
  let inCalib = false;
  let current = null;
  let headers = null;
  let framesUntilSettled = 0;

  // New-format calibration state
  let calibCurrent = null;
  let inCalibStep = false;
  let lastCalibIdx = null; // most recent calibration — reused by all sessions until a new one runs

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // PHD2 version
    const verM = line.match(/^PHD2 version (.+)/);
    if (verM) {
      info.version = verM[1].trim();
      continue;
    }

    // Calibration setup params (on the same Mount = ... line, before equipFields consumes it)
    if (calibCurrent) {
      const csM = line.match(/Calibration Step\s*=\s*(\d+)\s*ms/i);
      if (csM) calibCurrent.stepSize = parseInt(csM[1]);
      const cdM = line.match(/Calibration Distance\s*=\s*(\d+)\s*px/i);
      if (cdM) calibCurrent.calDistance = parseInt(cdM[1]);
    }

    // Equipment fields — also update calibCurrent.info when active
    const equipFields = [
      [/^Equipment Profile\s*=\s*(.+)/, 'profile'],
      [/^Camera\s*=\s*(.+)/, 'camera'],
      [/^Mount\s*=\s*(.+)/, 'mount'],
      [/^Focal length\s*=\s*([\d.]+)\s*mm/i, 'focalLength', parseFloat],
      [/^Pixel scale\s*=\s*([\d.]+)\s*arc-sec\/px/i, 'pixelScale', parseFloat],
      [/^Scale\s*=\s*([\d.]+)\s*arc-sec\/px/i, 'pixelScale', parseFloat],
    ];
    let matched = false;
    for (const [re, key, fn] of equipFields) {
      const m = line.match(re);
      if (m) {
        const val = fn ? fn(m[1]) : m[1].trim();
        info[key] = val;
        if (calibCurrent) calibCurrent.info[key] = val;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // ── New-format calibration session (Calibration Begins at ...) ──────────
    const cbM = line.match(/^Calibration Begins at (.+)/);
    if (cbM) {
      inCalib = false;
      if (calibCurrent?.steps.length) calibrations.push(calibCurrent);
      calibCurrent = { startTime: cbM[1].trim(), info: { ...info }, steps: [], results: [] };
      inCalibStep = false;
      continue;
    }

    if (calibCurrent) {
      // Guiding begins right after calibration — flush and fall through
      if (/^Guiding Begins/.test(line)) {
        if (calibCurrent.steps.length) {
          lastCalibIdx = calibrations.length;
          calibrations.push(calibCurrent);
        }
        calibCurrent = null;
        inCalibStep = false;
        // fall through to Guiding Begins handler below
      } else {
        // Column header
        if (/^Direction,Step,dx,dy/.test(line)) {
          inCalibStep = true;
          continue;
        }

        // Calibration complete (closes session)
        if (/^Calibration complete/.test(line)) {
          lastCalibIdx = calibrations.length;
          calibrations.push(calibCurrent);
          calibCurrent = null;
          inCalibStep = false;
          continue;
        }

        // Per-axis summary: "West calibration complete. Angle = ..."
        const sumM = line.match(
          /^(\w+) calibration complete\.\s*Angle = ([-\d.]+) deg,\s*Rate = ([\d.]+) px\/sec,\s*Parity = (\w+)/
        );
        if (sumM) {
          calibCurrent.results.push({
            direction: sumM[1],
            angle: parseFloat(sumM[2]),
            rate: parseFloat(sumM[3]),
            parity: sumM[4],
          });
          continue;
        }

        // Step data row
        if (inCalibStep) {
          const stepM = line.match(
            /^(\w+),(\d+),([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)/
          );
          if (stepM) {
            calibCurrent.steps.push({
              direction: stepM[1],
              step: parseInt(stepM[2]),
              dx: parseFloat(stepM[3]),
              dy: parseFloat(stepM[4]),
              x: parseFloat(stepM[5]),
              y: parseFloat(stepM[6]),
              dist: parseFloat(stepM[7]),
            });
            continue;
          }
        }

        continue; // skip other header lines inside calibration section
      }
    }

    // ── Old-format calibration section (legacy logs) ─────────────────────────
    if (/^Calibration data/i.test(line)) {
      inCalib = true;
      calibLines = [];
      continue;
    }
    if (inCalib) {
      const cm = line.match(
        /Direction\s*=\s*(\w+),\s*Steps\s*=\s*(\d+),\s*Dx\s*=\s*([-\d.]+),\s*Dy\s*=\s*([-\d.]+),\s*Angle\s*=\s*([\d.]+),\s*Rate\s*=\s*([\d.]+)\s*px\/s/
      );
      if (cm) {
        calibLines.push({
          direction: cm[1],
          steps: parseInt(cm[2]),
          dx: parseFloat(cm[3]),
          dy: parseFloat(cm[4]),
          angle: parseFloat(cm[5]),
          rate: parseFloat(cm[6]),
        });
        continue;
      }
    }

    // Guiding Begins
    const gbM = line.match(/^Guiding Begins at (.+)/);
    if (gbM) {
      inCalib = false;
      if (current?.frames.length) sessions.push(current);
      headers = null;
      framesUntilSettled = 0;
      current = {
        startTime: gbM[1].trim(),
        frames: [],
        ditherFrames: new Set(),
        calibration: [...calibLines],
        info: { ...info },
        calibrationIdx: lastCalibIdx,
      };
      continue;
    }

    if (!current) continue;

    // Guiding Ends
    const geM = line.match(/^Guiding Ends at (.+)/);
    if (geM) {
      current.endTime = geM[1].trim();
      if (current.frames.length) sessions.push(current);
      current = null;
      continue;
    }

    // Normalized guide rates (arcsec/sec) from guiding-start header
    const normM = line.match(/Norm rates RA\s*=\s*([\d.]+)"\/s[^,]*,\s*Dec\s*=\s*([\d.]+)"\/s/i);
    if (normM) {
      current.normRaRate = parseFloat(normM[1]);
      current.normDecRate = parseFloat(normM[2]);
      continue;
    }

    // Dither / settling events (non-data lines)
    if (!/^\d/.test(line) && !line.startsWith('"Frame"') && !/^Frame[,"']/.test(line)) {
      if (/dither/i.test(line)) framesUntilSettled = DITHER_SETTLE_FRAMES;
      if (/settling complete/i.test(line)) framesUntilSettled = 0;
      continue;
    }

    // Column headers
    if (line.startsWith('"Frame"') || line.startsWith('Frame')) {
      headers = splitCsv(line).map((h) => h.replace(/"/g, '').trim());
      continue;
    }

    // Data row
    if (headers && /^\d/.test(line)) {
      const vals = splitCsv(line);
      if (vals.length < 5) continue;

      const col = (name) => {
        const lower = name.toLowerCase();
        const idx = headers.findIndex((h) => h.toLowerCase() === lower);
        return idx >= 0 ? vals[idx] : '0';
      };

      const frameNum = parseInt(vals[0]) || current.frames.length + 1;
      if (framesUntilSettled > 0) {
        framesUntilSettled--;
        current.ditherFrames.add(frameNum);
      }

      current.frames.push({
        frame: frameNum,
        time: parseFloat(vals[1]) || 0,
        dx: parseFloat(col('dx')) || 0,
        dy: parseFloat(col('dy')) || 0,
        raRaw: parseFloat(col('RaRawDistance')) || 0,
        decRaw: parseFloat(col('DecRawDistance')) || 0,
        raGuide: parseFloat(col('RaGuideDistance')) || 0,
        decGuide: parseFloat(col('DecGuideDistance')) || 0,
        raDuration: parseInt(col('RaDuration')) || 0,
        decDuration: parseInt(col('DecDuration')) || 0,
        raDir: col('RaDirection').trim(),
        decDir: col('DecDirection').trim(),
        snr: parseFloat(col('SNR')) || 0,
        starMass: parseFloat(col('StarMass')) || 0,
        starError: parseFloat(col('StarError')) || 0,
      });
    }
  }

  if (current?.frames.length) sessions.push(current);
  if (calibCurrent?.steps.length) calibrations.push(calibCurrent);
  return { sessions, calibrations };
}

export function calcStats(frames, pixelScale, excluded) {
  const ps = pixelScale || 1;
  const active = frames.filter((f) => !excluded.has(f.frame));
  if (!active.length) return null;

  const ra = active.map((f) => f.raRaw * ps);
  const dec = active.map((f) => f.decRaw * ps);
  const rms = (arr) => Math.sqrt(arr.reduce((s, v) => s + v * v, 0) / arr.length);

  const rmsRa = rms(ra);
  const rmsDec = rms(dec);

  return {
    rmsRa: rmsRa.toFixed(2),
    rmsDec: rmsDec.toFixed(2),
    rmsTotal: Math.sqrt(rmsRa ** 2 + rmsDec ** 2).toFixed(2),
    peakRa: Math.max(...ra.map(Math.abs)).toFixed(2),
    peakDec: Math.max(...dec.map(Math.abs)).toFixed(2),
    unit: pixelScale ? '"' : 'px',
    frameCount: active.length,
    totalFrames: frames.length,
    excludedCount: frames.length - active.length,
  };
}
