export function readLimit(value, integer = false) {
  if (value == null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || (integer && !Number.isSafeInteger(number)))
    throw new RangeError('Limit must be positive');
  return number;
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
