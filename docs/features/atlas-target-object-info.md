# Atlas target card: object info and altitude chart

Status: proposed
Date: 2026-09-15

## Goal

When a user selects an object (or the view centre) in the sky atlas, the target card
tells them at a glance what the object is and whether it is worth imaging at the
atlas time: type, magnitude, size, constellation, current altitude/azimuth,
rise/transit/set for that night, and the existing SkyChart altitude curve with
twilight, horizon profile and moon (illumination and separation). Today the card
only shows RA/Dec and a preview image.

## Scope

- Runtime modes: both (client-side computation from the embedded catalogue and the
  profile location; identical in NINA and PINS)
- Surface: existing view – `AtlasTargetPanel` in `CelestiaAtlasView`
- Backends touched: none new (SkyChart's existing `profileAction('horizon')` call only)

## Non-goals

- No "Tonight's Best" / recommendation list
- No sequence time conditions or automatic scheduling
- No change to atlas search results or catalogue filters (new type-label keys are
  created, switching the filter facets to them is a separate change)
- No "fits the field / needs mosaic" hint from object size vs. FOV
- Framing page target card stays as it is

## Acceptance criteria

1. Given a catalogue object is selected (e.g. M31), then the card shows its type as a
   translated label, magnitude, apparent size (major × minor arcmin, or diameter) and
   constellation. A field missing in the catalogue omits that row; no "undefined",
   "NaN" or "—" placeholders for missing catalogue data.
2. Given any selection (object or view centre) and a profile location, then the card
   shows the constellation computed from RA/Dec plus altitude and azimuth at the
   atlas time; when the atlas clock is moved (time travel, pause, speed), the values
   follow within one clock tick (1 s).
3. Given a selection and a profile location, then rise, transit and set times for the
   atlas night (local noon to noon around the atlas time) are shown as local times;
   circumpolar and never-rising objects show a word instead of times.
4. Given a selection and a profile location, then the SkyChart altitude curve is shown
   in the card with its "now" marker at the atlas time, and its moon line shows
   illumination and separation from the target. Other SkyChart callers (framing
   search, sequence, observation planner, perihelion) still use server time.
5. Given the profile has no latitude/longitude, then chart, alt/az and rise/set are
   hidden and a hint says the site location in the NINA profile is missing; the
   catalogue rows and the actions remain usable.
6. Given the view-centre selection (no object), then only the position-based rows
   (constellation, alt/az, rise/transit/set, chart) appear; no type/magnitude/size row.
7. Given a phone-width viewport (~400 px) in portrait, then the target sheet scrolls,
   the chart does not overflow horizontally, and the Slew/Sequence actions stay
   reachable without hiding the card header.
8. Every new user-facing string, including every object-type label, has a key in
   `src/locales/en.json`; the other 13 locales are produced in one batch before commit.

## Building blocks already in the repo

- `src/components/framing/SkyChart.vue` – altitude curve, twilight, horizon profile,
  moon line and moon strip; needs an optional time prop (uses server time today).
- `src/integrations/celestiaAtlas/selectionModel.js` – `atlasSelectionToCommandModel`
  drops `objectType`/`typeCode`, `magnitude`, `angularSizeArcMin`/`shape` and `con`
  that the viewer payload already carries; extend it and its tests.
- `src/utils/astronomy.js` – `equatorialToAltAz`, `getMoonDataForTarget`; rise/transit/set
  exists only inline in `src/plugins/perihelion/views/PerihelionView.vue`
  (`computeRiseSet`, `computeTonightsPeak`) and should be lifted here.
- `src/plugins/supernovae/utils/constellation.js` – constellation from RA/Dec; lift to
  `src/utils/`.
- `src/integrations/celestiaAtlas/catalogFilters.js` – `ATLAS_OBJECT_TYPE_LABELS`, the
  type-code list the i18n keys have to cover.
- Atlas time lives in `viewer.getTime()`, read once per second in
  `CelestiaAtlasView.vue` (`updateClockLabel`).

## Dimensions considered

| Dimension        | Applies | Note                                                                                                                                                                                   |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime modes    | yes     | pure client-side; no branch on `isPINS`                                                                                                                                                |
| Polling          | no      | atlas clock is already read once per second in the view; SkyChart refreshes itself                                                                                                     |
| Mobile           | yes     | criterion 7                                                                                                                                                                            |
| i18n             | yes     | criterion 8; type labels get keys                                                                                                                                                      |
| Equipment safety | no      | display only, no hardware commands                                                                                                                                                     |
| Error paths      | yes     | criterion 5 (no location), criterion 1 (sparse catalogue data)                                                                                                                         |
| Native           | no      | no platform-specific behaviour                                                                                                                                                         |
| Persistence      | no      | nothing stored                                                                                                                                                                         |
| Tests            | yes     | rise/transit/set helper and constellation lookup become utils in `src/utils/` with unit tests; `selection-model.test.js` and `default-view.test.js` are updated for the extended model |

## Open questions

- Solar-system objects (Moon, planets) carry RA/Dec of the atlas time; rise/set over
  the night from a fixed RA/Dec is fine for planets but wrong for the Moon. Proposal:
  hide rise/transit/set for the Moon. Decides: user at implementation.
- Moon data: SkyChart evaluates the moon strip at local midnight; the alt/az row uses
  the atlas time. Keep the midnight convention (one number for the night) or move it
  to the atlas time? Proposal: keep midnight, as in every other SkyChart caller.
- Should the catalogue-filter facets switch to the new translated type labels in a
  follow-up? Decides: user.
