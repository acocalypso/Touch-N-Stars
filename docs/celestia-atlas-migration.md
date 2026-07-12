# Celestia Atlas migration

## 1. Baseline repository revisions

- Touch-N-Stars: branch `celestial-atlas`, revision `9bf475e3b5f1fb993dcfe7c5a172989a6a56f7e4`.
- Celestia Atlas: branch `main`, revision `813aa1bcdaa3d4be0988817bc145786e30c79c0b`.
- Requested host branch is `develop`; the existing working branch was preserved per the no-switch rule.

## 2. Initial working-tree state

Both repositories were clean before implementation. The historical revisions
above describe the starting point; subsequent slices were committed and pushed
on the preserved branches.

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

Phase 1 added a framework-neutral ESM boundary with explicit container ownership, validation, pause/resume/resize/destroy, observer/time/view setters, search and selection callbacks, mount/FOV/horizon inputs, and cancellable pointer interaction. It is event-driven and performs no continuous hidden rendering. The standalone and embedded shells now instantiate this same public viewer.

## 6. Context7 findings

See [celestia-atlas-context7-log.md](./celestia-atlas-context7-log.md).

## 7. Coordinate-system contract

- Public RA is decimal degrees normalized to `[0, 360)`.
- Declination is decimal degrees in `[-90, 90]`.
- Every command-producing coordinate is tagged `ICRS` or `J2000`; untagged values are rejected.
- Observer longitude is east-positive and normalized to `[-180, 180)`; elevation is metres.
- Time is an explicit UTC Unix timestamp in milliseconds.
- The legacy standalone catalogue source retains hour-based RA. The compact
  `openngc-viewer-catalog.json` package export supplies tagged ICRS decimal
  degrees directly, so embedded clients perform no per-object conversion.
- Advanced API mount data includes `Coordinates.RADegrees`, `Coordinates.Dec`, and `Coordinates.Epoch`. The adapter accepts `J2000` directly, prefers the degree fields, and rejects JNOW/B1950/J2050 pending explicit precession. Source inspection of `pinsAPI/WebService/V2/Application/Framing.cs` and `Equipment/Mount.cs` proves that framing, slew, center, rotate and sync endpoints interpret decimal-degree inputs as NINA `Epoch.J2000` coordinates.
- Atlas J2000 selections pass through unchanged. ICRS selections are rotated to FK5 equinox and epoch J2000.0 with the transpose of the IAU SOFA `iauFk5hip` orientation matrix before entering framing state. The framing record is always tagged `J2000`, retains its source-frame provenance, and untagged inputs remain rejected. The SOFA `iauH2fk5` validation vector is covered by a host unit test. See the [official SOFA ANSI C release](https://www.iausofa.org/2023-10-11c).
- JNOW/B1950/J2050 precession, nutation, refraction, and native rotation-convention fixtures remain mandatory unresolved validation items. They cannot silently enter the command boundary.

## 8. Implementation phases

- Phase 0: complete enough to begin isolated engine work; baseline lint timed out.
- Phase 1: public API, lifecycle, pointer cancellation and initial overlays implemented; standalone renderer extraction is complete.
- Phase 2: the lazy Vue integration connects observer, synchronized UTC, FOV, visibility and deterministic teardown.
- Phase 7 (partial): Celestia Atlas is now the default viewer in normal builds. The legacy viewer remains available for one rollback interval only when `VITE_STELLARIUM_ROLLBACK=true` is explicitly set.
- Phase 7 (partial): the existing display and landscape settings modal is exposed on the Atlas screen in renderer-managed mode. Host settings flow through the Atlas public API watchers without legacy store mutation or viewer remount events.
- Phase 4 (partial): offline search, focus, canvas hit selection, selected-object details, proven ICRS/J2000-to-NINA-J2000 framing handoff, J2000 mount marker, grid/display settings, and mock mount epoch are connected.
- Phase 4 (partial): manual mount centering and view-local auto-follow are connected through public viewer methods. FOV overlay renders framing-store mosaic columns, rows, rotation and overlap without exposing renderer state to Vue.
- Phase 6 (partial): app-wide native background state pauses the viewer and its clock display; view state is session-persisted with throttled writes; UTC progression can be paused/resumed through the engine clock API. App-owned Capacitor listener cleanup now removes only its own handle.
- Phase 6 (partial): localized date, local-time, server-now, pause and time-rate controls are connected. The standalone compatibility `app.js` is now a loader for `app-v8.js`, removing the duplicated legacy standalone implementation.
- Phase 5 (partial): spherical gnomonic projection replaces flat RA/Dec mapping; 130 bright stars and 27 constellation line sets are generated reproducibly, packaged offline, searchable, and controlled by host display settings.
- Phase 5 (partial): custom horizon points are interpolated by the host and projected by the engine from geographic north/east azimuth into the live observer sky. Engine UTC advances while active and horizon projection refreshes once per minute without a continuous render loop.
- Phase 5 (partial): the Sun, Moon, eight planets and Pluto now use live, offline Astronomy Engine ephemerides. They render, label, search, select and hand off topocentric J2000 coordinates at the viewer's observer and UTC.
- Phase 5 (partial): 1,214 pinned IAU Minor Planet Center comet records now render and search offline using universal-variable propagation, light-time correction and observer parallax. Embedded and standalone Atlas consumers load the same engine modules.
- Phase 5 (partial): the embedded viewer now honors the existing azimuth-grid, equatorial-grid, local-meridian, ecliptic and atmosphere settings and includes an offline Galactic-plane Milky Way layer.
- Phase 5 (partial): Io, Europa, Ganymede and Callisto now use live offline ephemerides and support rendering, search, selection and narrow-field centering.
- Phase 5 (partial): existing default, neutral and custom order-0 HiPS/HEALPix landscapes now load through the Atlas API and render in the live observed frame; production browser validation passed and native visual validation remains open.
- Phase 4 (partial): the existing FOV rotation and view-center action panel now reads the active Atlas center through the typed public API, so rotation, slew/center, sequence-target and favorite-target workflows no longer depend on Stellarium internals. Its sampling loop stops while the sky view is hidden.
- Phase 5: the standalone shell now instantiates the same public viewer as Touch-N-Stars. Planets, Galilean moons, comets, OpenNGC search/selection, reference layers, offline HEALPix landscape, time/location, lifecycle, camera FOV and mosaic overlays share the embedded renderer.
- Phase 3: host conversion and command boundaries are implemented and tested. The IAU SOFA `iauH2fk5` reference vector validates ICRS-to-FK5/J2000 orientation, and a topocentric Mars position matches an independent JPL Horizons ICRF/J2000 fixture within one arcminute; broader golden-reference coverage remains open.

### 2026-07-12 controls, horizon, optics, and landscape slice

- The standalone sky-control panel now starts closed, including matching `aria-hidden` and `aria-expanded` state. The controls and time buttons open the same panel and keep their visual and accessibility state synchronized. The Touch-N-Stars settings modal already started closed and retains that behavior.
- `hideBelowHorizon` is a separate display option from landscape visibility and defaults to enabled in the public viewer. Standalone persists it under `celestia-atlas.hide-below-horizon`; Touch-N-Stars persists `stellarium.hideBelowHorizon` in the existing settings store and exposes the switch only for the renderer-managed Atlas path. An absent setting is interpreted as enabled so existing installations receive the new default.
- The horizon mask uses the interpolated custom site-horizon altitude at each azimuth when one is available and otherwise uses the geometric 0-degree horizon. It suppresses below-horizon Milky Way pixels, celestial reference curves, constellation segments, stars, deep-sky objects, Solar System objects, comets, mount markers, associated object labels, and hit targets. Landscape imagery, horizon/cardinal context, and the camera framing overlay remain independently controllable.
- The standalone framing inputs are now physical imaging-train values: sensor width and height in pixels, pixel size in micrometres, telescope focal length and optional aperture in millimetres, plus rotation and mosaic settings. The derived readout reports sensor size, angular width/height, pixel scale, and focal ratio. Aperture affects focal ratio but does not affect angular FOV. Overlay dimensions use the same gnomonic tangent projection as the sky canvas rather than a linear degrees-to-pixels approximation.
- Touch-N-Stars continues to derive the camera frame from the active NINA profile: `CameraSettings.PixelSize`, `FramingAssistantSettings.CameraWidth`/`CameraHeight`, and `TelescopeSettings.FocalLength`. Rotation and mosaic values remain host-owned framing settings. Invalid or incomplete profile geometry removes the overlay instead of rendering an invented frame.
- Landscape sampling now follows Stellarium's nested HEALPix axis-swap convention while preserving the existing observed-frame azimuth reflection. Continuous source coordinates and premultiplied-alpha bilinear interpolation remove the 0/360-degree and face-boundary discontinuities without dark fringes around transparent terrain edges.
- Landscape and Milky Way rasters are DPR-aware and bounded. Coarse pointers use
  a 64-pixel-wide interaction raster and up to 768 pixels when settled; fine
  pointers use 384/1024 pixels. Default canvas DPR caps are 1.25 on coarse
  pointers and 2 on fine pointers. Wheel and pointer input schedule a settled
  refinement without leaving navigation in the reduced-resolution state.

### 2026-07-12 mobile hardening and brightness-filter slice

- `App.vue` uses a first-open `v-if` latch, so the Atlas component and its data
  are absent from startup. After first use, `v-show` retains the warm viewer and
  view state while its lifecycle API pauses hidden work.
- Production splitting isolates the viewer, engine, bright-sky data and compact
  OpenNGC data. The 12,578-object viewer payload is 2,971,964 raw bytes versus
  6,019,427 bytes for the source-preserving file, a 50.6% reduction, and no
  longer requires a host-side 12,578-object copy/conversion.
- Mobile rendering uses allocation-free landscape and Milky Way ray projection,
  cached raster uploads, conditional backing-canvas resizing, projected
  off-screen culling, one-second Solar System caching and one view callback per
  drawn interaction frame. Pause/destroy cancel active pointers, and 2D context
  loss cancels interaction until the context is restored.
- Host work is deferred or bounded: profile/time refreshes no longer block
  viewer creation, landscape discovery starts when settings first open, search
  has a 120 ms debounce, expanded FOV sampling runs at 10 Hz, and mobile overlays
  respect safe-area insets.
- `starMagnitudeLimit`, `galaxyMagnitudeLimit` and
  `deepSkyMagnitudeLimit` are persisted independently. Lower apparent
  magnitudes show only brighter objects. Galaxy pairs, triplets, groups and
  clusters use the galaxy limit; the deep-sky limit covers all other DSOs.
  `30` is shown as Auto/no user cap, while the adaptive field-of-view ceiling
  still protects wide-view performance. A stricter DSO cap hides unknown-
  magnitude objects, selected targets remain visible, and search remains
  complete and unfiltered.

### 2026-07-12 horizon-aligned embedded-view fix

- Coordinate mode is now explicit and independent of overlay visibility.
  Touch-N-Stars always selects the Atlas `horizontal` mode during viewer
  initialization; the azimuthal and equatorial settings continue to control
  grid drawing only.
- Hiding both coordinate grids no longer restores an equator-up projection.
  Landscapes remain aligned to the local horizon and left/right dragging keeps
  altitude fixed while changing azimuth. The standalone Atlas can still opt
  into equatorial orientation through its own mode control.
- Production mobile-Chrome validation used the default grid-off host settings.
  An 80-pixel horizontal touch drag changed azimuth by 6.829 degrees while
  altitude changed by 0.000143 degrees and the 70-degree FOV remained fixed.
  The landscape stayed level and no Atlas or coordinate errors appeared; the
  local preview reported only expected missing-NINA API/WebSocket failures.

### 2026-07-12 Milky Way orientation fix

- The bundled panorama is Galactic north-up, but its longitude increases from
  left to right. The renderer previously sampled longitude in the opposite
  direction, mirroring the Milky Way's local-horizon crossing.
- Atlas now uses the panorama's actual rightward-longitude convention in both
  its shared Canvas renderer and legacy WebGL compatibility path. Latitude was
  deliberately left unchanged so Galactic north remains at the top.
- Independent axis-coded regression coverage checks both longitude direction
  and north-up latitude instead of comparing two copies of the same mapping.
- Browser validation against the real panorama placed its
  [LMC](https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=LMC) sample at the
  published Galactic position with luminance 57 versus 0 at the mirrored
  longitude; the
  [SMC](https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Small+Magellanic+Cloud)
  sample was 3.03 versus 0 at its mirror.
- The Touch-N-Stars production bundle loaded the corrected engine and Milky Way
  asset with HTTP 200 on a mobile viewport. Its minified engine contains the
  rightward-longitude formula and no old mirrored formula, and the console had
  no Atlas or renderer errors; remaining preview noise was missing-NINA backend
  traffic.

## 9. Feature-parity matrix

| Capability               | Existing                                        | New engine                                                                                                   | Status                                                               |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Explicit lifecycle       | Hidden render suppression plus host workarounds | `pause`, `resume`, `resize`, idempotent `destroy`                                                            | Web passed; native test pending                                      |
| Observer and UTC         | Supported                                       | Validated setters and synchronized host time                                                                 | Connected; fixtures expanding                                        |
| Offline catalogue search | Stellarium packaged data                        | Lazy compact 12,578-object OpenNGC catalogue and moving objects                                              | Web load/search performance passed; native pending                   |
| Brightness filters       | Shared display density                          | Independent persisted star, galaxy-family and other-DSO limiting magnitudes                                  | Standalone and host web passed                                       |
| Framing selection        | Supported                                       | Typed selection callback and explicit ICRS/J2000-to-NINA-J2000 command boundary                              | Connected; endpoint provenance and SOFA conversion tested            |
| Mount/FOV/rotation       | Supported                                       | Profile-derived physical camera geometry, exact projected frame, marker/follow, mosaic and rotation controls | Connected; native test pending                                       |
| Horizon/landscape        | Supported                                       | Default-on persisted horizon mask; seam-correct, bilinear and DPR-aware order-0 HiPS/HEALPix imagery         | Standalone and host production browsers passed; native tests pending |
| Standalone controls      | Open control panel                              | Control panel starts closed with synchronized accessibility state                                            | Connected                                                            |
| Mobile lifecycle         | Host workarounds                                | First-use lazy mount, warm reuse, app-background pause and deterministic pointer cancellation                | Web passed; native test pending                                      |

## 10. Test results

- Host `npm run test:run`: 39 passed, 0 failed.
- Default-view promotion adds a regression test proving Atlas is the normal import and Stellarium requires the explicit rollback flag.
- Default-view promotion validation: 47 host tests passed; targeted ESLint passed; normal and `VITE_STELLARIUM_ROLLBACK=true` production builds passed. A production browser load requested the `CelestiaAtlasView` JS/CSS chunks and no `StellariumView` chunk. Console errors were limited to expected missing NINA API responses from the static-only test server; no viewer or Vue runtime errors occurred.
- Atlas settings parity validation: 48 host tests passed; targeted ESLint and the production build passed. On a 390×844 browser viewport the settings modal opened, the azimuth-grid toggle updated host settings, and the original Atlas canvas remained mounted. Console errors were limited to expected missing NINA API and landscape-list responses from the static-only server.
- Host `npm run lint`: timed out after 60 seconds; no pass claimed.
- Candidate JavaScript syntax checks: passed before Phase 1 changes.
- Host after coordinate contract: 44 passed, 0 failed; targeted ESLint passed.
- Host command-boundary coverage validates J2000 pass-through, the official IAU SOFA `iauH2fk5` ICRS-to-FK5/J2000 reference vector, source-frame retention, and rejection of untagged coordinates.
- Production-browser command-boundary validation selected the ICRS M31 catalogue result and used `go to framing`. The host opened the mount slew tab with a J2000/epoch-2000 framing record and retained `sourceCoordinateFrame: ICRS`. The console contained only expected missing-NINA network retries from the static preview; no Atlas, Vue, `ReferenceError`, `TypeError`, or unhandled errors appeared.
- Host after search/selection/mount integration: 46 passed, 0 failed; targeted ESLint, typecheck and flagged production build passed.
- Candidate Phase 1 unit tests: 3 passed, 0 failed; syntax and diff checks passed.
- Host `npm run typecheck`: passed in 97.6 seconds.
- Historical flagged POC `npm run build:app`: passed. That build produced a
  9.21 kB viewer chunk and a 5,452.22 kB full-catalogue chunk; it predates the
  compact catalogue and final startup-graph verification below.
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

### Phase 6 browser performance evidence

| Check                      | Environment and method                                                                                        | Result                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-hardening pan baseline | Previous production build, 390x844 CSS px, DPR 3, coarse touch, no CPU throttle; six synthetic pointer frames | 946.82 ms mean. This is a historical baseline, not a direct ratio against differently throttled runs.                                                                |
| Final pan, normal CPU      | Final production host, same viewport/DPR and synthetic touch method; ten frames                               | 13.32 ms mean, 13.3 ms median, 13.4 ms maximum; backing canvas 488x1025 (DPR cap 1.25).                                                                              |
| Final pan, 4x CPU slowdown | Same final host and viewport with DevTools 4x slowdown; ten frames                                            | 13.33 ms mean, 13.3 ms median, 13.4 ms maximum.                                                                                                                      |
| Startup graph              | Fresh production navigation before first Atlas open                                                           | No `CelestiaAtlasView`, `celestia-engine`, `celestia-bright-sky`, `celestia-catalog`, Milky Way or landscape request/module preload.                                 |
| First open                 | Local production preview                                                                                      | Ready in 311.8 ms; viewer resource began 0.8 ms after the latch, engine request took 23.4 ms and compact catalogue request 93.0 ms. All Atlas resources loaded once. |
| Warm reuse/idle            | Twenty hide/show cycles, followed by 1.2 s hidden instrumentation                                             | Same single canvas, zero additional Atlas requests and zero hidden draw calls; resume produced one visible redraw.                                                   |
| Offline search             | `M31` query against the full compact catalogue                                                                | 135.3 ms to the Andromeda result, including the intentional 120 ms debounce.                                                                                         |
| Touch regression           | Synthetic two-pointer pinch                                                                                   | FOV changed from 16.15 to 7.18 degrees; one canvas remained mounted.                                                                                                 |
| Selection regression       | Search and select Venus, then wait 3.2 s through clock updates                                                | Details remained visible with unchanged coordinates.                                                                                                                 |
| Brightness controls        | Mobile settings UI and persisted Pinia state                                                                  | Star 2.5, galaxy 10.0 and other DSO 8.0 updated independently; `30` renders as localized Auto.                                                                       |

The final production chunks are 31,545 bytes for the view (9,572 gzip),
429,526 for the Atlas engine (102,930 gzip), 23,051 for bright-sky data (6,400
gzip), and 2,730,350 for the compact catalogue module (528,804 gzip). The prior
5,947,978-byte vendor chunk (1,007,570 gzip) was preloaded at startup; the final
46,573-byte catch-all vendor chunk is unrelated to Atlas. Atlas unit tests pass
42/42 and host integration tests pass 53/53. ESLint, typecheck and the production
build pass. The locale-key additions are complete across all 13 packs; the
repository-wide i18n checker still reports only its pre-existing placeholder-
translation mismatches.

Native Android/iOS interaction, package-size and memory/heap profiling remain
explicit Phase 6 release gates; no native result is inferred from browser
emulation.

## 11. Remaining blockers

- Licensing resolved by owner authorization on 2026-07-10: Celestia Atlas uses GNU GPL v3 or later, matching Touch-N-Stars. OpenNGC remains CC BY-SA 4.0 under the third-party notices.
- The complete pinned offline catalogue is packaged and network-lazy. Browser
  search/render and startup-graph validation passed; native validation remains
  open.
- Android and iOS runtime validation require suitable platform environments.
- Existing listed and custom landscapes now use seam-correct spherical order-0 HEALPix projection. The standalone and Touch-N-Stars production browsers passed orientation, seam, settled-resolution, request, and Atlas console checks; Android and iOS validation remain release gates.
- Remaining parity gates are Android/iOS lifecycle and gesture validation,
  native package-size/heap profiling, expanded astronomy reference fixtures and
  final removal of the rollback-only Stellarium runtime after its release window.
- Package boundary resolved: Touch-N-Stars uses the public Git repository pinned
  over HTTPS to immutable Atlas commit
  `80a76b29043dd59357e8a0965bba4542eb8ecd20`. Embedded and standalone shells
  share the same viewer and astronomy engine modules.

## 12. Removal checklist

- [ ] All mandatory parity gates pass.
- [ ] Astronomy reference fixtures and tolerances pass.
- [x] Full offline catalogue and notices are packaged.
- [ ] Web and required native lifecycle tests pass.
- [x] Celestia is default with a tested rollback interval.
- [ ] Stellarium runtime, WASM, data, globals, stores, workarounds, and build logic are removed.
- [ ] Final search classifies every historical reference.
