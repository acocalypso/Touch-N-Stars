/**
 * Parser for Telescopius CSV list exports.
 *
 * The exported files are not strictly RFC 4180 compliant, so this parser stays deliberately
 * tolerant. Confirmed quirks of the official export:
 *  - mixed line endings (header ends with CRLF, data rows with LF)
 *  - quoted fields containing commas ("Alternative Entries")
 *  - RA/Dec fields are NOT quoted but still escape their arcsecond quote: `01h 33' 51""`
 *  - the degree sign is U+00BA (MASCULINE ORDINAL INDICATOR), not U+00B0
 *  - many empty fields and a trailing empty line
 */

const BOM = '﻿';
const DEGREE_CHARS = '°º'; // ° and º
const MINUS_CHARS = '-−'; // ASCII hyphen and U+2212 MINUS SIGN

/** Column header aliases, all normalized (lowercase, collapsed whitespace). */
const COLUMNS = {
  catalogue: ['catalogue entry', 'catalog entry', 'catalogue', 'catalog'],
  familiarName: ['familiar name', 'common name', 'name'],
  label: ['label'],
  type: ['type', 'object type'],
  constellation: ['constellation'],
  ra: ['right ascension (j2000)', 'right ascension', 'ra (j2000)', 'ra'],
  dec: ['declination (j2000)', 'declination', 'dec (j2000)', 'dec'],
  magnitude: ['magnitude', 'mag'],
  size: ['size'],
  notes: ['notes', 'note'],
  positionAngle: ['position angle (east)', 'position angle', 'rotation'],
};

/**
 * Split a single CSV line into fields, honouring double quotes and `""` escapes.
 *
 * @param {string} line
 * @param {string} delimiter
 * @returns {string[]}
 */
export function splitCsvLine(line, delimiter = ',') {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote inside a quoted field.
        current += '"';
        i++;
      } else if (inQuotes) {
        inQuotes = false;
      } else if (current.length === 0) {
        // A quote only opens a field when it is the very first character.
        inQuotes = true;
      } else {
        // Stray quote in an unquoted field (Telescopius does this for RA/Dec).
        current += char;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields.map((field) => field.trim());
}

/** Normalize a header cell for alias matching. */
function normalizeHeader(value) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Strip the trailing arcsecond quotes Telescopius leaves in unquoted coordinate fields
 * and normalize the separators to spaces.
 */
function normalizeSexagesimal(value) {
  return value
    .replace(/"+$/g, '')
    .replace(new RegExp(`[hdm'"${DEGREE_CHARS}:]`, 'g'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parse the numeric components of a sexagesimal value; returns null when unusable. */
function parseComponents(value) {
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const negative = MINUS_CHARS.includes(raw[0]);
  const normalized = normalizeSexagesimal(raw.replace(/^[+\-−]/, '')).replace(',', '.');
  if (!normalized) return null;

  const parts = normalized.split(' ');
  const numbers = [];
  for (const part of parts) {
    const num = Number(part);
    if (!Number.isFinite(num)) return null;
    numbers.push(num);
  }
  if (numbers.length === 0 || numbers.length > 3) return null;

  const magnitude = (numbers[0] || 0) + (numbers[1] || 0) / 60 + (numbers[2] || 0) / 3600;
  return negative ? -magnitude : magnitude;
}

/**
 * Parse a right ascension into HOURS (the unit the Telescopius API uses for `coordinates.ra`).
 * Accepts `21h 38' 59"`, `21:38:59`, `21 38 59` and plain decimal hours.
 *
 * @param {string|number} value
 * @returns {number|null}
 */
export function parseRaHours(value) {
  const hours = parseComponents(value);
  if (hours === null || hours < 0 || hours >= 24) return null;
  return hours;
}

/**
 * Parse a declination into DEGREES. Accepts `57º 30' 50"`, `-12° 30' 00"`, `+30:39:37`.
 *
 * @param {string|number} value
 * @returns {number|null}
 */
export function parseDecDegrees(value) {
  const degrees = parseComponents(value);
  if (degrees === null || degrees < -90 || degrees > 90) return null;
  return degrees;
}

/**
 * Parse an angular size into DEGREES. Accepts `2.4º`, `13'`, `45"`.
 *
 * @param {string} value
 * @returns {number|null}
 */
export function parseSizeDeg(value) {
  if (!value) return null;

  const raw = String(value).trim().replace(',', '.');
  const match = raw.match(new RegExp(`^([0-9.]+)\\s*(['"${DEGREE_CHARS}]?)$`));
  if (!match) return null;

  const num = Number(match[1]);
  if (!Number.isFinite(num)) return null;

  if (match[2] === "'") return num / 60;
  if (match[2] === '"') return num / 3600;
  return num;
}

/** Parse a plain decimal cell (magnitude, position angle); empty cells are common. */
function parseDecimal(value) {
  if (!value) return null;
  const num = Number(
    String(value)
      .trim()
      .replace(new RegExp(`[${DEGREE_CHARS}]`, 'g'), '')
      .replace(',', '.')
  );
  return Number.isFinite(num) ? num : null;
}

/** Pick the delimiter by counting candidates outside of quotes in the header line. */
function detectDelimiter(headerLine) {
  const candidates = [',', ';', '\t'];
  let best = ',';
  let bestCount = 0;

  for (const candidate of candidates) {
    const count = splitCsvLine(headerLine, candidate).length;
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }
  return best;
}

/** Map normalized headers to column indexes. */
function mapColumns(headerFields) {
  const normalized = headerFields.map(normalizeHeader);
  const indexes = {};

  for (const [key, aliases] of Object.entries(COLUMNS)) {
    for (const alias of aliases) {
      const index = normalized.indexOf(alias);
      if (index !== -1) {
        indexes[key] = index;
        break;
      }
    }
  }
  return indexes;
}

function cell(fields, index) {
  if (index === undefined || index < 0 || index >= fields.length) return '';
  return fields[index].trim();
}

/**
 * Parse a Telescopius CSV export.
 *
 * Targets are shaped exactly like the ones returned by the Telescopius API (`coordinates.ra`
 * in hours, `coordinates.dec` in degrees) so that framing, slew and sequence-target reuse the
 * existing code paths unchanged.
 *
 * @param {string} text raw file contents
 * @returns {{targets: object[], errors: string[], warnings: {line: number, name: string}[]}}
 */
export function parseTelescopiusCsv(text) {
  const result = { targets: [], errors: [], warnings: [] };

  if (!text || !text.trim()) {
    result.errors.push('empty');
    return result;
  }

  const lines = text
    .replace(BOM, '')
    .split(/\r\n|\n|\r/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    result.errors.push('empty');
    return result;
  }

  const delimiter = detectDelimiter(lines[0]);
  const columns = mapColumns(splitCsvLine(lines[0], delimiter));

  const missing = [];
  if (columns.ra === undefined) missing.push('Right Ascension (j2000)');
  if (columns.dec === undefined) missing.push('Declination (j2000)');
  if (missing.length > 0) {
    result.errors.push(`missingColumns:${missing.join(', ')}`);
    return result;
  }

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCsvLine(lines[i], delimiter);

    const ra = parseRaHours(cell(fields, columns.ra));
    const dec = parseDecDegrees(cell(fields, columns.dec));

    const catalogue = cell(fields, columns.catalogue);
    const familiarName = cell(fields, columns.familiarName);
    const label = cell(fields, columns.label);
    const name = catalogue || familiarName || label;

    if (ra === null || dec === null) {
      result.warnings.push({ line: i + 1, name: name || '' });
      continue;
    }

    const target = {
      name: name || `Target ${i}`,
      coordinates: { ra, dec },
      source: 'csv',
    };

    const size = parseSizeDeg(cell(fields, columns.size));
    if (size !== null) target.size_deg = size;

    const notes = cell(fields, columns.notes);
    if (notes) target.notes = notes;

    if (familiarName && familiarName !== target.name) target.familiarName = familiarName;

    const type = cell(fields, columns.type);
    if (type) target.type = type;

    const constellation = cell(fields, columns.constellation);
    if (constellation) target.constellation = constellation;

    const magnitude = parseDecimal(cell(fields, columns.magnitude));
    if (magnitude !== null) target.magnitude = magnitude;

    // Telescopius' "Position Angle (East)" is the framing rotation.
    const positionAngle = parseDecimal(cell(fields, columns.positionAngle));
    if (positionAngle !== null) target.positionAngle = positionAngle;

    result.targets.push(target);
  }

  if (result.targets.length === 0) {
    result.errors.push('noValidRows');
  }

  return result;
}

/**
 * Derive a default list name from the uploaded file name.
 * `telescopius_list_Target_1.csv` -> `Target 1`
 *
 * @param {string} fileName
 * @returns {string}
 */
export function listNameFromFileName(fileName) {
  if (!fileName) return '';
  return (
    fileName
      .replace(/\.[^.]+$/, '')
      .replace(/^telescopius[_-]list[_-]/i, '')
      .replace(/[_]+/g, ' ')
      .trim() || 'Imported list'
  );
}
