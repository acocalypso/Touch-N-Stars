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
- Phase 2: lazy Vue proof of concept implemented behind `VITE_CELESTIA_ATLAS_POC=true`; observer, synchronized UTC, FOV, visibility and deterministic teardown are connected. Normal builds retain Stellarium rollback.
- Phase 4 (partial): offline search, focus, canvas hit selection, selected-object details, safe framing handoff, J2000 mount marker, grid/display settings, and mock mount epoch are connected.
- Phase 3: host conversion boundary and safety tests implemented; independent astronomy golden reference remains open.
- Phases 2 and 4-9: not started.

## 9. Feature-parity matrix

| Capability               | Existing                                        | New engine                                        | Status                         |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------- | ------------------------------ |
| Explicit lifecycle       | Hidden render suppression plus host workarounds | `pause`, `resume`, `resize`, idempotent `destroy` | Partial                        |
| Observer and UTC         | Supported                                       | Validated setters                                 | Partial                        |
| Offline catalogue search | Stellarium packaged data                        | Injected local catalogue search                   | Partial; full data unavailable |
| Framing selection        | Supported                                       | Typed selection callback                          | Not connected                  |
| Mount/FOV/rotation       | Supported                                       | Not implemented                                   | Mandatory gap                  |
| Horizon/landscape        | Supported                                       | Not implemented                                   | Mandatory gap                  |
| Mobile lifecycle         | Host workarounds                                | API is pause/resume capable                       | Not connected/tested           |

## 10. Test results

- Host `npm run test:run`: 39 passed, 0 failed.
- Host `npm run lint`: timed out after 60 seconds; no pass claimed.
- Candidate JavaScript syntax checks: passed before Phase 1 changes.
- Host after coordinate contract: 44 passed, 0 failed; targeted ESLint passed.
- Host after search/selection/mount integration: 46 passed, 0 failed; targeted ESLint, typecheck and flagged production build passed.
- Candidate Phase 1 unit tests: 3 passed, 0 failed; syntax and diff checks passed.
- Host `npm run typecheck`: passed in 97.6 seconds.
- Flagged POC `npm run build:app`: passed. Viewer chunk is 9.21 kB (3.73 kB gzip); the lazy full OpenNGC chunk is 5,452.22 kB (915.53 kB gzip). Vite reports the expected large-chunk warning for the catalogue.
- Pinned OpenNGC `v20260501` generation produced 12,578 records. After fixing nondeterministic metadata, two offline rebuilds produced identical SHA-256 hashes.

## 11. Remaining blockers

- Licensing resolved by owner authorization on 2026-07-10: Celestia Atlas uses GNU GPL v3 or later, matching Touch-N-Stars. OpenNGC remains CC BY-SA 4.0 under the third-party notices.
- The complete pinned offline catalogue is generated locally and builds lazily, but its publication awaits the source-code licensing decision and immutable package boundary.
- Host coordinate provenance must be proven before any viewer selection can feed commands.
- Android and iOS runtime validation require suitable platform environments.
- Mandatory parity phases remain.
- Package boundary resolved: Touch-N-Stars uses the public Git repository pinned to immutable commit `70b97a30c826aa02b5347f20133869008e0e27ee` over HTTPS.

## 12. Removal checklist

- [ ] All mandatory parity gates pass.
- [ ] Astronomy reference fixtures and tolerances pass.
- [ ] Full offline catalogue and notices are packaged.
- [ ] Web and required native lifecycle tests pass.
- [ ] Celestia is default with a tested rollback interval.
- [ ] Stellarium runtime, WASM, data, globals, stores, workarounds, and build logic are removed.
- [ ] Final search classifies every historical reference.
