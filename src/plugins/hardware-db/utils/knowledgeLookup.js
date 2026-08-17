import { normalizeDeviceName, stripHardwareSuffix } from './snapshotSerializer';

/**
 * Answers "what does the database already know about this device?" while the
 * user is rating it.
 *
 * Matching reuses the very functions the submit side uses to write names. If
 * the two ever diverged, the app would fail to find entries it had created
 * itself — so both come from snapshotSerializer.js rather than being restated
 * here.
 */

/** Most severe first, used to pick what a device with several drivers shows. */
const STATUS_SEVERITY = { broken: 3, caveat: 2, works: 1 };

function pushKey(map, key, entry) {
  if (!key) return;
  const list = map.get(key);
  if (list) {
    if (!list.includes(entry)) list.push(entry);
  } else {
    map.set(key, [entry]);
  }
}

/**
 * Joins the two record lists into lookup tables. Pure — the caller hands it
 * plain arrays from the network or the cache, which keeps it directly testable.
 *
 * @param {Array} rawEntries hw_entries records, expanded with their device
 * @param {Array} rawNotes hw_notes records
 */
export function buildKnowledgeIndex(rawEntries = [], rawNotes = []) {
  const notesByEntry = new Map();
  for (const note of Array.isArray(rawNotes) ? rawNotes : []) {
    const text = String(note?.text ?? '').trim();
    if (!note?.entry || !text) continue;
    const list = notesByEntry.get(note.entry) || [];
    list.push(text);
    notesByEntry.set(note.entry, list);
  }

  const entries = [];
  const byDevice = new Map();

  for (const raw of Array.isArray(rawEntries) ? rawEntries : []) {
    const device = raw?.expand?.device;
    const driver = String(raw?.driver ?? '').trim();
    if (!device || !driver) continue;

    const vendor = String(device.vendor ?? '').trim();
    // Strip on the stored side too: a reviewer can carry the rig-specific USB
    // suffix into the model field ("ATR585M (7c-2-2-3)"), and such an entry
    // would then never match the cleaned name this app sends.
    const model = stripHardwareSuffix(device.model);

    const entry = {
      id: raw.id,
      driver,
      status: raw.status || 'works',
      reportCount: Number(raw.reportCount) || 1,
      vendor,
      model,
      notes: notesByEntry.get(raw.id) || [],
    };
    entries.push(entry);

    // A device may be known by its full name, by the bare model, or by any
    // spelling a reviewer recorded as an alias.
    pushKey(byDevice, normalizeDeviceName(`${vendor} ${model}`), entry);
    pushKey(byDevice, normalizeDeviceName(model), entry);
    for (const alias of Array.isArray(device.aliases) ? device.aliases : []) {
      pushKey(byDevice, normalizeDeviceName(stripHardwareSuffix(alias)), entry);
    }
  }

  return { entries, byDevice };
}

/**
 * The published record for one candidate of the local device list.
 *
 * The display name is tried first because it usually carries the vendor
 * ("ToupTek ATR585M"), while the bare name often does not ("ATR585M").
 *
 * @returns {null|object} the matching entry with its notes, or null
 */
export function lookupDevice(index, candidate = {}) {
  if (!index?.byDevice) return null;

  const keys = [
    normalizeDeviceName(stripHardwareSuffix(candidate.displayName)),
    normalizeDeviceName(stripHardwareSuffix(candidate.name)),
  ].filter(Boolean);

  for (const key of keys) {
    const matches = index.byDevice.get(key);
    if (!matches?.length) continue;

    const driverKey = normalizeDeviceName(candidate.driverInfo);
    const exact =
      driverKey && matches.find((entry) => normalizeDeviceName(entry.driver) === driverKey);
    if (exact) return exact;

    // No driver to go on — show the most severe result, then the most reported.
    // A warning is what the user needs to see, not the reassuring majority.
    return matches.reduce((best, entry) => {
      const severity = (STATUS_SEVERITY[entry.status] || 0) - (STATUS_SEVERITY[best.status] || 0);
      if (severity !== 0) return severity > 0 ? entry : best;
      return entry.reportCount > best.reportCount ? entry : best;
    });
  }

  return null;
}
