import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVICE_FIELDS,
  MAX_MODEL_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_VENDOR_LENGTH,
  SCHEMA_VERSION,
  USER_STATUS,
  buildSubmissionPayload,
  deviceKey,
  enrichWithIndiPackages,
  extractArchitecture,
  extractDeviceCandidates,
  isGenericDriver,
  normalizeDeviceName,
  suggestVendorModel,
} from '@/plugins/hardware-db/utils/snapshotSerializer';

/**
 * A camera info object shaped like a real NINA response: the fields we want,
 * plus the pile of extras NINA sends along that must never be forwarded.
 */
function cameraInfoWithSecrets() {
  return {
    Connected: true,
    Name: 'ZWO ASI533MC Pro',
    DisplayName: 'ZWO ASI533MC Pro',
    DriverInfo: 'indi_asi_ccd',
    DriverVersion: '2.0.9',
    Category: 'INDI',
    // Everything below is realistic NINA/driver noise and must be dropped.
    DeviceId: 'SN-0123456789',
    SerialNumber: 'SN-0123456789',
    IpAddress: '10.42.0.1',
    HostName: 'pins-rig',
    Ssid: 'MyHomeWifi',
    Password: 'must-not-leak',
    ImageFilePath: 'C:\\Users\\Johannes\\Pictures\\NINA',
    Latitude: 48.137154,
    Longitude: 11.576124,
    ProfileName: 'Johannes Backyard',
    Email: 'johannes_maier@gmx.de',
  };
}

test('extractDeviceCandidates copies only allow-listed fields', () => {
  const [candidate] = extractDeviceCandidates({ cameraInfo: cameraInfoWithSecrets() });

  const allowed = new Set([...DEVICE_FIELDS, 'id']);
  for (const key of Object.keys(candidate)) {
    assert.ok(allowed.has(key), `unexpected field "${key}" in candidate`);
  }
  assert.equal(candidate.name, 'ZWO ASI533MC Pro');
  assert.equal(candidate.driverInfo, 'indi_asi_ccd');
  assert.equal(candidate.connectionType, 'indi');
});

test('payload never carries secrets, paths or coordinates', () => {
  const candidates = extractDeviceCandidates({ cameraInfo: cameraInfoWithSecrets() });
  const payload = buildSubmissionPayload({
    candidates,
    ratings: { camera: { status: USER_STATUS.WORKS, note: 'Works fine' } },
    installId: 'aaaa-bbbb',
    versions: { pins: '1.4.0', api: '2.2.11.0', tnsPlugin: '1.2.0.0', tns: '6.1.4' },
    mode: 'pins',
  });
  const serialized = JSON.stringify(payload);

  for (const secret of [
    'SN-0123456789',
    '10.42.0.1',
    'pins-rig',
    'MyHomeWifi',
    'must-not-leak',
    'Pictures',
    '48.137154',
    '11.576124',
    'Johannes Backyard',
    'johannes_maier@gmx.de',
  ]) {
    assert.equal(serialized.includes(secret), false, `payload leaked "${secret}"`);
  }
});

test('payload has the documented top-level shape', () => {
  const payload = buildSubmissionPayload({
    candidates: extractDeviceCandidates({ cameraInfo: cameraInfoWithSecrets() }),
    ratings: { camera: { status: USER_STATUS.WORKS } },
    installId: 'aaaa-bbbb',
    versions: { pins: '1.4.0', tns: '6.1.4' },
    architecture: 'arm64',
    mode: 'pins',
    platform: 'android',
    locale: 'de',
    submittedAt: '2026-08-17T21:04:00.000Z',
  });

  assert.deepEqual(Object.keys(payload).sort(), [
    'backend',
    'client',
    'devices',
    'installId',
    'schemaVersion',
    'submittedAt',
  ]);
  assert.equal(payload.schemaVersion, SCHEMA_VERSION);
  assert.equal(payload.backend.arch, 'arm64');
  assert.equal(payload.client.mode, 'pins');
  assert.equal(payload.client.platform, 'android');
});

test('unrated devices are dropped and an untouched form submits nothing', () => {
  const candidates = extractDeviceCandidates({
    cameraInfo: cameraInfoWithSecrets(),
    mountInfo: { Connected: true, Name: 'EQ6-R Pro', DriverInfo: 'indi_eqmod_telescope' },
  });
  assert.equal(candidates.length, 2);

  const partial = buildSubmissionPayload({
    candidates,
    ratings: { mount: { status: USER_STATUS.BROKEN } },
  });
  assert.equal(partial.devices.length, 1);
  assert.equal(partial.devices[0].category, 'mount');

  assert.equal(buildSubmissionPayload({ candidates, ratings: {} }), null);
});

test('a device that will not connect can still be reported', () => {
  // The whole point of the knowledge base: "does not work" is exactly the case
  // where the user cannot connect the device, so it must be reportable.
  const candidates = extractDeviceCandidates(
    { cameraInfo: { Connected: false } },
    {
      profileInfo: { CameraSettings: { Id: 'ZWO ASI533MC Pro', IndiDriver: 'indi_asi_ccd' } },
    }
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].name, 'ZWO ASI533MC Pro');
  assert.equal(candidates[0].driverInfo, 'indi_asi_ccd');
  assert.equal(candidates[0].connected, 'no');
});

test('a resolved display name beats the raw profile id', () => {
  const [candidate] = extractDeviceCandidates(
    { mountInfo: { Connected: false } },
    {
      profileInfo: { TelescopeSettings: { Id: 'ASCOM.EQMOD.Telescope' } },
      deviceNames: { mount: 'EQMOD ASCOM HEQ5/6' },
    }
  );

  assert.equal(candidate.name, 'EQMOD ASCOM HEQ5/6');
});

test('a disconnected device without a driver is reported anyway', () => {
  // Native devices report no driver while disconnected. Nothing is invented -
  // the field stays empty and the reviewer fills it in.
  const [candidate] = extractDeviceCandidates(
    { cameraInfo: { Connected: false } },
    { profileInfo: { CameraSettings: { Id: 'ATR585M' } } }
  );

  assert.equal(candidate.driverInfo, '');
  assert.equal(candidate.connected, 'no');

  const payload = buildSubmissionPayload({
    candidates: [candidate],
    ratings: { camera: { status: USER_STATUS.BROKEN } },
  });
  assert.equal(payload.devices[0].name, 'ATR585M');
  assert.equal('driverInfo' in payload.devices[0], false);
});

test('empty profile slots produce no candidates', () => {
  const candidates = extractDeviceCandidates(
    { cameraInfo: { Connected: false }, mountInfo: { Connected: false } },
    {
      profileInfo: {
        // NINA's placeholder for "nothing selected".
        CameraSettings: { Id: 'No_Device' },
        TelescopeSettings: { Id: '' },
      },
    }
  );

  assert.deepEqual(candidates, []);
});

test('a connected device wins over its profile entry', () => {
  const candidates = extractDeviceCandidates(
    { cameraInfo: cameraInfoWithSecrets() },
    { profileInfo: { CameraSettings: { Id: 'Stale Profile Name' } } }
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].name, 'ZWO ASI533MC Pro');
  assert.equal(candidates[0].connected, 'yes');
});

test('the INDI placeholder driver is not treated as a real driver', () => {
  const [candidate] = extractDeviceCandidates(
    { focuserInfo: { Connected: false } },
    { profileInfo: { FocuserSettings: { Id: 'MyFocuser', IndiDriver: 'None' } } }
  );

  assert.equal(candidate.driverInfo, '');
});

test('an invalid status is rejected rather than silently accepted', () => {
  const candidates = extractDeviceCandidates({ cameraInfo: cameraInfoWithSecrets() });
  assert.equal(
    buildSubmissionPayload({ candidates, ratings: { camera: { status: 'lgtm' } } }),
    null
  );
});

test('notes are truncated to the documented limit', () => {
  const candidates = extractDeviceCandidates({ cameraInfo: cameraInfoWithSecrets() });
  const payload = buildSubmissionPayload({
    candidates,
    ratings: { camera: { status: USER_STATUS.CAVEAT, note: 'x'.repeat(MAX_NOTE_LENGTH + 250) } },
  });

  assert.equal(payload.devices[0].userNote.length, MAX_NOTE_LENGTH);
});

test('connection type is derived from driver name and category', () => {
  const [alpaca] = extractDeviceCandidates({
    cameraInfo: {
      Connected: true,
      Name: 'Cam',
      DriverInfo: 'Alpaca Cam',
      Category: 'ASCOM Alpaca',
    },
  });
  assert.equal(alpaca.connectionType, 'alpaca');

  const [ascom] = extractDeviceCandidates({
    cameraInfo: { Connected: true, Name: 'Cam', DriverInfo: 'ASCOM Cam', Category: 'ASCOM' },
  });
  assert.equal(ascom.connectionType, 'ascom');

  const [native] = extractDeviceCandidates({
    cameraInfo: { Connected: true, Name: 'Cam', DriverInfo: 'ZWO Driver', Category: 'ZWO' },
  });
  assert.equal(native.connectionType, 'native');
});

test('INDI package data fills in driver version and package name', () => {
  const candidates = extractDeviceCandidates({ cameraInfo: cameraInfoWithSecrets() });
  const enriched = enrichWithIndiPackages(
    [{ ...candidates[0], driverVersion: '' }],
    [{ name: 'indi_asi_ccd', version: '2.1.0', architecture: 'arm64' }]
  );

  assert.equal(enriched[0].driverVersion, '2.1.0');
  assert.equal(enriched[0].indiDriver, 'indi_asi_ccd');
});

test('architecture falls back to empty when no package reports one', () => {
  assert.equal(extractArchitecture([{ name: 'x' }]), '');
  assert.equal(extractArchitecture([{ architecture: 'arm64' }]), 'arm64');
  assert.equal(extractArchitecture(undefined), '');
});

/*
 * The four cases below all come from one real PINS submission (Simulator rig,
 * 2026-08-17). They are the reason DeviceId was dropped and the placeholder
 * filter exists — none of them were caught by the synthetic fixtures.
 */

test('DeviceId is never transmitted, because drivers put serials there', () => {
  const payload = buildSubmissionPayload({
    candidates: extractDeviceCandidates({ cameraInfo: cameraInfoWithSecrets() }),
    ratings: { camera: { status: USER_STATUS.WORKS } },
  });

  assert.equal('deviceId' in payload.devices[0], false);
  assert.equal(DEVICE_FIELDS.includes('deviceId'), false);
});

test('placeholder driver strings are dropped instead of stored', () => {
  const [candidate] = extractDeviceCandidates({
    filterInfo: {
      Connected: true,
      Name: 'Manual Filter Wheel',
      DisplayName: 'Manual filter wheel',
      DriverInfo: 'n.A.',
      DriverVersion: '1.0',
    },
  });

  assert.equal(candidate.driverInfo, '');
  assert.equal(candidate.driverVersion, '1.0');
});

test('INDI is recognized from the display-name suffix when DriverInfo is empty', () => {
  const [candidate] = extractDeviceCandidates({
    mountInfo: {
      Connected: true,
      Name: 'Telescope Simulator',
      DisplayName: 'Telescope Simulator (INDI)',
    },
  });

  assert.equal(candidate.connectionType, 'indi');
});

test('a device with only a name still qualifies, one with nothing does not', () => {
  const candidates = extractDeviceCandidates({
    cameraInfo: { Connected: true, Name: 'Simulator Camera', DriverVersion: '3.3.0' },
    mountInfo: { Connected: true, DriverInfo: 'n.A.' },
  });

  assert.deepEqual(
    candidates.map((c) => c.category),
    ['camera']
  );
});

/*
 * The guide camera lives in no equipment store: on PINS it is chosen through
 * PHD2 and only recorded in the profile.
 */

test('the guide camera is reportable from the profile alone', () => {
  // The valuable case: PHD2 will not connect, so there is no readable name -
  // but "my guide camera does not work" must still be reportable.
  const [candidate] = extractDeviceCandidates(
    {},
    {
      profileInfo: {
        GuiderSettings: { PHD2Camera: 'ZWO ASI Camera', PHD2CameraId: 'ASI120MM Mini' },
      },
    }
  );

  assert.equal(candidate.id, 'guidecam');
  assert.equal(candidate.category, 'camera');
  assert.equal(candidate.driverInfo, 'ZWO ASI Camera');
  assert.equal(candidate.name, 'ASI120MM Mini');
  assert.equal(candidate.connectionType, 'phd2');
  assert.equal(candidate.connected, 'no');
});

test('a running PHD2 supplies the readable name and connection state', () => {
  const [candidate] = extractDeviceCandidates(
    {},
    {
      profileInfo: { GuiderSettings: { PHD2Camera: 'ZWO ASI Camera', PHD2CameraId: 'opaque-id' } },
      phd2: { equipment: { camera: { name: 'ZWO ASI120MM Mini', connected: true } } },
    }
  );

  assert.equal(candidate.name, 'ZWO ASI120MM Mini');
  assert.equal(candidate.connected, 'yes');
});

test('the camera id list resolves the model name the dropdown shows', () => {
  // selectGuiderCam.vue renders "driver - name" from exactly this list, so it
  // is the closest thing to what the user sees, and it describes the
  // *configured* camera rather than whatever PHD2 happens to have connected.
  const [candidate] = extractDeviceCandidates(
    {},
    {
      profileInfo: { GuiderSettings: { PHD2Camera: 'ZWO ASI Camera', PHD2CameraId: '0' } },
      phd2: {
        equipment: { camera: { name: 'Some Other Camera', connected: true } },
        cameraIds: {
          'ZWO ASI Camera': [
            { Id: '0', Name: 'ASI120MM Mini' },
            { Id: '1', Name: 'ASI174MM' },
          ],
        },
      },
    }
  );

  assert.equal(candidate.name, 'ASI120MM Mini');
});

test('an id missing from the list falls back without inventing a name', () => {
  const [candidate] = extractDeviceCandidates(
    {},
    {
      profileInfo: { GuiderSettings: { PHD2Camera: 'ZWO ASI Camera', PHD2CameraId: '7' } },
      phd2: { cameraIds: { 'ZWO ASI Camera': [{ Id: '0', Name: 'ASI120MM Mini' }] } },
    }
  );

  assert.equal(candidate.name, '7');
});

test('no guide camera is invented without a driver in the profile', () => {
  const withoutDriver = extractDeviceCandidates({}, { profileInfo: { GuiderSettings: {} } });
  assert.deepEqual(withoutDriver, []);

  const placeholder = extractDeviceCandidates(
    {},
    { profileInfo: { GuiderSettings: { PHD2Camera: 'None', PHD2CameraId: 'x' } } }
  );
  assert.deepEqual(placeholder, []);
});

test('guide camera and imaging camera coexist without sharing a rating', () => {
  const candidates = extractDeviceCandidates(
    { cameraInfo: cameraInfoWithSecrets() },
    {
      profileInfo: { GuiderSettings: { PHD2Camera: 'ZWO ASI Camera', PHD2CameraId: 'ASI120MM' } },
    }
  );

  assert.equal(candidates.length, 2);
  // Same database category on purpose - one device, several drivers - but
  // distinct row ids, or both rows would share one rating.
  assert.deepEqual(
    candidates.map((c) => c.category),
    ['camera', 'camera']
  );
  assert.deepEqual(
    candidates.map((c) => c.id),
    ['camera', 'guidecam']
  );
});

test('the row-only fields id and labelKey never reach the payload', () => {
  const candidates = extractDeviceCandidates(
    {},
    { profileInfo: { GuiderSettings: { PHD2Camera: 'ZWO ASI Camera', PHD2CameraId: 'ASI120MM' } } }
  );
  const payload = buildSubmissionPayload({
    candidates,
    ratings: { guidecam: { status: USER_STATUS.BROKEN } },
  });

  assert.equal('id' in payload.devices[0], false);
  assert.equal('labelKey' in payload.devices[0], false);
  assert.equal(payload.devices[0].connectionType, 'phd2');
});

test('a rig-specific USB path is stripped, a descriptive suffix is kept', () => {
  const [camera] = extractDeviceCandidates({
    cameraInfo: {
      Connected: true,
      Name: 'ATR585M',
      DisplayName: 'ToupTek ATR585M (7c-2-2-3)',
      DriverInfo: 'ToupTek SDK',
      DriverVersion: '59.29331.20250824',
    },
  });
  assert.equal(camera.displayName, 'ToupTek ATR585M');
  assert.equal(camera.connectionType, 'native');

  const [mount] = extractDeviceCandidates({
    mountInfo: { Connected: true, Name: 'EQ6-R', DisplayName: 'EQ6-R Pro (INDI)' },
  });
  assert.equal(mount.displayName, 'EQ6-R Pro (INDI)');
});

test('device names normalize across vendor spellings', () => {
  assert.equal(normalizeDeviceName('ZWO ASI533MC-Pro'), normalizeDeviceName('zwo  asi533mc pro'));
  assert.equal(
    deviceKey({ name: 'ZWO ASI533MC-Pro', driverInfo: 'indi_asi_ccd' }),
    deviceKey({ name: 'zwo asi533mc pro', driverInfo: 'INDI_ASI_CCD' })
  );
});

test('a driver that serves many products demands a model from the user', () => {
  // The reason the field exists at all: these drivers name a protocol, not a
  // piece of hardware.
  for (const driverInfo of [
    'indi_eqmod_telescope',
    'indi_lx200generic',
    'indi_synscan_telescope',
    'indi_ioptronv3_telescope',
    'indi_telescope_simulator',
    'indi_manual_wheel',
  ]) {
    assert.equal(isGenericDriver({ name: 'Mount', driverInfo }), true, driverInfo);
  }

  assert.equal(isGenericDriver({ name: 'ZWO ASI533MC Pro', driverInfo: 'indi_asi_ccd' }), false);
  assert.equal(isGenericDriver({ name: 'ToupTek ATR585M', driverInfo: 'ToupTek SDK' }), false);
});

test('a device with no driver at all counts as unidentified', () => {
  // Disconnected devices carry only a profile Id, and an ASCOM ProgID names the
  // driver rather than the hardware.
  assert.equal(isGenericDriver({ name: 'EQ6-R Pro', connected: 'no' }), true);
  assert.equal(isGenericDriver({ name: 'ASCOM.EQMOD.Telescope', driverInfo: 'EQMOD ASCOM' }), true);
});

test('the INDI driver is checked too, not just DriverInfo', () => {
  assert.equal(
    isGenericDriver({
      name: 'Mount',
      driverInfo: 'EQMod Mount',
      indiDriver: 'indi_eqmod_telescope',
    }),
    true
  );
});

test('vendor and model are prefilled from the collected names', () => {
  assert.deepEqual(
    suggestVendorModel({ name: 'ATR585M', displayName: 'ToupTek ATR585M (7c-2-2-3)' }),
    { vendor: 'ToupTek', model: 'ATR585M' }
  );
  assert.deepEqual(suggestVendorModel({ name: 'EQ6-R Pro (INDI)' }), {
    vendor: 'EQ6-R',
    model: 'Pro',
  });
  assert.deepEqual(suggestVendorModel({ name: 'ASI533MC' }), { vendor: '', model: 'ASI533MC' });
  // A ProgID is a driver identifier; prefilling it would be a wrong answer
  // dressed as a helpful one.
  assert.deepEqual(suggestVendorModel({ name: 'ASCOM.EQMOD.Telescope' }), {
    vendor: '',
    model: '',
  });
});

test('the user statement about the hardware reaches the payload', () => {
  const candidates = extractDeviceCandidates({
    mountInfo: { Connected: true, Name: 'EQMod Mount', DriverInfo: 'indi_eqmod_telescope' },
  });

  const payload = buildSubmissionPayload({
    candidates,
    ratings: {
      mount: {
        status: USER_STATUS.WORKS,
        vendor: '  Sky-Watcher  ',
        model: 'EQ6-R Pro',
      },
    },
  });

  assert.equal(payload.devices[0].userVendor, 'Sky-Watcher');
  assert.equal(payload.devices[0].userModel, 'EQ6-R Pro');

  // Empty input leaves the fields out rather than storing blanks.
  const bare = buildSubmissionPayload({
    candidates,
    ratings: { mount: { status: USER_STATUS.WORKS, vendor: '   ', model: '' } },
  });
  assert.equal('userVendor' in bare.devices[0], false);
  assert.equal('userModel' in bare.devices[0], false);
});

test('user text is capped like every other transmitted string', () => {
  const payload = buildSubmissionPayload({
    candidates: extractDeviceCandidates({
      mountInfo: { Connected: true, Name: 'EQMod Mount', DriverInfo: 'indi_eqmod_telescope' },
    }),
    ratings: {
      mount: {
        status: USER_STATUS.WORKS,
        vendor: 'v'.repeat(MAX_VENDOR_LENGTH + 50),
        model: 'm'.repeat(MAX_MODEL_LENGTH + 50),
      },
    },
  });

  assert.equal(payload.devices[0].userVendor.length, MAX_VENDOR_LENGTH);
  assert.equal(payload.devices[0].userModel.length, MAX_MODEL_LENGTH);
});

test('the schema version announces the user-named hardware', () => {
  assert.equal(SCHEMA_VERSION, 2);
});
