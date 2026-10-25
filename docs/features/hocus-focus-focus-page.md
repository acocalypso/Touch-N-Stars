# Hocus Focus on the focus page

Status: implemented, pending review
Date: 2026-10-25

## Goal

Users configure and analyse autofocus in one place. Hocus Focus (HF) stops being a separate
PINS plugin; its inspector, tilter and option pages become parts of the focus page, next to the
NINA focuser settings they depend on. Nothing HF could do before is lost. This is the
structural half; the simplification on top is
[hocus-focus-simple-setup.md](hocus-focus-simple-setup.md). Both ship in one PR.

## Scope

- Runtime modes: PINS. The HF areas need PINS **and** a responding `GET hocusfocus/status`.
  The PINS gate is kept from the old plugin (`isPins: true`): the views read Hocus Focus v4
  internals a stock NINA's Hocus Focus may not have.
- Surface: focus page (`src/views/FocusPage.vue`); the `hocusfocus` plugin is removed.
- Backends touched: none (existing plugin-server `/api/hocusfocus/*` routes only).

## Non-goals

- No backend change; the apiService surface snapshot stays identical.
- Without HF (NINA, or PINS without the routes), the focus page behaves exactly as today.
- No HF or NINA setting changes its value as a side effect of the move.

## Acceptance criteria

1. Given PINS and a responding `hocusfocus/status`, the focus page shows the tabs Focuser,
   Settings, Aberration Inspector and Tilter; otherwise only Focuser and Settings appear, as
   today.
2. HF no longer appears in the plugin list or under Settings → Plugins. A navbar entry of the
   old plugin disappears after the update without an error or a dead link.
3. Everything the old plugin tabs offered works as before: inspector run / stop / rerun from a
   saved AF run / clear, inspector options, HF autofocus options, star detection including the
   optimizer, tilter.
4. Aberration Inspector and Tilter mount only while their tab is active; the Focuser tab starts
   no additional poller.
5. Moved strings keep their wording in all 14 locales; `npm run i18n:check` reports nothing
   missing for them.
6. At 390 px width the four-entry SubNav scrolls inside itself, the page does not scroll
   horizontally; on desktop Aberration Inspector and Tilter use the wide layout the plugin had.
7. The finished-AF chart loads the HF last run based on HF availability
   (`hocusFocusStore.available`), not on `isPINS` alone.

## Dimensions considered

| Dimension        | Applies | Note                                                                                                             |
| ---------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| Runtime modes    | yes     | PINS + status route (criterion 1, 7); re-probed on every reconnect via `connectionEpoch`                         |
| Polling          | yes     | The inspector's 1 s status polling only runs while its tab is mounted (criterion 4)                              |
| Mobile           | yes     | SubNav width, wide tabs (criterion 6)                                                                            |
| i18n             | yes     | Key path move `plugins.hocusfocus.*` → `components.focuser.hocus.*` in all 14 locales, values verified unchanged |
| Equipment safety | no      | No new hardware commands; existing inspector/tilter actions keep their explicit buttons                          |
| Error paths      | yes     | HF unreachable → tabs hidden; an open HF tab falls back to Focuser (criterion 1)                                 |
| Native           | no      | No Capacitor-specific behaviour involved                                                                         |
| Persistence      | yes     | No migration needed: the plugin store rebuilds its list from the registry and does not persist navigation items  |
| Tests            | yes     | Covered by the existing suite; the move itself has no new logic                                                  |

## Open questions

- Restyling the moved HF components to the `tns-*` utilities is not part of this change; they
  keep the older gray/cyan look. (user)
