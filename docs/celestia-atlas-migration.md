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
- The compact `openngc-viewer-catalog.json` package export supplies tagged ICRS
  decimal degrees directly. Separately licensed package exports supply the
  Stellarium-derived DSO cross-index, SIMBAD A66 planetary nebulae, curated
  bright-sky stars and HYG stars. The host combines them deterministically and
  normalizes legacy hour-based RA at the boundary; no catalogue requires a
  runtime network request.
- Advanced API mount data includes `Coordinates.RADegrees`, `Coordinates.Dec`, and `Coordinates.Epoch`. The adapter accepts `J2000` directly and explicitly precesses NINA `JNOW` coordinates to J2000 before passing them to the Atlas. B1950/J2050 remain rejected. Source inspection of `pinsAPI/WebService/V2/Application/Framing.cs` and `Equipment/Mount.cs` proves that framing, slew, center, rotate and sync endpoints interpret decimal-degree inputs as NINA `Epoch.J2000` coordinates.
- Atlas J2000 selections pass through unchanged. ICRS selections are rotated to FK5 equinox and epoch J2000.0 with the transpose of the IAU SOFA `iauFk5hip` orientation matrix before entering framing state. The framing record is always tagged `J2000`, retains its source-frame provenance, and untagged inputs remain rejected. The SOFA `iauH2fk5` validation vector is covered by a host unit test. See the [official SOFA ANSI C release](https://www.iausofa.org/2023-10-11c).
- The Atlas view-center action panel uses the same boundary before exposing coordinates to slew, center, rotate, sequence-target, and favorite-target workflows. Its shared action component accepts only validated J2000 values, clears stale coordinates after any invalid sample, and disables every command-producing control until a new valid sample exists. The rollback viewer's ICRF center follows the same explicit ICRS-to-J2000 conversion.
- JNOW/B1950/J2050 inputs remain rejected at the NINA command boundary.
  Atmospheric refraction is deliberately absent from Atlas altitude, and live
  IERS DUT1/polar-motion data is not ingested. Upstream FITS/image position-angle
  provenance remains a separate validation item and cannot silently enter the
  command boundary.

## 8. Implementation phases

- Phase 0: complete enough to begin isolated engine work; baseline lint timed out.
- Phase 1: public API, lifecycle, pointer cancellation and initial overlays implemented; standalone renderer extraction is complete.
- Phase 2: the lazy Vue integration connects observer, synchronized UTC, FOV, visibility and deterministic teardown.
- Phase 7 (partial): Celestia Atlas is now the default viewer in normal builds. The legacy viewer remains available for one rollback interval only when `VITE_STELLARIUM_ROLLBACK=true` is explicitly set.
- Phase 7: the rollback interval is complete. The conditional legacy import,
  Stellarium Web view/store/overlays, JavaScript loader and WebAssembly binaries
  are removed; Celestia Atlas is the only sky runtime.
- Phase 7 (partial): the existing display and landscape settings modal is exposed on the Atlas screen in renderer-managed mode. Host settings flow through the Atlas public API watchers without legacy store mutation or viewer remount events.
- Phase 4 (partial): offline search, focus, canvas hit selection, selected-object details, proven ICRS/J2000-to-NINA-J2000 framing handoff, J2000 mount marker, grid/display settings, and mock mount epoch are connected.
- Phase 4 (partial): manual mount centering and view-local auto-follow are connected through public viewer methods. The FOV overlay renders framing-store mosaic columns, rows, celestial-north position angle and overlap without exposing renderer state to Vue.
- Phase 6 (partial): app-wide native background state pauses the viewer and its clock display; view state is session-persisted with throttled writes; UTC progression can be paused/resumed through the engine clock API. App-owned Capacitor listener cleanup now removes only its own handle.
- Phase 6 (partial): localized date, local-time, server-now, pause and time-rate controls are connected. The standalone compatibility `app.js` is now a loader for `app-v8.js`, removing the duplicated legacy standalone implementation.
- Phase 5 (partial): spherical gnomonic projection replaces flat RA/Dec mapping; 130 curated bright stars, 8,780 HYG stars and 27 constellation line sets are generated reproducibly, packaged offline, searchable, and controlled by host display settings.
- Phase 5 (partial): Touch-N-Stars combines the 12,578-object OpenNGC layer with 86 SIMBAD A66 planetary nebulae and the 8,658-record Stellarium-derived Abell/ACO, Barnard, LBN, LDN, RCW, Sharpless 2 and vdB supplement. Exact reciprocal NGC/IC identities may merge; ambiguous and positional-only matches remain separate.
- Phase 5 (partial): custom horizon points are interpolated by the host and projected by the engine from geographic north/east azimuth into the live observer sky. Engine UTC advances while active and horizon projection refreshes once per minute without a continuous render loop.
- Phase 5 (partial): the Sun, Moon, eight planets and Pluto now use live, offline Astronomy Engine ephemerides. They render, label, search, select and hand off topocentric J2000 coordinates at the viewer's observer and UTC.
- Phase 5 (partial): 1,214 pinned IAU Minor Planet Center comet records now render and search offline using universal-variable propagation, light-time correction and observer parallax. Embedded and standalone Atlas consumers load the same engine modules.
- Phase 5 (partial): the embedded viewer now honors the existing azimuth-grid, equatorial-grid, local-meridian, ecliptic and atmosphere settings and includes an offline Galactic-plane Milky Way layer.
- Phase 5 (partial): Io, Europa, Ganymede and Callisto now use live offline ephemerides and support rendering, search, selection and narrow-field centering.
- Phase 5 (partial): existing default, neutral and custom order-0 HiPS/HEALPix landscapes now load through the Atlas API and render in the live observed frame; production browser validation passed and native visual validation remains open.
- Phase 4 (partial): the existing FOV rotation and view-center action panel now reads the active Atlas center through the typed public API and converts it to the proven NINA J2000 command contract before supplying slew/center/rotate, sequence-target, and favorite-target workflows. Invalid samples clear old values and disable all actions. Its sampling loop stops while the sky view is hidden.
- Phase 4 (partial): canvas and search selections now reuse the complete selected-object action panel. One pure adapter normalizes aliases, converts the tagged Atlas position once to NINA J2000, formats the displayed coordinates and retains source-frame provenance for framing; invalid selections clear every command value and disable the panel.
- Phase 5: the standalone shell now instantiates the same public viewer as Touch-N-Stars. Planets, Galilean moons, comets, layered offline catalogue search/selection, reference layers, offline HEALPix landscape, time/location, lifecycle, camera FOV and mosaic overlays share the embedded renderer.
- Phase 3: host conversion and command boundaries are implemented and tested.
  The IAU SOFA `iauH2fk5` vector validates ICRS-to-FK5/J2000 orientation,
  SOFA `Hd2ae`/`Ae2hd` vectors validate horizontal handedness, fixed
  Astronomy Engine values validate the full observed frame, and topocentric
  Mars/12P positions match independent JPL Horizons fixtures within one
  arcminute. Upstream FITS/image position-angle provenance remains open.

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
- Production splitting isolates the viewer, engine, curated bright-sky data,
  HYG stars, compact OpenNGC data and supplemental DSO/Abell-PN layers. Every
  catalogue stays behind the first-open latch and package-local dynamic imports,
  so the application startup graph remains independent of Atlas data.
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

### 2026-07-12 view-center command boundary

- Search results must supply an explicit ICRS or J2000 frame before they can be
  focused or selected; the host no longer silently labels missing metadata as
  ICRS.
- The Atlas view-center callback converts its tagged center to FK5/J2000 before
  returning it to the shared action panel. The panel validates that value again
  at its final consumer boundary, and the rollback viewer converts its ICRF
  sample through the same path.
- Slew, center, rotate, sequence-target, and favorite-target controls share one
  J2000 coordinate sample. A missing, untagged, non-finite, or out-of-range
  sample clears the displayed coordinates and disables the complete action
  fieldset instead of retaining `0,0` or a previously valid target.

### 2026-07-13 celestial-north camera frame

- Touch-N-Stars passes its established NINA position angle unchanged and tags
  it explicitly as clockwise from celestial north. The host does not inspect
  renderer roll or apply a second sign conversion.
- Atlas now composes the requested position angle with the current projection
  roll as `-projection rotation + signed camera angle`. PA 0 therefore follows
  projected celestial north and PA 90 follows celestial east even while the
  embedded view remains aligned to the local horizon.
- The corrected Canvas transform wraps both the single camera rectangle and the
  complete mosaic, including panel offsets. Independent projection tests cover
  north/east/west axes, both angle conventions, view rotations of 0, +37 and
  -112 degrees, and a fixed Berlin horizontal-view geometry.
- Production-browser instrumentation measured PA 0 at 26.319144 degrees and PA
  30 at 56.319144 degrees. A 3-by-2 mosaic used one identical transform for all
  six panels. After a horizontal drag, projected celestial north was 11.587519
  degrees and the PA 30 frame was 41.587518 degrees, an error below one
  millionth of a degree. No Atlas, coordinate, panning, reference or renderer
  exception appeared in the console; remaining messages were known mock or
  missing-backend traffic and pre-existing form issues.

### 2026-07-13 observed-coordinate frame

- The Atlas dependency is pinned to `71da520db6e0e36e0bf75a7447fb266cf60363df`. Tagged
  J2000 coordinates now enter Astronomy Engine's EQJ-to-HOR rotation instead
  of being treated as equatorial-of-date; tagged ICRS coordinates first receive
  the same SOFA `iauFk5hip` orientation rotation used at the host command
  boundary. The inverse path returns the frame explicitly requested by the
  caller.
- The observed rotation includes precession, nutation and sidereal Earth
  orientation at the supplied UTC and east-positive observer longitude.
  Horizontal azimuth remains north-zero/east-positive and altitude is geometric
  without atmospheric refraction. One observer/time matrix and its inverse are
  cached and reused by object clipping, grids, landscapes and the Milky Way
  horizon mask.
- Official SOFA `Hd2ae`/`Ae2hd` vectors retain their `1e-13`/`1e-14`
  radian tolerances. Fixed Astronomy Engine 2.1.19 fixtures cover RA wrap,
  both celestial poles, northern/southern and east/west sites, the equator,
  leap day, multiple dates, a meridian crossing and a below-horizon target at
  `1e-10` degree. Camera 0/90/180/270/wrap and independent portrait/landscape
  gnomonic edges are also covered.
- Standalone Chrome validation at 390x844 CSS pixels and DPR 3 reproduced the
  Berlin reference (`Az 3.391984811 degrees`, `Alt -7.483089614 degrees`).
  A horizontal drag changed the center from azimuth 180.2 to 186.8 degrees
  while altitude stayed 35.0 degrees; a synthetic pinch changed FOV from 70 to
  35 degrees with a 488x1055 backing canvas. The landscape remained level,
  altitude labels were visible and the console contained no warnings, errors
  or reported issues.
- The Touch-N-Stars production bundle was rechecked at the same mobile viewport.
  Drag updated and persisted the center, pinch changed FOV from 35 to 17.5
  degrees, one Atlas canvas remained mounted, and the view, engine, bright-sky,
  catalogue and stylesheet chunks all returned HTTP 200. Console inspection
  found no Atlas exception, coordinate failure or unhandled error; the remaining
  messages were expected API/backend retries from running without NINA and the
  pre-existing form-field issues.

### 2026-07-16 layered offline catalogue integration

- Touch-N-Stars now follows the standalone Atlas composition order: OpenNGC is
  combined with the SIMBAD A66 layer first, then with the Stellarium-derived DSO
  supplement. Attachment requires an exact reciprocal NGC/IC identity; sky
  position is never used as identity evidence.
- The resulting package-local catalogue contains 21,191 deep-sky records across
  `openngc`, `abell`, `abell-pn`, `barnard`, `lbn`, `ldn`, `rcw`, `sharpless` and
  `vdb`. The 130 curated stars and 8,780 HYG records produce 8,910 offline stars.
- Abell/ACO galaxy clusters and the Abell 1966 planetary-nebula catalogue retain
  distinct namespaces. `Abell 39` and `Abell PN 39` therefore remain different
  objects even though `Abell 39` is also an A66 alias.
- Host integration coverage loads the real package payloads and verifies
  `LDN 1235`, both Abell 39 objects and the HYG-only star `Fulu`, including
  aliases, catalogue groups, coordinate normalization and immutable inputs.

### 2026-07-16 selected-target action parity

- Canvas hits and offline search selections now use the same selected-object
  panel as the rollback renderer. The Atlas path supplies aliases plus favorite,
  Framing Assistant, sequence-target, slew/center/rotate and mount-sync actions.
- `atlasSelectionToCommandModel` is the only selection-to-command adapter. It
  converts explicitly tagged ICRS/J2000 positions through the proven NINA J2000
  boundary, formats HMS/DMS labels and carries `coordinateFrame`,
  `epochJulianYear` and `sourceCoordinateFrame` into framing state.
- Untagged or invalid positions produce no command coordinates, and the entire
  action fieldset remains disabled. The temporary touch guard is also reflected
  through native disabled state and `aria-busy` instead of remaining visual only.
- The shared card is positioned relative to the already navigation-safe viewer,
  uses dynamic-viewport and safe-area bounds on mobile, and scrolls below the
  search control on narrow landscape screens. The favorite editor teleports to
  the application root so transformed/backdrop-filtered overlays cannot clip it.
- Production-browser validation selected the ICRS Andromeda Galaxy result and
  opened `/framing` with J2000 `RA 10.68480320593988`,
  `Dec 41.26905701462424`, epoch 2000 and `sourceCoordinateFrame: ICRS`.
  Aliases and all five action groups were visible; disconnected mount actions
  remained disabled.
- At 390x844/DPR 3 the card stayed within the viewport and its close target was
  44x44 CSS pixels. At 844x390/DPR 3 the card began below the search field,
  ended at y=368, and its 262-pixel content viewport scrolled to the final sync
  action without document-edge clipping. The initial 500 ms guard exposed
  `aria-busy=true` and a disabled fieldset, then enabled the valid actions.
- After stopping the preview server, the already-loaded Atlas still found and
  selected `LDN 1235`, displayed its aliases and enabled framing. Console review
  found no Atlas/Vue exception, `ReferenceError`, coordinate/panning error or
  unhandled exception; remaining messages were expected absent-NINA traffic and
  pre-existing form-field issues.

### 2026-07-16 persisted catalogue-marker filters

- Touch-N-Stars derives filter facets once from the exact 21,191-object offline
  catalogue using the Atlas public type and catalogue-group classifiers. The
  resulting renderer controls expose all 17 object types and nine catalogue
  sources with real membership counts.
- `deepSkyObjectTypes` and `deepSkyCatalogueGroups` are independent persisted
  allowlists. `null` is the future-safe All state, `[]` is an intentional None,
  and partial selections use trimmed lowercase keys. Malformed or stale-only
  persisted values recover to All instead of hiding the catalogue.
- The catalogue controls mount only for the renderer-managed Atlas path. Native
  collapsed disclosure groups, checkboxes and 44-pixel All/None actions keep
  the 17- and nine-item lists usable in the existing mobile settings modal.
  Abell/ACO galaxy clusters (`abell`) remain separate from A66 planetary
  nebulae (`abell-pn`). Turning off the global DSO layer disables, but does not
  discard, these selections.
- Type/source filters affect visible DSO markers and hit targets. Offline search
  intentionally remains complete, and an already selected target remains
  visible so its action panel does not disappear underneath the user.
- Production validation showed 17/17 and 9/9 facets, persisted an LDN-only
  selection in the real `settings` local-storage record, restored it as 1/9
  after reload, and canonicalized malformed and obsolete saved values back to
  All. At 390x844/DPR 3, both lists scrolled to their final entry; summaries,
  rows and All/None actions measured 44 CSS pixels and passed center-point hit
  testing. After the preview origin stopped, the already-loaded filtered Atlas
  still returned `LDN 1235` from its offline search index. Console inspection
  found only expected absent-NINA/origin network traffic and the pre-existing
  form-label issues, with no Atlas/Vue exception, invalid-prop warning,
  `ReferenceError`, `TypeError` or unhandled failure.

## 9. Feature-parity matrix

| Capability               | Existing                                        | New engine                                                                                                   | Status                                                               |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Explicit lifecycle       | Hidden render suppression plus host workarounds | `pause`, `resume`, `resize`, idempotent `destroy`                                                            | Web passed; native test pending                                      |
| Observer and UTC         | Supported                                       | Validated setters, synchronized host time and cached EQJ/ICRS observed frame                                 | Web reference fixtures passed; native pending                        |
| Offline catalogue search | Stellarium packaged data                        | Lazy 21,191-object layered DSO catalogue, 8,910 stars and moving objects                                     | Host and production-browser search passed; native validation pending |
| Brightness filters       | Shared display density                          | Independent persisted star, galaxy-family and other-DSO limiting magnitudes                                  | Standalone and host web passed                                       |
| Catalogue marker filters | Shared display density                          | Independent persisted 17-type and nine-source allowlists with All/None and stale-state recovery              | Host and production mobile web passed                                |
| Framing selection        | Supported                                       | Shared selected-object actions and explicit ICRS/J2000-to-NINA-J2000 command boundary                        | Connected; full action parity, provenance and conversion tested      |
| Mount/FOV/rotation       | Supported                                       | Profile-derived physical camera geometry, celestial-north frame, marker/follow, mosaic and rotation controls | Production web passed; native test pending                           |
| Horizon/landscape        | Supported                                       | Default-on persisted horizon mask; seam-correct, bilinear and DPR-aware order-0 HiPS/HEALPix imagery         | Standalone and host production browsers passed; native tests pending |
| Standalone controls      | Open control panel                              | Control panel starts closed with synchronized accessibility state                                            | Connected                                                            |
| Mobile lifecycle         | Host workarounds                                | First-use lazy mount, warm reuse, app-background pause and deterministic pointer cancellation                | Web passed; native test pending                                      |

## 10. Test results

- Catalogue-filter integration validation on 2026-07-16 passed all 71 host
  tests. Real package fixtures prove the exact 17 type and nine source facets,
  LDN/type membership and the distinct Abell cluster/A66 planetary-nebula
  namespaces. Scoped ESLint, formatting, locale JSON parsing, the 6 GB Vue
  typecheck and production build passed. The production browser verified
  persisted reload, invalid-state recovery and touch reachability as described
  above.
- Selected-target integration validation on 2026-07-16 passed all 66 host tests,
  including exact M31 ICRS-to-J2000 values, alias normalization, invalid-frame
  clearing, provenance retention and renderer-neutral action-panel wiring.
  Targeted ESLint, the 6 GB Vue typecheck and the production build passed.
- The selected-target production-browser pass verified the real `/framing`
  route and stored J2000/source-frame record, root-level favorite dialog,
  disabled mount actions, 44-pixel close target, portrait/landscape safe bounds,
  short-landscape scrolling, accessible startup guard and server-off LDN search.
- Layered-catalogue host validation on 2026-07-16 passed all 63 tests. The real
  package payload test proves 21,191 DSOs, 8,910 stars, all nine catalogue
  groups, immutable inputs, HYG hour-to-degree normalization, LDN aliases and
  distinct Abell cluster/A66 planetary-nebula identities. Targeted ESLint,
  formatting, the 6 GB Vue typecheck and the production build passed.
- Production-browser searches focused and selected `LDN 1235`, the Abell 39
  galaxy cluster, `Abell PN 39` through its `A66 39` alias, and the HYG-only
  star `Fulu` at the expected coordinates. At 390x844 CSS pixels and DPR 3 the
  search, clock and settings controls remained inside the viewport. Every
  Atlas engine/catalogue chunk returned successfully. With the preview server
  stopped, the already-loaded viewer still searched and selected `Barnard 72`
  and returned `Sh2-101`, proving that catalogue search performs no runtime
  fetch. Console review found no Atlas/Vue exception, `ReferenceError`, panning
  geometry failure or unhandled exception; remaining entries were expected
  absent-NINA network retries and pre-existing form-field issues.
- Host `npm run test:run`: 39 passed, 0 failed.
- Default-view promotion adds a regression test proving Atlas is the normal import and Stellarium requires the explicit rollback flag.
- Default-view promotion validation: 47 host tests passed; targeted ESLint passed; normal and `VITE_STELLARIUM_ROLLBACK=true` production builds passed. A production browser load requested the `CelestiaAtlasView` JS/CSS chunks and no `StellariumView` chunk. Console errors were limited to expected missing NINA API responses from the static-only test server; no viewer or Vue runtime errors occurred.
- Atlas settings parity validation: 48 host tests passed; targeted ESLint and the production build passed. On a 390×844 browser viewport the settings modal opened, the azimuth-grid toggle updated host settings, and the original Atlas canvas remained mounted. Console errors were limited to expected missing NINA API and landscape-list responses from the static-only server.
- Host `npm run lint`: timed out after 60 seconds; no pass claimed.
- Candidate JavaScript syntax checks: passed before Phase 1 changes.
- Host after coordinate contract: 44 passed, 0 failed; targeted ESLint passed.
- Host command-boundary coverage validates J2000 pass-through, the official IAU SOFA `iauH2fk5` ICRS-to-FK5/J2000 reference vector, source-frame retention, and rejection of untagged coordinates.
- Production-browser command-boundary validation selected the ICRS M31 catalogue result and used `go to framing`. The host opened the mount slew tab with a J2000/epoch-2000 framing record and retained `sourceCoordinateFrame: ICRS`. The console contained only expected missing-NINA network retries from the static preview; no Atlas, Vue, `ReferenceError`, `TypeError`, or unhandled errors appeared.
- Production-browser view-center validation focused the ICRS M31 result and opened the shared action panel. Slew and favorite actions received the same converted J2000 pair (`10.684802539`, `41.269057059`). Injecting an untagged callback result cleared both coordinate labels, made all descendant actions match `:disabled`, blocked sequence/favorite handlers, and did not replace sentinel framing-store coordinates. Restoring the valid callback re-enabled the fieldset. Full console inspection found only expected missing-backend traffic; no Atlas, Vue, `ReferenceError`, `TypeError`, or unhandled errors appeared.
- Celestial-north camera-frame coverage passes 47 Atlas tests and locks the host
  boundary to the raw framing-store angle plus the explicit
  `clockwise-from-celestial-north` convention.
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

| Check                      | Environment and method                                                                                        | Result                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pre-hardening pan baseline | Previous production build, 390x844 CSS px, DPR 3, coarse touch, no CPU throttle; six synthetic pointer frames | 946.82 ms mean. This is a historical baseline, not a direct ratio against differently throttled runs.                                            |
| Final pan, normal CPU      | Final production host, same viewport/DPR and synthetic touch method; ten frames                               | 13.32 ms mean, 13.3 ms median, 13.4 ms maximum; backing canvas 488x1025 (DPR cap 1.25).                                                          |
| Final pan, 4x CPU slowdown | Same final host and viewport with DevTools 4x slowdown; ten frames                                            | 13.33 ms mean, 13.3 ms median, 13.4 ms maximum.                                                                                                  |
| Startup graph              | Fresh production navigation before first Atlas open                                                           | No Atlas view, engine, OpenNGC, supplement, HYG, bright-sky, Milky Way or landscape reference/module preload appears in `dist/index.html`.       |
| First open                 | Local production preview                                                                                      | Engine, OpenNGC, supplemental DSO/Abell-PN, HYG and bright-sky chunks all loaded successfully and remained behind the existing first-open latch. |
| Warm reuse/idle            | Twenty hide/show cycles, followed by 1.2 s hidden instrumentation                                             | Same single canvas, zero additional Atlas requests and zero hidden draw calls; resume produced one visible redraw.                               |
| Offline search             | Stop the production preview after all package-local chunks load                                               | `Barnard 72` remained searchable/selectable and `Sh2-101` still returned while a fetch probe confirmed the server was unavailable.               |
| Touch regression           | Synthetic two-pointer pinch                                                                                   | FOV changed from 16.15 to 7.18 degrees; one canvas remained mounted.                                                                             |
| Selection regression       | Search and select Venus, then wait 3.2 s through clock updates                                                | Details remained visible with unchanged coordinates.                                                                                             |
| Brightness controls        | Mobile settings UI and persisted Pinia state                                                                  | Star 2.5, galaxy 10.0 and other DSO 8.0 updated independently; `30` renders as localized Auto.                                                   |

The 2026-07-16 production chunks are 35,980 bytes for the view (10,960 gzip),
465,168 for the Atlas engine (117,780 gzip), 23,051 for bright-sky data (6,550
gzip), 1,181,415 for HYG stars (264,060 gzip), 3,297,634 for compact OpenNGC
(649,890 gzip), and 3,624,767 for the supplemental DSO/Abell-PN layer (405,560
gzip). The 46,573-byte catch-all vendor chunk (9,640 gzip) remains unrelated to
Atlas. The pinned Atlas validation passes 116 JavaScript and 73 catalogue tests;
host integration tests pass 63/63. Targeted ESLint, formatting, the 6 GB
typecheck and the production build pass. The locale-key additions are complete across all 13 packs;
the repository-wide i18n checker still reports only its pre-existing placeholder-
translation mismatches.

Native Android/iOS interaction, package-size and memory/heap profiling remain
explicit Phase 6 release gates; no native result is inferred from browser
emulation.

### 2026-07-18 Celestia-owned namespaces and offline survey

- Static landscapes, sky cultures and survey imagery moved from
  `public/stellarium-data` to `public/celestia-atlas-data`. Runtime and custom
  landscape placeholders now use `/celestia-atlas-data`.
- The host visibility flag is `showSkyAtlas`, persisted display preferences use
  `celestiaAtlas`, and Atlas components/utilities live under Celestia-owned
  names. A pre-hydration migration preserves the former `stellarium` settings
  and canonicalizes local legacy landscape paths.
- Backend landscape-list responses may retain their historical Stellarium API
  contract, but returned local service URLs are canonicalized before storage.
- The photographic background uses only the packaged DSS WebP HiPS orders 3–4
  at `/celestia-atlas-data/surveys/dss`. The remote Atlas default is explicitly
  overridden, so tile rendering has no online source or fallback.
- Web builds retain `celestia-atlas-data`. Android/iOS builds exclude the large
  tree and resolve landscapes and DSS tiles from the selected NINA plugin, as
  the former Stellarium integration did.
- Production-browser validation loaded the Guereins landscape faces and DSS
  orders 3–4 with HTTP 200 only from the local `celestia-atlas-data` tree.
  Zooming activated the photographic background without any external-survey or
  legacy-path request, and the console contained no Atlas/Vue runtime error.

### 2026-07-18 stable HiPS navigation and native data boundary

- Celestia Atlas retains the correctly aligned interaction raster while an
  asynchronous high-resolution refinement is running, so completed tiles no
  longer blank and repaint the background one by one.
- Already-started tile requests finish into the bounded decoded LRU and browser
  Cache Storage instead of being cancelled and requested again at every view
  boundary. Obsolete queued work is still discarded and mobile concurrency
  remains limited to two tile decodes.
- Settled views prefetch a 30% navigation margin at a coarse sample interval;
  revisiting the tested field then kept the survey continuously active with
  zero additional tile requests.
- Target-order detail tiles now decode silently behind the complete preview
  order. The renderer publishes the higher resolution only after every tile in
  the visible field is ready, preventing the delayed tile-by-tile repaint that
  previously appeared several seconds after a drag or mount recenter.
- A geometrically aligned preview remains presented while the detail or
  minute-boundary raster is generated; those coherent swaps no longer blank
  the background between frames. Off-screen prefetch completions cannot cancel
  or restart the visible raster job.
- The timed 7-10 second flash at NGC 6953 was traced to the horizontal camera
  rotation crossing a 0.1-degree raster key while the old front buffer was
  discarded. Compatible front buffers are now retained through up to
  0.5 degrees of live sky rotation, raster jobs read immutable tile snapshots,
  and the order-3 Allsky mosaic supplies a complete continuity frame until an
  exact detail field is ready. The survey service worker is cache-first and no
  longer revalidates every viewed tile in the background.
- Web deployments serve `celestia-atlas-data` from the application origin.
  Capacitor Android/iOS builds remove that directory and request it from
  `http(s)://<selected-nina-host>:<plugin-port>/celestia-atlas-data`.
- The Windows `npm run testbuild` path now invokes the standard `build:app`
  generators without the long-running auto-fixing lint gate, deploys directly
  to the N.I.N.A. plugin application directory, and fails unless the generated
  Celestia chunks, complete DSS orders 3 and 4, order-3 Allsky preview and local
  service metadata are present. It also rejects stale `stellarium-data` or
  `stellarium-js` directories, so localhost cannot silently serve a previous
  migration build. Lint remains an explicit pre-commit and CI check.

### 2026-07-21 historical-reference closure

- The final repository search is classified in
  [stellarium-reference-audit.md](./stellarium-reference-audit.md). Stale
  PlateSolvePlus target labels, horizon/FOV descriptions, privacy text, and all
  localized target-action help now name Celestia Atlas.
- Remaining Stellarium names are restricted to settings/data-path migration,
  stable NINA plugin landscape API contracts, the landscape ZIP interchange
  format, catalogue provenance, schema compatibility, removal tests, and
  historical documentation.
- A runtime and locale audit test rejects any new unclassified occurrence.
- Startup now refreshes bundled plugin metadata while preserving enabled states,
  preventing persisted pre-migration descriptions from keeping old renderer
  labels after an upgrade.
- The deployed NGC 6953 production build stayed survey-active for all 1,025
  desktop samples during a drag and 16-second settled interval, with a minimum
  of 19 decoded resources and zero tile requests. A reverse warm drag stayed
  active for all 337 samples with zero requests. At a 390x844 touch viewport
  under 2x CPU throttling, all 508 samples stayed active for 12 seconds with a
  minimum of nine decoded resources and zero requests. Orders 3 and 4, Allsky,
  and service metadata returned HTTP 200 from the local plugin; no external
  survey request or Atlas runtime exception occurred.

## 11. Remaining blockers

- Celestia Atlas code is MIT licensed. Data boundaries remain explicit in the
  third-party notices: OpenNGC and HYG are CC BY-SA 4.0, the SIMBAD A66 layer is
  ODbL 1.0 with its required acknowledgement, and the Stellarium-derived DSO
  supplement is GPL-2.0-or-later.
- The complete pinned offline catalogue is packaged, first-open lazy and uses
  no runtime fetch after its package chunks load. Browser search/render and
  startup-graph validation passed; native validation remains open.
- Android and iOS runtime validation require suitable platform environments.
- Existing listed and custom landscapes now use seam-correct spherical order-0 HEALPix projection. The standalone and Touch-N-Stars production browsers passed orientation, seam, settled-resolution, request, and Atlas console checks; Android and iOS validation remain release gates.
- Remaining parity gates are Android/iOS lifecycle and gesture validation,
  native heap profiling and upstream FITS/image position-angle provenance.
- Native package boundary and size profiling now run after every
  `npm run build:native`. The verifier requires all lazy Celestia runtime and
  catalogue chunks, rejects bundled Atlas survey data and legacy Stellarium
  directories, rejects known public survey URLs, and enforces a 40 MiB web
  payload budget. The 2026-07-21 baseline is 34.77 MiB across 190 files.
- `npm run sync:native` copies the verified build into both Capacitor projects
  and reruns the same boundary checks against their packaged web roots. Android
  and iOS synced roots each measured 34.77 MiB across 192 files. Android
  `assembleDebug` passed; its 79.11 MiB APK contained the six required Celestia
  view/engine/catalogue assets and zero Atlas survey-data or legacy Stellarium
  paths. iOS compilation still requires an Xcode/CocoaPods environment.
- Package boundary resolved: Touch-N-Stars uses the public Git repository pinned
  over HTTPS to immutable Atlas commit
  `71da520db6e0e36e0bf75a7447fb266cf60363df`. Embedded and standalone shells
  share the same viewer and astronomy engine modules.

## 12. Removal checklist

- [ ] All mandatory parity gates pass.
- [x] Astronomy reference fixtures and tolerances pass for Atlas coordinates,
      horizontal geometry, projection and camera rotation; upstream image metadata
      provenance remains tracked separately.
- [x] Full offline catalogue and notices are packaged.
- [ ] Web and required native lifecycle tests pass.
- [x] Celestia is default with a tested rollback interval.
- [x] Stellarium runtime, WASM, globals, stores, view overlays, and rollback import are removed.
- [x] Atlas data uses the `celestia-atlas-data` namespace, existing settings are migrated, and native builds load the data from the selected NINA plugin.
- [x] Final search classifies every historical reference.
