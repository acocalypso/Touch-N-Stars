import test from 'node:test';
import assert from 'node:assert/strict';

import {
  splitCsvLine,
  parseRaHours,
  parseDecDegrees,
  parseSizeDeg,
  parseTelescopiusCsv,
  listNameFromFileName,
} from '../csvImport.js';

const HEADER =
  'Catalogue Entry,Familiar Name,Alternative Entries,Type,Constellation,' +
  'Right Ascension (j2000),Declination (j2000),Magnitude,Size,' +
  'Surface Brightness (mag/arcsec2),Rises over 30º,Transit Time,Sets below 30º,' +
  'Maximum Altitude,Position Angle (East),Next Opposition,Notes,' +
  'Right Ascension (jNow),Declination (jNow),Label';

// Rows taken verbatim from a real Telescopius export, including the broken `""` escaping
// of the arcsecond quote and the U+00BA degree sign.
const ROW_IC1396 =
  'IC 1396,Elephant Trunk,"CL COLLINDER 439,CL TRUMPLER 37,CTB 105,OCL 222,OCL 222.0",' +
  'Emission Nebula,Cepheus,21h 38\' 59"",57º 30\' 50"",,2.4º,,18:09 hr,01:25 hr,08:53 hr,' +
  '80.5617º,,August 16,,21h 39\' 48"",57º 38\' 06"",Elephant Trunk';

const ROW_M33 =
  'M 33,Triangulum Galaxy,"NGC 598,MCG +05-04-069,PGC 5818,UGC 1117",Spiral Galaxy,Triangulum,' +
  '01h 33\' 51"",30º 39\' 37"",5.70,1º,22.70,00:11 hr,05:19 hr,10:32 hr,72.5755º,,October 18,,' +
  '01h 35\' 21"",30º 47\' 45"",Triangulum Galaxy';

const ROW_IC447 =
  'IC 447,IC 447,,Deep Sky Object,Monoceros,06h 31\' 00"",10º 06\' 00"",,2.8º,,06:36 hr,' +
  '10:15 hr,14:05 hr,52.0172º,0.00,December 29,Focal length 750mm,06h 32\' 28"",' +
  '10º 04\' 46"",IC 447';

const ROW_IC1805 =
  'IC 1805,Heart Nebula,"SH 2-190,LBN 654",Open Cluster,Cassiopeia,02h 32\' 50"",' +
  '61º 28\' 16"",6.50,13\',21.60,22:27 hr,06:18 hr,14:18 hr,76.6062º,,November 2,,' +
  '02h 34\' 53"",61º 35\' 14"",Heart Nebula';

// Header ends with CRLF, data rows with LF, plus a trailing empty line - as in the real export.
const SAMPLE_CSV = `${HEADER}\r\n${ROW_IC1396}\n${ROW_M33}\n${ROW_IC447}\n${ROW_IC1805}\n`;

const HOURS_M33 = 1 + 33 / 60 + 51 / 3600;
const DEG_M33 = 30 + 39 / 60 + 37 / 3600;

/** Assert two floats are equal within one milliarcsecond worth of precision. */
function assertClose(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) < 1e-8,
    message || `expected ${actual} to be close to ${expected}`
  );
}

test('splitCsvLine keeps commas inside quoted fields together', () => {
  assert.deepEqual(splitCsvLine('IC 1396,Elephant Trunk,"CL COLLINDER 439,CTB 105",Cepheus'), [
    'IC 1396',
    'Elephant Trunk',
    'CL COLLINDER 439,CTB 105',
    'Cepheus',
  ]);
});

test('splitCsvLine treats a stray quote in an unquoted field as literal text', () => {
  assert.deepEqual(splitCsvLine('21h 38\' 59"",57º 30\' 50""'), ['21h 38\' 59""', '57º 30\' 50""']);
});

test('splitCsvLine unescapes doubled quotes inside a quoted field', () => {
  assert.deepEqual(splitCsvLine('a,"say ""hi""",b'), ['a', 'say "hi"', 'b']);
});

test('splitCsvLine supports an alternative delimiter', () => {
  assert.deepEqual(splitCsvLine('a;b;c', ';'), ['a', 'b', 'c']);
});

test('parseRaHours parses the Telescopius format into hours', () => {
  assertClose(parseRaHours('01h 33\' 51""'), HOURS_M33);
});

test('parseRaHours accepts colon, space separated and decimal input', () => {
  assertClose(parseRaHours('21:38:59'), parseRaHours('21 38 59'));
  assertClose(parseRaHours('12.5'), 12.5);
});

test('parseRaHours rejects out-of-range and unparsable values', () => {
  assert.equal(parseRaHours('25h 00\' 00"'), null);
  assert.equal(parseRaHours('not a coordinate'), null);
  assert.equal(parseRaHours(''), null);
  assert.equal(parseRaHours(undefined), null);
});

test('parseDecDegrees parses declinations with the U+00BA degree sign', () => {
  assertClose(parseDecDegrees('30º 39\' 37""'), DEG_M33);
});

test('parseDecDegrees applies the sign to every component', () => {
  assertClose(parseDecDegrees('-12° 30\' 00"'), -12.5);
  assertClose(parseDecDegrees('−12° 30\' 00"'), -12.5);
  assertClose(parseDecDegrees('+30:39:37'), DEG_M33);
});

test('parseDecDegrees rejects out-of-range values', () => {
  assert.equal(parseDecDegrees('91º 00\' 00"'), null);
  assert.equal(parseDecDegrees('-91'), null);
});

test('parseSizeDeg normalizes degrees, arcminutes and arcseconds', () => {
  assertClose(parseSizeDeg('2.4º'), 2.4);
  assertClose(parseSizeDeg('1º'), 1);
  assertClose(parseSizeDeg("13'"), 13 / 60);
  assertClose(parseSizeDeg('45"'), 45 / 3600);
  assertClose(parseSizeDeg('3'), 3);
});

test('parseSizeDeg returns null for empty or unparsable values', () => {
  assert.equal(parseSizeDeg(''), null);
  assert.equal(parseSizeDeg('n/a'), null);
});

test('parseTelescopiusCsv parses the real export sample', () => {
  const { targets, errors, warnings } = parseTelescopiusCsv(SAMPLE_CSV);

  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(
    targets.map((t) => t.name),
    ['IC 1396', 'M 33', 'IC 447', 'IC 1805']
  );
});

test('parseTelescopiusCsv maps a target to the API-compatible shape', () => {
  const { targets } = parseTelescopiusCsv(SAMPLE_CSV);
  const m33 = targets.find((t) => t.name === 'M 33');

  assertClose(m33.coordinates.ra, HOURS_M33);
  assertClose(m33.coordinates.dec, DEG_M33);
  assertClose(m33.size_deg, 1);
  assertClose(m33.magnitude, 5.7);
  assert.equal(m33.type, 'Spiral Galaxy');
  assert.equal(m33.constellation, 'Triangulum');
  assert.equal(m33.familiarName, 'Triangulum Galaxy');
  assert.equal(m33.source, 'csv');
});

test('parseTelescopiusCsv uses the j2000 columns, not jNow', () => {
  const { targets } = parseTelescopiusCsv(SAMPLE_CSV);
  const ic1396 = targets.find((t) => t.name === 'IC 1396');

  // jNow would be 21h 39' 48" / 57º 38' 06"
  assertClose(ic1396.coordinates.ra, 21 + 38 / 60 + 59 / 3600);
  assertClose(ic1396.coordinates.dec, 57 + 30 / 60 + 50 / 3600);
});

test('parseTelescopiusCsv keeps notes and omits absent optional fields', () => {
  const { targets } = parseTelescopiusCsv(SAMPLE_CSV);
  const ic447 = targets.find((t) => t.name === 'IC 447');
  const ic1396 = targets.find((t) => t.name === 'IC 1396');

  assert.equal(ic447.notes, 'Focal length 750mm');
  // Familiar name equals the catalogue entry, so it is not duplicated.
  assert.equal(ic447.familiarName, undefined);
  assert.equal(ic1396.notes, undefined);
  assert.equal(ic1396.magnitude, undefined);
});

test('parseTelescopiusCsv supports a semicolon delimited export', () => {
  const csv =
    'Catalogue Entry;Familiar Name;Right Ascension (j2000);Declination (j2000)\r\n' +
    'M 33;Triangulum Galaxy;01h 33\' 51";30º 39\' 37"\n';
  const { targets, errors } = parseTelescopiusCsv(csv);

  assert.deepEqual(errors, []);
  assert.equal(targets.length, 1);
  assertClose(targets[0].coordinates.ra, HOURS_M33);
});

test('parseTelescopiusCsv strips a UTF-8 BOM', () => {
  const { errors, targets } = parseTelescopiusCsv(`﻿${SAMPLE_CSV}`);

  assert.deepEqual(errors, []);
  assert.equal(targets[0].name, 'IC 1396');
});

test('parseTelescopiusCsv reports missing mandatory columns', () => {
  const { errors, targets } = parseTelescopiusCsv('Catalogue Entry,Type\nM 33,Spiral Galaxy\n');

  assert.deepEqual(targets, []);
  assert.match(errors[0], /missingColumns/);
});

test('parseTelescopiusCsv skips broken rows but keeps the valid ones', () => {
  const csv = `${HEADER}\r\n${ROW_M33}\nBroken Row,,,,,not-a-coordinate,also-broken\n${ROW_IC447}\n`;
  const { targets, warnings, errors } = parseTelescopiusCsv(csv);

  assert.deepEqual(errors, []);
  assert.deepEqual(
    targets.map((t) => t.name),
    ['M 33', 'IC 447']
  );
  assert.deepEqual(warnings, [{ line: 3, name: 'Broken Row' }]);
});

test('parseTelescopiusCsv reports when nothing could be imported', () => {
  const csv = `${HEADER}\r\nBroken Row,,,,,not-a-coordinate,also-broken\n`;
  const { targets, errors } = parseTelescopiusCsv(csv);

  assert.deepEqual(targets, []);
  assert.ok(errors.includes('noValidRows'));
});

test('parseTelescopiusCsv reports empty input', () => {
  assert.ok(parseTelescopiusCsv('').errors.includes('empty'));
  assert.ok(parseTelescopiusCsv(HEADER).errors.includes('empty'));
});

test('listNameFromFileName derives a readable name from the export file name', () => {
  assert.equal(listNameFromFileName('telescopius_list_Target_1.csv'), 'Target 1');
  assert.equal(listNameFromFileName('My Autumn Targets.csv'), 'My Autumn Targets');
});

test('listNameFromFileName falls back when nothing is left', () => {
  assert.equal(listNameFromFileName('telescopius_list_.csv'), 'Imported list');
  assert.equal(listNameFromFileName(''), '');
});
