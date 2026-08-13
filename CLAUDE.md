# CLAUDE.md

Guidance for AI agents working in this repository.

## Read these first

- [docs/AGENT_GUIDELINES.md](docs/AGENT_GUIDELINES.md) — the project's static agent harness:
  operating principles, product priorities, safety rules. It takes precedence over this file.
- [HighLevelDesign.md](HighLevelDesign.md) — architecture, the two backend runtime
  modes (NINA/WPF and PINS/headless), transports, and test-fixture boundary.
- [CONTRIBUTING.md](CONTRIBUTING.md) — contribution rules, i18n requirements.
- [src/plugins/plugins.md](src/plugins/plugins.md) — plugin authoring.

This file collects hard-won, non-obvious facts that are easy to get wrong and are not
derivable from reading the code quickly. Keep it high-signal; verify before relying on it.

## Verification

```bash
npm run lint
npm run format:check
npm run build
npm run i18n:check
npm run test:run
```

`npm run ci:verify` chains all of them plus `typecheck`. Two known baselines, both unrelated
to any current change — state them rather than "fixing" them silently:

- `i18n:check` fails on a pre-existing `ca.json` placeholder mismatch
  (`plugins.pinsAllSky.messages.deletedSessions` is missing `{suffix}`).
- `typecheck` can OOM, and `test:run` needs Node ≥ 22.15 (`registerHooks`).

## Polling is mandatory

NINA's `/v2/socket` WebSocket does **not** deliver every equipment/state change. The 2s HTTP
polling (`fetchAllInfos` in `src/store/store.js`) must not be replaced by WebSocket events.
Battery/performance work has to keep the polling and optimize elsewhere: adaptive intervals,
dropping unchanged payloads before store writes, batched backend endpoints.

## Profile settings: the traps

Everything is written with `apiService.profileChangeValue('<Section>-<Key>', value)`.

- Camera **chip size in pixels** lives under `FramingAssistantSettings-CameraWidth` /
  `-CameraHeight`, **not** under `CameraSettings`.
- Camera **pixel size** (`CameraSettings-PixelSize`) is never reported at runtime. NINA's
  `store.cameraInfo` carries `XSize`/`YSize` but no pixel size — it is always a manual entry.
- `XSize`/`YSize` ≤ 0 means the driver reports no sensor size. That is the de-facto **DSLR
  detection** (see `src/components/camera/CenterHere.vue`).
- **Two different slew rates.** `TelescopeSettings-IndiMaxSlewRateDps` is the profile-side
  driver limit. The manual jog rate in `src/components/mount/setSlewRatePins.vue` comes from
  `GET indi/mount/slew-rates` (driver capabilities) and is deliberately decoupled from it.
- Several settings components seed from the profile in `onMounted` only and then keep showing
  their defaults when the 2s poll delivers late (`settingsSensor.vue`, `settingsMount.vue`,
  `settingsTelescope.vue`). In new components watch `store.profileInfo` instead, and guard
  user edits with a "touched" flag.

## Equipment: device mapping

Every device follows the same three-step driver change (implemented generically in
`src/components/setupWizard/IndiDriverSelect.vue`):

```
profileChangeValue('<X>Settings-IndiDriver', name)
  → apiService.<x>Action('list-devices')
  → equipmentStore.triggerRescan('<key>')
  → store.fetchProfilInfos()
```

| Profile section         | API action         | Rescan key   |
| ----------------------- | ------------------ | ------------ |
| `CameraSettings`        | `cameraAction`     | `camera`     |
| `TelescopeSettings`     | `mountAction`      | `mount`      |
| `FocuserSettings`       | `focusAction`      | `focus`      |
| `FilterWheelSettings`   | `filterAction`     | `filter`     |
| `RotatorSettings`       | `rotatorAction`    | `rotator`    |
| `SwitchSettings`        | `switchAction`     | `switch`     |
| `WeatherDataSettings`   | `weatherAction`    | `weather`    |
| `FlatDeviceSettings`    | `flatdeviceAction` | `flatdevice` |
| `DomeSettings`          | `domeAction`       | `dome`       |
| `SafetyMonitorSettings` | `safetyAction`     | `safety`     |
| `GuiderSettings`        | `guiderAction`     | `guider`     |

INDI device types for `getINDIDeviceList()` are named differently from the profile sections:
`camera, focuser, filterwheel, rotator, telescope, weather, switches, flatpanel, dome,
safetymonitor`.

Connection ordering constraints (from `connectEquipment.vue:connectAll()`): switch first with a
5s wait, mount before guider. PHD2 in PINS mode additionally requires a connected mount **and**
`guiderStore.guidecamOk`.

Device quirks: filter wheel slot count (`SettingsFilterWheelSlotNum.vue`), Switch SV241 Pro
(`SettingsSwitchSV241Pro.vue`), weather API keys (`SettingsWeather.vue`), focuser rename
`indi_myfocuserpro2_focus` → "Gemini / MyFocuserPro2" and the filtering of `indi_gemini_focus`.

Cameras have **no** `SettingsSerialConnection` fallback — only `SettingsAlpacaDirect` when
`Category === 'ASCOM Alpaca'`, otherwise the `components.alpacaDirect.cameraNoSettings` note.

## Setup wizard

`src/components/setupWizard/` contains the cancellable first-run and equipment wizard.
It opens before setup is complete and is ordered ahead of the tutorial and What's New.
The common flow covers Welcome → Language → Information → Instance (native only) →
Mount → Location → Telescope → Camera → Focuser → Filter wheel → Done. PINS adds
System Localization, Wi-Fi, Updates, INDI slew speed and Guiding. Localization is
deliberately before Wi-Fi so the regulatory country, timezone, locale and remote
keyboard layout are correct before networking is configured. It is restartable
from settings and the PINS page.

- **Extension point:** add one entry to the computed `steps` list in `SetupWizard.vue` plus
  one `v-else-if` branch. Nothing else in the wizard shell is step-count aware. Step IDs,
  rather than indexes, are persisted because PINS-only steps can appear after connection.
- **Telescope sits before camera on purpose** — the camera step's image-scale readout needs
  `TelescopeSettings.FocalLength`.
- **The camera reverses the order** of every other device step: native device list first, INDI
  driver only as a collapsible fallback, because many cameras are natively supported without
  INDI. All other devices pick the INDI driver first.
- 3rd-party INDI driver installs accept the types in `ALLOWED_INDI_DRIVER_TYPES`
  (`indiInstallUtils.js`). That list must stay in sync with `TYPE_OPTIONS` in
  `PinsIndiRegistryEditModal.vue` — the registry an installed driver is written into.
  `dome` and `safetymonitor` are not covered by either.
- **z-index:** the wizard overlay is `z-70`, the PINS upgrade overlay `z-[80]`. Modals opened
  from inside the wizard teleport to `body` and must be raised to `z-[75]`, otherwise they open
  invisibly behind it. `LocationSyncModal` sits at `z-[76]` because it blocks the mount connect.
- The wizard hides itself while `pinsStore.shouldShowUpgradeOverlay` is true and persists
  `settingsStore.setupWizard.currentStepId` — a PINS upgrade restarts services and can
  temporarily interrupt the app connection.

## Location handling

The refs in `src/utils/location.js` are **module singletons**, shared with `SetupPage` step 5
and `LocationSettingsPins.vue`. Always call `loadFromAstrometrySettings()` when entering a
location UI instead of trusting what is left in them.

`getCurrentLocation()` writes **strings** (`toFixed`) — use text inputs, not `NumberInputPicker`;
`saveCoordinates()` sanitizes them including a decimal comma. With sync direction `TOTELESCOPE`,
`saveCoordinates()` disconnects and reconnects the mount and takes PHD2 with it: several
seconds, so a loading flag is mandatory.

## Android networking: two confirmed non-bugs

Do not chase these as app-logic bugs.

- **~2 min WebView stall after Wi-Fi cut + return when mobile data is on.** Chromium attaches
  new requests to TCP connect jobs created over the dead path; they only die at the Linux
  connect timeout (~127s). With mobile data off the app reconnects within seconds. Relevant in
  the field: users join a PINS AP without internet while mobile data is on.
- **~3 min of retries after screen lock** before Android Doze kills in-flight requests. On real
  resume everything reconnects within ~2s. The `resumePending` flag in `App.vue:performResume()`
  fixes the older bug where a real resume trigger was swallowed by the re-entrancy guard — if a
  "doesn't reconnect after unlock" report comes in, check for
  `App resume already in progress, skipping duplicate trigger` with no follow-up first.

## UI conventions

Use the `tns-*` utilities from `src/assets/tailwind.css` (`tns-card`, `tns-btn-primary`,
`tns-btn-secondary`, `tns-input`, `tns-select`, `min-h-touch`), not the legacy raw
gray/cyan palette still present in older screens.

Drag & drop: every `<draggable>` needs `:fallbackOnBody="true"`. `backdrop-filter` on a parent
creates a containing block for `position: fixed`, which misplaces Sortable.js's ghost on Android
Chrome. Do **not** use `forceFallback: true`.

i18n: add new keys to `src/locales/en.json` first, then mirror them into the other 13 locales.
Every user-facing string needs an entry; `i18n:check` gates it.

Targets are Android, iOS and the browser — keep all three working.
