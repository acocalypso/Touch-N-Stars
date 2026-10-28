export function readLimit(value, integer = false) {
  if (value == null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || (integer && !Number.isSafeInteger(number)))
    throw new RangeError('Limit must be positive');
  return number;
}

export function moveCaptureRoi(roi, camera, settings, dx, dy, fraction = 0.1) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const alignment = (bin) => (2 * bin) / gcd(2, bin);
  const ax = alignment(settings.binX || 1);
  const ay = alignment(settings.binY || 1);
  const shift = (size, step) => Math.max(step, Math.round((size * fraction) / step) * step);
  const x = Math.max(
    0,
    Math.min(Math.floor((camera.width - roi.width) / ax) * ax, roi.x + dx * shift(roi.width, ax))
  );
  const y = Math.max(
    0,
    Math.min(Math.floor((camera.height - roi.height) / ay) * ay, roi.y + dy * shift(roi.height, ay))
  );
  return { ...roi, x, y };
}

export function selectionToRoi(source, selection) {
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const endX = source.x + source.width;
  const endY = source.y + source.height;
  const x = Math.min(endX - 2, Math.floor((source.x + source.width * clamp(selection.x)) / 2) * 2);
  const y = Math.min(endY - 2, Math.floor((source.y + source.height * clamp(selection.y)) / 2) * 2);
  const width = Math.min(
    endX - x,
    Math.max(2, Math.floor((source.width * clamp(selection.width)) / 2) * 2)
  );
  const height = Math.min(
    endY - y,
    Math.max(2, Math.floor((source.height * clamp(selection.height)) / 2) * 2)
  );
  return { x, y, width, height };
}
