import { deepSkyObjectTypeKey } from '@acocalypso/celestia-atlas';
import { degreesToDMS, degreesToHMS } from '../../utils/utils.js';
import { atlasSelectionToFraming } from './contracts.js';
import { normalizeAtlasObjectTypeKey } from './catalogFilters.js';

function uniqueNames(target) {
  return [
    target?.displayName,
    target?.name,
    ...(Array.isArray(target?.aliases) ? target.aliases : []),
  ]
    .map((value) => String(value ?? '').trim())
    .filter((value, index, values) => value && values.indexOf(value) === index);
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// Apparent size in arc minutes. OpenNGC records carry major/minor, the curated
// Messier entries a `shape`, solar-system bodies nothing at all.
function angularSizeArcmin(target) {
  const shape = target?.shape;
  const size = target?.angularSizeArcMin;
  const major = finiteOrNull(
    shape?.majorArcmin ?? shape?.diameterArcmin ?? size?.major ?? target?.major
  );
  if (major === null || major <= 0) return null;
  const minor = finiteOrNull(shape?.minorArcmin ?? size?.minor ?? target?.minor);
  return { major, minor: minor !== null && minor > 0 ? minor : null };
}

// Catalogue facts the target card shows. Every field is null when the payload
// does not carry it, so the card can drop the row instead of printing "NaN".
function selectionInfo(target) {
  const typeKey = normalizeAtlasObjectTypeKey(deepSkyObjectTypeKey(target));
  const constellation = String(target?.con ?? '').trim();
  return {
    typeKey: typeKey || null,
    magnitude: finiteOrNull(target?.magnitude ?? target?.mag),
    sizeArcmin: angularSizeArcmin(target),
    constellation: constellation || null,
  };
}

export function atlasSelectionToCommandModel(target) {
  if (!target) return null;

  const names = uniqueNames(target);
  const info = selectionInfo(target);
  try {
    const commandTarget = atlasSelectionToFraming(target);
    return {
      names,
      info,
      raDeg: commandTarget.RA,
      decDeg: commandTarget.Dec,
      raString: degreesToHMS(commandTarget.RA),
      decString: degreesToDMS(commandTarget.Dec),
      commandTarget,
    };
  } catch {
    return {
      names,
      info,
      raDeg: null,
      decDeg: null,
      raString: '',
      decString: '',
      commandTarget: null,
    };
  }
}
