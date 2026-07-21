# Celestia Atlas integration guide

This document is the current engineering contract for Celestia Atlas inside
Touch'N'Stars. The longer [migration log](celestia-atlas-migration.md) preserves
implementation history and evidence; it should not be used as the setup guide.

## Ownership and dependency

Touch'N'Stars owns the Vue UI, persistence, N.I.N.A. adapters, native lifecycle,
and packaged survey routing. The `@acocalypso/celestia-atlas` package owns sky
rendering, interaction, catalogue search, projections, ephemerides, and its
framework-neutral viewer API.

The dependency in `package.json` is pinned to an immutable Git commit. To update
it:

1. Commit, test, and push Celestia Atlas first.
2. Replace the commit after `#` in `package.json`.
3. Run `npm install` once to update `package-lock.json`.
4. Review that both lockfile entries resolve to the same commit.
5. Run `npm ci` and the validation matrix below.

Do not import Atlas internals. All host imports must come from its public package
entry point, and a public API change must update the engine declarations and
documentation before the host pin moves.

## Runtime boundary

`src/views/CelestiaAtlasView.vue` creates the viewer only after first use. The
warm instance remains mounted, is paused while hidden or while the native app is
backgrounded, and is resized/resumed when visible. Permanent unmount destroys
the viewer and its listeners.

Host-specific adapters live in `src/integrations/celestiaAtlas/`; renderer UI
lives in `src/components/celestiaAtlas/`. Keep coordinate conversion, catalogue
assembly, survey URL resolution, and selection normalization out of the view
when they can be pure and tested.

The host supplies:

- observer location and synchronized N.I.N.A. UTC;
- mount position, locate/follow state, and connection freshness;
- camera sensor geometry, telescope focal length, aperture, rotation, and
  mosaic settings;
- landscape, horizon, display, magnitude, type, and catalogue filters;
- selected-target actions and Framing Assistant cache previews.

## Coordinate and command contract

- Public RA/Dec is decimal degrees tagged `ICRS` or `J2000`.
- RA is normalized to `[0, 360)` and declination is within `[-90, 90]`.
- Observer longitude is positive east; elevation is metres.
- Time is UTC Unix milliseconds.
- Azimuth is measured north through east and Atlas altitude is geometric.
- N.I.N.A. command coordinates are J2000. ICRS selections are converted once at
  the integration boundary; JNOW mount samples are precessed before display.
- Untagged, unsupported-epoch, or non-finite values must clear stale command
  data and disable slew, centre, rotate, sequence, and favourite actions.

Never infer a coordinate frame from a field name. Extend
`src/integrations/celestiaAtlas/contracts.js` and its reference-vector tests for
any new coordinate source.

## Offline data and native delivery

Web and N.I.N.A.-served builds resolve landscapes and the DSS HiPS survey under
`/celestia-atlas-data`. The photographic survey is limited to packaged orders 3
and 4 plus its Allsky preview and has no public online fallback. Catalogue
search, ephemerides, the Milky Way panorama, and engine calculations are also
local.

Android and iOS builds deliberately exclude `celestia-atlas-data`; they obtain
that tree from the selected Touch'N'Stars N.I.N.A. plugin server. The data-base
URL is resolved in `offlineSkySurvey.js` and the view, not hard-coded in the
renderer. Keep these invariants together:

- `EXCLUDE_CELESTIA_ATLAS_DATA=true` for native builds;
- `verify:native-atlas`/`verify:native-platforms` must pass;
- no remote survey fallback may be introduced;
- survey and catalogue attribution stays available in the About UI and notices.

## UI and mobile contract

- Atlas overlays must stay below the application header and above the status
  bar/navigation area in both orientations.
- Primary touch controls are at least 48 by 48 CSS pixels.
- Search, mount locate/follow, time, play/pause, settings, About, share, and
  fullscreen controls must remain reachable at narrow widths.
- Pause and resume must not recreate the viewer, reload settled survey tiles, or
  lose the view.
- Pointer cancellation, pinch zoom, orientation resize, and app background/
  foreground transitions require explicit regression checks.

## Validation matrix

Run for every integration update:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:run
npm run format:check
npm run build
```

The typecheck may require `NODE_OPTIONS=--max-old-space-size=6144` (PowerShell:
`$env:NODE_OPTIONS='--max-old-space-size=6144'`) to avoid Node's default heap
limit on the complete application graph.

Run `npm run testbuild` for the Windows/N.I.N.A. deployment path. While the
N.I.N.A. plugin server is running, test at `http://localhost:5000` with browser
console and network panels open. Missing live PINS endpoints are expected without N.I.N.A.;
Atlas/Vue exceptions, unhandled promises, repeated tile requests, and missing
packaged assets are not.

For native-affecting work:

```bash
npm run build:native
npm run sync:native
```

Then verify Android and iOS with the selected N.I.N.A. instance reachable:

- first open, hide/show, background/foreground, rotate, and return navigation;
- drag follows the horizon, pinch zoom works, and polar DSO extents stay fixed;
- search and select OpenNGC, Abell/ACO, LDN/LBN, stars, and moving objects;
- mount marker, locate/follow, camera/mosaic FOV, and target command actions;
- packaged survey stability while dragging and after settling, offline from the
  public internet;
- horizon/cardinals, landscape seam, Milky Way orientation, settings, and About;
- safe-area placement at small portrait and landscape viewports.

## Troubleshooting

- **Blank survey:** verify the selected N.I.N.A. base URL, then request
  `/celestia-atlas-data/surveys/dss/properties` from the same device.
- **Tiles flicker or refetch:** inspect request URLs and response cache headers;
  confirm viewer lifecycle is pausing/resuming rather than remounting.
- **Mount absent:** inspect epoch and finite RA/Dec validation before changing
  renderer code.
- **Search result absent:** search ignores display filters; verify that the lazy
  catalogue layer loaded and its identifier normalization test exists.
- **Native bundle too large:** run `npm run verify:native-platforms` and confirm
  no `celestia-atlas-data` directory entered either platform asset tree.
- **Slow lint:** use `npm run lint`; it is source-scoped and cached. Do not lint
  generated `dist`, native, deployment, or `.cache` trees.

## Licences and terminology

Celestia Atlas engine code is MIT licensed, while individual catalogue and image
sources retain their own terms. Keep the pinned engine notices and application
acknowledgements aligned whenever the dependency or data changes. “Stellarium”
may remain in historical migration notes or migrated preference keys, but must
not describe the active renderer or current UI.
