# Stellarium reference audit

Celestia Atlas is the only sky renderer in Touch-N-Stars. A repository search
still finds the word `Stellarium`, but each remaining occurrence belongs to one
of these deliberate compatibility or provenance boundaries:

| Boundary                                                        | Why it remains                                                                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Persisted settings and `/stellarium-data` paths                 | Existing installations are migrated once to the `celestiaAtlas` store and `/celestia-atlas-data` paths.                                |
| `/api/stellarium/landscape/*` and matching service method names | These are public NINA plugin API contracts and cannot be renamed without a coordinated backend compatibility release.                  |
| Landscape Creator strings and component name                    | The tool deliberately exports the established Stellarium landscape ZIP interchange format; this does not load the Stellarium renderer. |
| `stellarium-supplement-data` and related variables              | This is the pinned, attributed GPL catalogue supplement used by Celestia Atlas, not executable Stellarium code.                        |
| `StellariumObject` locale key                                   | This is a historical backend/schema key whose displayed value is the renderer-neutral word "Object."                                   |
| Build and removal checks                                        | Production verification rejects legacy `stellarium-data` and `stellarium-js` directories and protects the completed removal.           |
| Documentation, licences, and changelog                          | Historical behavior, migration decisions, upstream research, and third-party attribution must retain their proper names.               |

The automated audit in
`src/integrations/celestiaAtlas/__tests__/legacy-reference-audit.test.js`
rejects new runtime or localized Stellarium references unless they match one of
the explicit source compatibility boundaries above. User-facing sky-view,
target, horizon, FOV, and privacy wording must say Celestia Atlas.
Bundled plugin metadata is refreshed at every startup, so an older persisted
plugin registry cannot preserve stale user-facing renderer names after an
upgrade; user enable/disable choices remain preserved by the loader.
