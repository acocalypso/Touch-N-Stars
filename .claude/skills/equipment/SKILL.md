---
name: equipment
description: Work on equipment devices — INDI driver selection, device lists, connect/disconnect, and the NINA profile values behind them (camera, mount, focuser, filter wheel, rotator, switch, weather, flat device, dome, safety monitor, guider). Use for device dropdowns, driver changes, OFFLINE devices, connection ordering, and any `<X>Settings-…` profile write.
---

# Equipment and device handling

## The device map is code, not documentation

`src/utils/equipmentDevices.js` holds `DEVICE_MAP` — the single source of truth
that maps an `apiAction` onto its profile section, its rescan key, the profile
field carrying the selection, and whether the device can be INDI-driven. Read it
instead of copying a table; when a device changes, that file changes.

Two things it encodes that are easy to get wrong:

- **The guider is the exception**: its selection lives under
  `GuiderSettings-GuiderName`, every other device under `<Section>-Id`.
- **`existingEquipmentList` names the focuser `focuser`, the rescan key is
  `focus`.** That is why `API_NAME_TO_ACTION` exists and cannot be derived from
  `DEVICE_MAP`.

INDI device types for `apiPinsService.getINDIDeviceList()` are named differently
again: `camera, focuser, filterwheel, rotator, telescope, weather, switches,
flatpanel, dome, safetymonitor`.

## Changing an INDI driver: always four steps

```
profileChangeValue('<Section>-IndiDriver', name)
  → apiService.<x>Action('list-devices')
  → equipmentStore.triggerRescan('<key>')
  → store.fetchProfilInfos()
```

Implemented generically in `src/components/setupWizard/IndiDriverSelect.vue`
(`applyDriver`, line 89). `src/components/equipment/selectIndi.vue` predates it
and repeats the same body ten times, once per device — when you touch the flow,
check whether both need the change.

`equipmentStore.triggerRescan(key)` just writes `Date.now()` into
`rescanTrigger[key]`; consumers watch that value. It is a signal, not a request,
so it must be paired with the `list-devices` call that actually refreshes.

## Selecting a device

Use `setProfileDevice(apiAction, deviceId)` from `equipmentDevices.js`. Writing
the selection only into component state does not survive the next device-list
refresh — that was the bug that made **"No device" impossible to choose**
(`37b4a51d`).

## OFFLINE devices and driver reload

INDI drivers enumerate hardware **once, at driver start**. A device powered up
afterwards — the normal case when a power box switches its ports — stays
invisible, and PINS lists it from the profile cache with `Category: 'OFFLINE'`.
Connecting to such an entry always fails.

- `isOfflineDevice(device)` detects it (category, plus a `(OFFLINE)` suffix
  fallback).
- `reloadIndiDriver(apiAction)` restarts the driver by setting it to `'None'`
  and back, with a `list-devices` call after each write.
- `resolveReloadedDevice(offlineEntry, devices)` finds the real device
  afterwards. **The Id changes across a reload** — the placeholder Id came from
  the profile, the restarted driver derives it from the INDI device name. Match
  by Id, then by DisplayName minus the marker; never fall back to "the only INDI
  device in the list", which would silently connect the wrong one of two
  same-type devices.
- `reloadIndiDriver` deliberately does **not** call `triggerRescan()` — that
  would collide with the calling `selectDevices` instance's own fetch
  generation. Callers refresh their own list.

Covered by `src/utils/__tests__/equipmentDevices.test.js`; extend it rather than
testing through the component.

## Connection ordering

`connectAll()` in `src/components/equipment/connectEquipment.vue:642`:

1. If a switch exists, connect it **first** and wait a hard-coded 5 s — power
   box ports need to come up before anything downstream.
2. `reloadOfflineIndiDrivers()` — recover OFFLINE entries before connecting.
3. Then iterate `store.existingEquipmentList` in **its** order (not a fixed
   list). The switch case is a no-op there because step 1 handled it.
4. The mount asks `checkMountConnectionPermission()` first (location sync) and
   then `waitForMountConnected()` — so the mount is connected before the guider
   is reached.
5. In PINS mode the guider is skipped unless `store.mountInfo.Connected` **and**
   `guiderStore.guidecamOk`.

## Profile settings: the traps

Every write goes through `apiService.profileChangeValue('<Section>-<Key>', value)`.

- Camera **chip size in pixels** lives under
  `FramingAssistantSettings-CameraWidth` / `-CameraHeight`, **not** under
  `CameraSettings`.
- Camera **pixel size** (`CameraSettings-PixelSize`) is never reported at
  runtime. `store.cameraInfo` carries `XSize`/`YSize` but no pixel size — it is
  always a manual entry.
- `XSize`/`YSize` ≤ 0 means the driver reports no sensor size. That is the
  de-facto **DSLR detection** (`src/components/camera/CenterHere.vue`).
- **Two different slew rates.** `TelescopeSettings-IndiMaxSlewRateDps` is the
  profile-side driver limit. The manual jog rate in
  `src/components/mount/setSlewRatePins.vue` comes from
  `GET indi/mount/slew-rates` (driver capabilities) and is deliberately
  decoupled from it.
- Several settings components seed from the profile in `onMounted` only and then
  keep showing their defaults when the 2 s poll delivers late
  (`settingsSensor.vue`, `settingsMount.vue`, `settingsTelescope.vue`). In new
  components watch `store.profileInfo` instead, and guard user edits with a
  "touched" flag.

## Device quirks

Extra settings panels live in `src/components/equipment/`: filter wheel slot
count (`SettingsFilterWheelSlotNum.vue`), Switch SV241 Pro
(`SettingsSwitchSV241Pro.vue`), weather API keys (`SettingsWeather.vue`).
The focuser `indi_myfocuserpro2_focus` is renamed to "Gemini / MyFocuserPro2",
and `indi_gemini_focus` is filtered out.

Cameras have **no** `SettingsSerialConnection` fallback — only
`SettingsAlpacaDirect` when `Category === 'ASCOM Alpaca'`, otherwise the
`components.alpacaDirect.cameraNoSettings` note.
