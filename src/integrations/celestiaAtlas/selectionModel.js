import { degreesToDMS, degreesToHMS } from '../../utils/utils.js';
import { atlasSelectionToFraming } from './contracts.js';

function uniqueNames(target) {
  return [target?.name, ...(Array.isArray(target?.aliases) ? target.aliases : [])]
    .map((value) => String(value ?? '').trim())
    .filter((value, index, values) => value && values.indexOf(value) === index);
}

export function atlasSelectionToCommandModel(target) {
  if (!target) return null;

  const names = uniqueNames(target);
  try {
    const commandTarget = atlasSelectionToFraming(target);
    return {
      names,
      raDeg: commandTarget.RA,
      decDeg: commandTarget.Dec,
      raString: degreesToHMS(commandTarget.RA),
      decString: degreesToDMS(commandTarget.Dec),
      commandTarget,
    };
  } catch {
    return {
      names,
      raDeg: null,
      decDeg: null,
      raString: '',
      decString: '',
      commandTarget: null,
    };
  }
}
