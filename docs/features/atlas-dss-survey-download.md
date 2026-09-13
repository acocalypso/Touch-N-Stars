# Atlas: user-triggered DSS survey download

Status: proposed
Date: 2026-09-13

## Goal

The user downloads the DSS colour survey for the Atlas once, from the Atlas settings,
in a resolution of their choice (base orders 3–4, optionally up to order 5, 6 or 7).
Afterwards the Atlas shows a photographic background at framing quality everywhere,
completely offline, on NINA and PINS alike. The plugin server fetches the tiles on the
user's own host directly from the CDS master survey; the project itself no longer ships
or hosts any DSS data. This is the first step towards moving the Framing workflow into
the Atlas.

## Background

DSS plates are copyrighted (Caltech, AAO, ROE) and distributed by STScI "by agreement".
STScI's terms allow free non-commercial use with attribution but forbid bulk
redistribution without an agreement. The 79 MB of orders 3–4 currently packaged under
`public/celestia-atlas-data/surveys/dss` are a partial clone of the CDS HiPS
(`hips_status = public master clonableOnce`) and therefore leave the repository. Every
tile is fetched by the user's plugin server from `https://alasky.cds.unistra.fr/DSS/DSSColor`
(JPEG) and stored locally as 512 px WebP. `scripts/mirror-dss-survey.mjs` is the
reference for the HiPS layout (`12·4^order` tiles, `Dir<floor(npix/10000)·10000>`).

## Scope

- Runtime modes: both (same plugin server on Windows/NINA and PINS)
- Surface: Atlas settings dialog (`CelestiaAtlasSettings.vue`), plus a one-time offer
  when the Atlas is opened without an installed survey
- Backends touched: plugin server `/api` (new endpoints: status, start, cancel, delete)
  and its static route `/celestia-atlas-data/surveys/dss`
- Repository: removal of the packaged survey and of the tests/verification that assert it

## Non-goals

- The Framing view is unchanged: images there keep coming from `targetpic`
  (NINA framing cache / Hips2Fits).
- The Atlas never loads tiles online itself. Missing tiles fall back to the parent tile;
  no request from the app goes to CDS, Stellarium or any other survey host.
- No automatic download without a user action, not on server start and not on Atlas open.
- No region-based download around targets (possible later addition).
- Catalogues, landscapes, Milky Way panorama and star data are untouched; only the DSS
  layer changes.

## Acceptance criteria

1. **Status visible.** Given a reachable plugin server, when the user opens the Atlas
   settings, then they see the installed highest order (or "not installed"), the disk
   space used, a selection *Base (orders 3–4)* / *5* / *6* / *7* with a size estimate per
   step and the free disk space on the host. If the free space is below the estimate plus
   margin, the download button is disabled and the reason is shown next to it.
2. **First-open offer.** Given no installed survey, when the Atlas is opened for the first
   time, then the base download is offered once, can be declined, and the Atlas works
   without a photographic background in every other respect. The offer does not return
   until the user asks for it in the settings.
3. **Progress survives everything.** Given a started download, when the user closes the
   dialog, leaves the Atlas, backgrounds the app or loses the connection, then the job
   continues on the server and, after returning, the progress (tiles done/total, MB,
   current order) is shown correctly again via 2 s polling through `createPoller`.
4. **Cancel and resume.** Given a running job, when the user cancels or the host loses
   internet, then stored tiles are kept, the status reports *cancelled* / *failed* with
   the reason, and a later start downloads only the missing tiles.
5. **Atlas uses the installed order automatically.** Given a completely downloaded order N,
   when the Atlas is (re)opened, then the app reads `hips_order` from the served
   `properties` file (no hard-coded `maxOrder: 4` any more), requests tiles only under
   `/celestia-atlas-data/surveys/dss/…` from the plugin server (native) or same-origin
   (web), and the survey layer stays off while nothing is installed. An incomplete order
   is never advertised in `properties`; tiles missing from a partial download fall back
   to the parent tile without console errors.
6. **Delete.** Given an installed survey, when the user chooses *Delete*, then a
   confirmation is required, the files are removed, and the Atlas shows no photographic
   background again after the next survey refresh.
7. **Persistence and platform.** The survey lives in the persistent data directory next
   to the user landscapes, survives plugin updates and reinstalls, and uses the same path
   logic on Windows/NINA and PINS without branching on `isPINS`.
8. **Format, attribution and terms.** The server stores the CDS JPEG tiles as 512 px WebP
   (single survey format) and writes `properties` and `Allsky.webp` itself; the download
   dialog shows the usage notice (STScI/NASA and CDS credit, non-commercial use) and the
   About attribution stays in place.
9. **Older plugin.** Given a plugin server without the new endpoints, when the settings
   are opened, then a "please update the plugin" hint is shown instead of an error toast.

## Dimensions considered

| Dimension | Applies | Note |
| --- | --- | --- |
| Runtime modes | yes | One plugin-server implementation for both; endpoint presence is feature-detected (criterion 9), never `isPINS` |
| Polling | yes | Job status via `createPoller`, paused while backgrounded, resumed on app resume |
| Mobile | yes | Settings section at 400 px width, 48 px touch targets, progress readable in portrait |
| i18n | yes | New `en.json` keys during implementation; 13 locales in one batch before commit |
| Equipment safety | no | No hardware command involved |
| Error paths | yes | No internet on host, CDS unreachable mid-run, disk full, server restart mid-job (job state must be reconstructable from the files on disk), plugin restart while app is polling |
| Native | yes | Download runs on the host, never on the phone; tile base URL keeps using `resolveCelestiaAtlasDataBaseUrl`; native builds already exclude the data tree |
| Persistence | yes | All state on the server; after an instance switch the status is re-polled from the new host, nothing is cached in the app beyond the "offer shown" flag |
| Tests | yes | App: `properties`/`hips_order` parser, size estimate, survey source with dynamic `maxOrder`. Server: tile enumeration and `Dir` mapping, completeness check per order, resume logic (C# tests) |

## Repository clean-up (part of this feature)

- Remove `public/celestia-atlas-data/surveys/dss` (79 MB) from the repository.
- `offline-survey.test.js` asserts the route contract instead of packaged files.
- `verify-native-atlas-build.mjs` and `docs/celestia-atlas-integration.md` no longer
  describe a "packaged survey"; the data-tree invariants stay for landscapes.
- `scripts/mirror-dss-survey.mjs` stays as a developer tool (default base URL: CDS master).

## Open questions

- Concurrency towards CDS: proposal 4 parallel connections — it is a community server.
- Free-space margin on the Pi: proposal estimate + 10 %.
- Does the first-open offer belong in the Atlas view or in the setup wizard? (Product decision.)
- Region-based download around selected targets as a follow-up feature.
