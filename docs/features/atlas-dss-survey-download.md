# Atlas: user-triggered DSS survey download

Status: implemented (2026-09-13; app branch rework-framing-skyatlas, plugin branch atlas-dss-survey-download)
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
(JPEG) and stored locally unchanged. `scripts/mirror-dss-survey.mjs` is the
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
8. **Format, attribution and terms.** The server stores the 512 px JPEG tiles unchanged
   (single survey format) and writes `properties` and `Allsky.jpg` itself; the download
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

## Decisions taken during implementation

- **Tile source.** STScI publishes an official mirror of the identical CDS HiPS
  (same `creator_did`, same release) at
  `https://stpubdata.s3.us-east-1.amazonaws.com/mast/skybackgrounds/DSSColor`. Measured
  on 2026-09-13 it answered in under a second per tile while the CDS master
  (`alasky.cds.unistra.fr`) took 20–100 s per tile for orders 5–7. The plugin server
  therefore tries the STScI mirror first and falls back to the CDS master per tile;
  `TNS_DSS_SURVEY_SOURCE_URL` (comma-separated) overrides the list. `properties` names
  the first source as `hips_master_url`.
- **Tile format: JPEG as delivered, no re-encoding.** The first implementation
  re-encoded every tile to WebP q90 (~half the bytes). Measured on the PINS x64 VM
  (order 6, 200 tiles, 2026-09-14): S3 headers ~205 ms, body ~28 ms, ImageSharp WebP
  encode ~1200–1600 ms per tile — the encoder was ~85 % of the wall time and the host CPU
  the bottleneck (3.7 tiles/s at 4 workers, ~17 min for the base orders, ~3.5 h for
  order 6). Storing the source JPEG unchanged makes the download network-bound; the only
  decode left on the server is the one-time order-3 Allsky assembly. The source is
  original quality, so the stored tiles are better than the re-encode was.
- **Concurrency:** 8 parallel tile downloads (network-bound now; ~3 MB/s at order 6).
- **Legacy WebP surveys.** A survey written by the WebP version is reported as
  `legacyFormat` in the status, counts as not installed (`properties` is removed, the Atlas
  shows no background), and the app shows an "outdated format, download again" hint in the
  settings and in the first-open banner. The next download deletes every `.webp` file
  before fetching; the two formats are never mixed.
- **Free-space margin:** estimate + 10 % (`FreeSpaceMargin`), checked on the server at
  start and mirrored in the app for the disabled-button reason.
- **Size table:** means of 60 random source tiles per order sampled from the STScI
  mirror on 2026-09-14: 42 / 55 / 75 / 93 / 97 kB for orders 3–7, i.e. base ≈ 200 MB,
  +order 5 ≈ 0.9 GB, +order 6 ≈ 4.6 GB, +order 7 ≈ 19 GB. About 2.7× the WebP sizes.
- **Storage location:** `NINA\TnsCache\celestia-atlas-data\surveys\dss` — the same `TnsCache`
  folder that already holds settings, favorites and PHD2 images. The `NINA\Touch-N-Stars`
  folder introduced by plugin 1.3.0.0 for landscapes is moved into `TnsCache` once on
  first access, so there is only one plugin folder in the NINA directory.
- **First-open offer** lives in the Atlas view (banner above the bottom controls), not
  in the setup wizard; declining sets `celestiaAtlas.dssSurveyOfferDismissed`.
- **Allsky:** built once from the order-3 tiles as `Allsky.jpg` (quality 85); the
  celestia-atlas engine requests `Norder3/Allsky.<format>`, so it follows the tile format.
- **Server API errors** for business rules (already running, not enough space) are
  returned as HTTP 200 with `success=false` because the app's axios interceptor drops
  the body of non-2xx responses.
- **Endpoints:** `GET /api/atlas/survey/status`, `POST /api/atlas/survey/download`
  (`{targetOrder}`), `POST /api/atlas/survey/cancel`, `POST /api/atlas/survey/delete`.
- `scripts/mirror-dss-survey.mjs` mentioned above never existed in this repository; the
  HiPS layout is implemented in `DssSurveyService` (server) and `offlineSkySurvey.js`.

## Open questions

- Region-based download around selected targets as a follow-up feature.
- Whether order 7 (~19 GB) should stay selectable on a Raspberry Pi SD card.
