# Celestia Atlas migration

## 1. Baseline repository revisions

- Touch-N-Stars: branch `celestial-atlas`, revision `9bf475e3b5f1fb993dcfe7c5a172989a6a56f7e4`.
- Celestia Atlas: branch `main`, revision `813aa1bcdaa3d4be0988817bc145786e30c79c0b`.
- Requested host branch is `develop`; the existing working branch was preserved per the no-switch rule.

## 2. Current working-tree state

Both repositories were clean before implementation. No reset, clean, branch switch, commit, or push was performed.

## 3. Stellarium dependency inventory

- Runtime view: `src/views/StellariumView.vue`.
- Host state and integration: `src/store/stellariumStore.js`, `src/store/store.js`, `src/store/framingStore.js`, and `src/App.vue`.
- Tests: `src/store/__tests__/stellariumStore.test.js`.
- Runtime/build assets: `public/stellarium-js`, `public/stellarium-data`, and `src/assets/js/stellarium-web-engine.wasm`.
- Build workaround: `EXCLUDE_STELLARIUM_DATA` and the Vite removal plugin.
- Settings/localization/documentation contain Stellarium-specific names, landscapes, refresh behavior, and attribution.
- A legacy viewer is kept mounted outside the splash-gated routed subtree and hidden with `v-show` to preserve expensive engine state.

## 4. Existing Stellarium behavior contract

Mandatory behavior includes observer and NINA UTC synchronization, target selection into framing, mount position/follow, camera FOV and rotation, offline search, custom landscapes/horizon, display toggles, hidden rendering pause, resize/orientation handling, touch cancellation, and native foreground restoration. Detailed call tracing remains in progress.

Verified flow details:

- The view is mounted outside the routed/splash subtree and hidden with `v-show` because the Stellarium rAF loop cannot be destroyed safely.
- Observer latitude/longitude arrive from NINA `AstrometrySettings` in degrees; Stellarium receives radians. Longitude is passed through unchanged and is therefore treated as east-positive by the existing integration.
- `timeSync.ensureSync()` supplies a UTC `Date`; the host converts it to MJD and sets `observer.utc`, then lets engine time advance at speed 1.
- Host targets enter as decimal-degree RA/Dec, are explicitly interpreted as `ICRF`, converted to `CIRS`, and passed to `pointAndLock`.
- Selection reads `getInfo('RADEC')`, but does not explicitly convert the returned frame before writing degrees into framing state. Existing comments conflict over whether that value is ICRF or CIRS. This path is unsafe to reproduce without independent proof.
- Camera rotation follows NINA plate-solve position angle: zero toward celestial north, increasing eastward/clockwise as viewed on the sky.

## 5. Celestia Atlas architecture inventory

Revision `813aa1b` is a standalone global-script application. `app-v8.js` owns fixed DOM IDs, application-global listeners, URL hash state, service-worker registration, catalogue globals, and an unconditional animation loop. `app.js` duplicates the engine. There was no package manifest or public lifecycle API. The committed DSO catalogue is explicitly a small fallback; the full OpenNGC data is generated only in CI. The repository has third-party notices but no source-code `LICENSE`.

Phase 1 adds a framework-neutral ESM boundary with explicit container ownership, validation, pause/resume/resize/destroy, observer/time/view setters, search and selection callbacks, mount/FOV/horizon inputs, and cancellable pointer interaction. It is event-driven and performs no continuous hidden rendering. It is not yet the single renderer source of truth; the standalone shell still uses the legacy global engine.

## 6. Context7 findings

See [celestia-atlas-context7-log.md](./celestia-atlas-context7-log.md).

## 7. Coordinate-system contract

- Public RA is decimal degrees normalized to `[0, 360)`.
- Declination is decimal degrees in `[-90, 90]`.
- Every command-producing coordinate is tagged `ICRS` or `J2000`; untagged values are rejected.
- Observer longitude is east-positive and normalized to `[-180, 180)`; elevation is metres.
- Time is an explicit UTC Unix timestamp in milliseconds.
- Catalogue legacy RA remains hours internally until converted at the adapter boundary.
- Advanced API mount data includes `Coordinates.RADegrees`, `Coordinates.Dec`, and `Coordinates.Epoch`. The adapter accepts `J2000` directly, prefers the degree fields, and rejects JNOW/B1950/J2050 pending explicit precession. Framing and slew endpoints construct NINA `Epoch.J2000` coordinates.
- Atlas selections preserve their frame tag when converted to framing state. Existing downstream APIs do not accept a frame tag, so command enablement remains blocked until NINA frame provenance is established.
- Precession, nutation, refraction, host coordinate-frame provenance, and rotation convention remain mandatory unresolved validation items.

## 8. Implementation phases

- Phase 0: complete enough to begin isolated engine work; baseline lint timed out.
- Phase 1: public API, lifecycle, pointer cancellation and initial overlays implemented; standalone renderer extraction remains open.
- Phase 2: the lazy Vue integration connects observer, synchronized UTC, FOV, visibility and deterministic teardown.
- Phase 7 (partial): Celestia Atlas is now the default viewer in normal builds. The legacy viewer remains available for one rollback interval only when `VITE_STELLARIUM_ROLLBACK=true` is explicitly set.
- Phase 7 (partial): the existing display and landscape settings modal is exposed on the Atlas screen in renderer-managed mode. Host settings flow through the Atlas public API watchers without legacy store mutation or viewer remount events.
- Phase 4 (partial): offline search, focus, canvas hit selection, selected-object details, safe framing handoff, J2000 mount marker, grid/display settings, and mock mount epoch are connected.
- Phase 4 (partial): manual mount centering and view-local auto-follow are connected through public viewer methods. FOV overlay renders framing-store mosaic columns, rows, rotation and overlap without exposing renderer state to Vue.
- Phase 6 (partial): app-wide native background state pauses the viewer and its clock display; view state is session-persisted with throttled writes; UTC progression can be paused/resumed through the engine clock API. App-owned Capacitor listener cleanup now removes only its own handle.
- Phase 6 (partial): localized date, local-time, server-now, pause and time-rate controls are connected. The standalone compatibility `app.js` is now a loader for `app-v8.js`, removing the duplicated legacy standalone implementation.
- Phase 5 (partial): spherical gnomonic projection replaces flat RA/Dec mapping; 130 bright stars and 27 constellation line sets are generated reproducibly, packaged offline, searchable, and controlled by host display settings.
- Phase 5 (partial): custom horizon points are interpolated by the host and projected by the engine from geographic north/east azimuth into the live observer sky. Engine UTC advances while active and horizon projection refreshes once per minute without a continuous render loop.
- Phase 5 (partial): the Sun, Moon, eight planets and Pluto now use live, offline Astronomy Engine ephemerides. They render, label, search, select and hand off topocentric J2000 coordinates at the viewer's observer and UTC.
- Phase 5 (partial): 1,214 pinned IAU Minor Planet Center comet records now render and search offline using universal-variable propagation, light-time correction and observer parallax. Embedded and standalone Atlas consumers load the same engine modules.
- Phase 5 (partial): the embedded viewer now honors the existing azimuth-grid, equatorial-grid, local-meridian, ecliptic and atmosphere settings and includes an offline Galactic-plane Milky Way layer.
- Phase 5 (partial): Io, Europa, Ganymede and Callisto now use live offline ephemerides and support rendering, search, selection and narrow-field centering.
- Phase 5 (partial): existing default, neutral and custom order-0 HiPS/HEALPix landscapes now load through the Atlas API and render in the live observed frame; browser and native visual validation remains open.
- Phase 4 (partial): the existing FOV rotation and view-center action panel now reads the active Atlas center through the typed public API, so rotation, slew/center, sequence-target and favorite-target workflows no longer depend on Stellarium internals. Its sampling loop stops while the sky view is hidden.
- Phase 5: the standalone shell now instantiates the same public viewer as Touch-N-Stars. Planets, Galilean moons, comets, OpenNGC search/selection, reference layers, offline HEALPix landscape, time/location, lifecycle, camera FOV and mosaic overlays share the embedded renderer.
- Phase 3: host conversion boundary and safety tests implemented. A topocentric Mars position matches an independent JPL Horizons ICRF/J2000 fixture within one arcminute; broader golden-reference coverage remains open.
- Phases 2 and 4-9: not started.

### 2026-07-12 controls, horizon, optics, and landscape slice

- The standalone sky-control panel now starts closed, including matching `aria-hidden` and `aria-expanded` state. The controls and time buttons open the same panel and keep their visual and accessibility state synchronized. The Touch-N-Stars settings modal already started closed and retains that behavior.
- `hideBelowHorizon` is a separate display option from landscape visibility and defaults to enabled in the public viewer. Standalone persists it under `celestia-atlas.hide-below-horizon`; Touch-N-Stars persists `stellarium.hideBelowHorizon` in the existing settings store and exposes the switch only for the renderer-managed Atlas path. An absent setting is interpreted as enabled so existing installations receive the new default.
- The horizon mask uses the interpolated custom site-horizon altitude at each azimuth when one is available and otherwise uses the geometric 0-degree horizon. It suppresses below-horizon Milky Way pixels, celestial reference curves, constellation segments, stars, deep-sky objects, Solar System objects, comets, mount markers, associated object labels, and hit targets. Landscape imagery, horizon/cardinal context, and the camera framing overlay remain independently controllable.
- The standalone framing inputs are now physical imaging-train values: sensor width and height in pixels, pixel size in micrometres, telescope focal length and optional aperture in millimetres, plus rotation and mosaic settings. The derived readout reports sensor size, angular width/height, pixel scale, and focal ratio. Aperture affects focal ratio but does not affect angular FOV. Overlay dimensions use the same gnomonic tangent projection as the sky canvas rather than a linear degrees-to-pixels approximation.
- Touch-N-Stars continues to derive the camera frame from the active NINA profile: `CameraSettings.PixelSize`, `FramingAssistantSettings.CameraWidth`/`CameraHeight`, and `TelescopeSettings.FocalLength`. Rotation and mosaic values remain host-owned framing settings. Invalid or incomplete profile geometry removes the overlay instead of rendering an invented frame.
- Landscape sampling now follows Stellarium's nested HEALPix axis-swap convention while preserving the existing observed-frame azimuth reflection. Continuous source coordinates and premultiplied-alpha bilinear interpolation remove the 0/360-degree and face-boundary discontinuities without dark fringes around transparent terrain edges.
- Landscape and Milky Way rasters are DPR-aware and bounded: interaction uses a 384-pixel-wide budget, the settled redraw uses up to 1024 pixels, and wheel input schedules a full-quality refinement after interaction becomes idle. This retains responsive navigation without leaving the landscape in the former low-resolution state.

## 9. Feature-parity matrix

| Capability               | Existing                                        | New engine                                                                                                   | Status                                                               |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Explicit lifecycle       | Hidden render suppression plus host workarounds | `pause`, `resume`, `resize`, idempotent `destroy`                                                            | Default web path; native test pending                                |
| Observer and UTC         | Supported                                       | Validated setters and synchronized host time                                                                 | Connected; fixtures expanding                                        |
| Offline catalogue search | Stellarium packaged data                        | Pinned 12,578-object OpenNGC catalogue and moving objects                                                    | Connected; perf test pending                                         |
| Framing selection        | Supported                                       | Typed selection callback and framing handoff                                                                 | Connected; command gate open                                         |
| Mount/FOV/rotation       | Supported                                       | Profile-derived physical camera geometry, exact projected frame, marker/follow, mosaic and rotation controls | Connected; native test pending                                       |
| Horizon/landscape        | Supported                                       | Default-on persisted horizon mask; seam-correct, bilinear and DPR-aware order-0 HiPS/HEALPix imagery         | Standalone and host production browsers passed; native tests pending |
| Standalone controls      | Open control panel                              | Control panel starts closed with synchronized accessibility state                                            | Connected                                                            |
| Mobile lifecycle         | Host workarounds                                | App background state pauses viewer and clock display                                                         | Connected; native test pending                                       |

## 10. Test results

- Host `npm run test:run`: 39 passed, 0 failed.
- Default-view promotion adds a regression test proving Atlas is the normal import and Stellarium requires the explicit rollback flag.
- Default-view promotion validation: 47 host tests passed; targeted ESLint passed; normal and `VITE_STELLARIUM_ROLLBACK=true` production builds passed. A production browser load requested the `CelestiaAtlasView` JS/CSS chunks and no `StellariumView` chunk. Console errors were limited to expected missing NINA API responses from the static-only test server; no viewer or Vue runtime errors occurred.
- Atlas settings parity validation: 48 host tests passed; targeted ESLint and the production build passed. On a 390×844 browser viewport the settings modal opened, the azimuth-grid toggle updated host settings, and the original Atlas canvas remained mounted. Console errors were limited to expected missing NINA API and landscape-list responses from the static-only server.
- Host `npm run lint`: timed out after 60 seconds; no pass claimed.
- Candidate JavaScript syntax checks: passed before Phase 1 changes.
- Host after coordinate contract: 44 passed, 0 failed; targeted ESLint passed.
- Host after search/selection/mount integration: 46 passed, 0 failed; targeted ESLint, typecheck and flagged production build passed.
- Candidate Phase 1 unit tests: 3 passed, 0 failed; syntax and diff checks passed.
- Host `npm run typecheck`: passed in 97.6 seconds.
- Flagged POC `npm run build:app`: passed. Viewer chunk is 9.21 kB (3.73 kB gzip); the lazy full OpenNGC chunk is 5,452.22 kB (915.53 kB gzip). Vite reports the expected large-chunk warning for the catalogue.
- Pinned OpenNGC `v20260501` generation produced 12,578 records. After fixing nondeterministic metadata, two offline rebuilds produced identical SHA-256 hashes.
- Candidate solar-system suite: 11 tests passed, including time motion, observer parallax and the JPL Horizons Mars tolerance fixture.
- Candidate moving-object suite: 17 tests passed. A 12P/Pons-Brooks topocentric position matches JPL Horizons within one arcminute; two catalogue rebuilds produced the same SHA-256.
- Landscape integration slice: candidate suite 22 passed; host suite 46 passed; targeted ESLint, 6 GB typecheck and flagged production build passed.
- Shared FOV-control slice: candidate suite 22 passed; host suite 46 passed; targeted ESLint, 6 GB typecheck and flagged production build passed.
- Shared standalone-renderer slice: candidate suite 24 passed; all standalone DOM IDs, service-worker paths, local catalogue and landscape resources validated.
- Controls/horizon/optics/landscape slice: Atlas `npm test` passed 34 tests with 0 failures; Touch-N-Stars `npm run test:run` passed 48 tests with 0 failures. Touch-N-Stars `npm run typecheck` and `npm run build:app` also passed.
- New Atlas coverage verifies custom-horizon interpolation across 359/0 degrees, default-closed standalone controls, default-on hide-below-horizon wiring, physical camera geometry and validation, aperture/FOV independence, exact gnomonic frame sizing, DPR-aware landscape quality budgets, HEALPix axis mapping, and transparent RGBA rasterization. Host coverage verifies the persisted default and renderer-managed Atlas settings pass-through.
- Landscape seam diagnostics using the bundled Guereins data reduced the RGBA L1 discontinuity from 126 to 5 across azimuth 0 degrees at altitude -50 degrees, and from 214 to 20 across the tested face boundary at altitude -60 degrees/azimuth 180 degrees.
- Standalone Chrome DevTools validation used an isolated 1190x905, DPR 1 context. With fresh storage, the control panel was closed and `aria-hidden`, both launch controls reported `aria-expanded=false`, and the hide-below-horizon switch was checked without a stored preference. Switching it off and reloading restored the persisted false value while the controls remained closed; the preference was then restored to true.
- The standalone physical-input readout reported `23.49 × 15.70 mm sensor`, `FoV 2.692° × 1.799°`, `1.55″/px`, and `f/5.0` for the test train. North/south landscape sweeps showed no central wrap seam, and wheel instrumentation recorded a 384-pixel interaction raster followed by the 1024-pixel idle refinement. All 32 page requests returned HTTP 200, with no browser console errors, warnings, or reported issues.
- The Touch-N-Stars production bundle loaded the Atlas JS/CSS chunks, Milky Way image, landscape properties and all twelve Guereins faces with HTTP 200 in Chrome. The renderer-managed settings panel showed the localized default-on horizon switch; switching it off and on updated both its pressed state and the persisted host store. A mocked active NINA profile (6248 × 4176 pixels, 3.76 µm, 500 mm focal length, 100 mm aperture) produced the expected centered 28 × 18-pixel framing rectangle at the tested 70-degree viewer scale. No Celestia Atlas, Vue, `TypeError`, `ReferenceError`, or unhandled runtime errors appeared; remaining console traffic came from the intentionally absent NINA backend on the static preview server.

## 11. Remaining blockers

- Licensing resolved by owner authorization on 2026-07-10: Celestia Atlas uses GNU GPL v3 or later, matching Touch-N-Stars. OpenNGC remains CC BY-SA 4.0 under the third-party notices.
- The complete pinned offline catalogue is packaged and loaded lazily; browser and native search/render performance validation remains open.
- Host coordinate provenance must be proven before any viewer selection can feed commands.
- Android and iOS runtime validation require suitable platform environments.
- Existing listed and custom landscapes now use seam-correct spherical order-0 HEALPix projection. The standalone and Touch-N-Stars production browsers passed orientation, seam, settled-resolution, request, and Atlas console checks; Android and iOS validation remain release gates.
- Mandatory parity phases remain.
- Package boundary resolved: Touch-N-Stars uses the public Git repository pinned to immutable commit `8429e384e2008ff233d44206aee80b7d15b0c22c` over HTTPS. Embedded and standalone Atlas shells now share the same viewer and astronomy engine modules.

## 12. Removal checklist

- [ ] All mandatory parity gates pass.
- [ ] Astronomy reference fixtures and tolerances pass.
- [ ] Full offline catalogue and notices are packaged.
- [ ] Web and required native lifecycle tests pass.
- [x] Celestia is default with a tested rollback interval.
- [ ] Stellarium runtime, WASM, data, globals, stores, workarounds, and build logic are removed.
- [ ] Final search classifies every historical reference.
