# SkyChart: midnight centering and moon overlay

Status: implemented
Date: 2026-08-31

## Goal

The sky chart shows the night as a whole instead of a window that rolls with the
clock: the time axis always runs from local 12:00 to 12:00 the next day, with
midnight in the middle. On top of that, a half-moon button toggles a moon
overlay — altitude curve, illumination and angular distance to the target. That
makes it readable when the moon sets and galaxy work becomes worthwhile, without
mentally shifting the plot against the current time.

Triggered by a user request: "centered on midnight for better overview" and
"curve of moon altitude / when it raises and sets".

## Scope

- Runtime modes: both (NINA/WPF and PINS/headless) — pure client-side computation
- Surface: `src/components/framing/SkyChart.vue`, used by `TargetSearch.vue`,
  `SequenceItem.vue`, `RecursiveItemState.vue` and
  `src/plugins/observationplaner/views/ObservationPlaner.vue`
- Backends touched: none (the existing `profileAction('horizon')` call stays as is)
- State owner: `settingsStore` (persisted) for the moon toggle — survives restart
  and instance switch, unlike `apiStore`, which `clearAllStates()` wipes

## Non-goals

- No new section on the settings page; the moon toggle persists silently and the
  centering is not switchable.
- No change to the horizon data source, the twilight shading or the chart size.
- No change to the scoring logic in the observation planner (moon penalty,
  ranking) — only the shared computation is de-duplicated there.
- No change to the existing 15-minute refresh behaviour.

## Acceptance criteria

1. Given a sky chart in framing, sequence item, sequence state and the
   observation planner, when it renders, the time axis runs from local 12:00 to
   12:00 the next day and midnight sits in the middle.
2. Given the local time is 03:00, when the chart opens, the window starts at
   12:00 the previous day and the "now" marker sits at its real time position —
   no longer fixed at the centre of the chart.
3. Given the moon button (half-moon icon) is off (the default), neither the moon
   curve nor any moon value is visible; one tap makes the moon altitude curve
   appear in the same chart.
4. Given the moon rises and sets inside the displayed window, the curve is drawn
   only for altitudes above 0°, so its start and end mark moonrise and moonset.
5. Given the moon overlay is on, the chart shows illumination in percent and the
   moon-to-target angular distance in degrees; without valid target coordinates
   the distance is omitted rather than rendered as "NaN".
6. Given the moon button was switched on, when the view changes or the app
   restarts, it is still on and applies to every sky chart instance.
7. Given the new `src/utils/astronomy.js`, moon and sun ephemerides live there
   and unit tests check altitude, illumination and separation against known
   reference values (degree-level tolerance — the series expansion is a
   deliberate approximation).
8. Given the observation planner computes moon or sun positions, it uses that
   same util; its local copies of `getMoonEquatorial`, `getSunEquatorial`,
   `eclipticToEquatorial` and `getMoonIllumination` are gone and the displayed
   values stay the same.
9. Given a phone in portrait orientation, the moon button is at least 48 px high
   (`min-h-touch`), uses the `tns-*` utilities and triggers no iOS long-press
   callout; every new string has a key in `src/locales/en.json`.

## Known limitations

- The window is anchored to noon in the **device's** timezone, while the curves
  are computed for the rig's coordinates. Controlling a rig several timezones
  away therefore no longer centres that site's midnight. The axis labels have
  always been device-local, so this is consistent with the rest of the chart,
  but a remote setup would need a site timezone the backends do not report.
- Between roughly 06:00 and noon the chart still shows the night that just
  ended. That follows directly from the noon-to-noon rule in criteria 1 and 2;
  an earlier switch-over (e.g. at dawn) would be the alternative.

## Dimensions considered

| Dimension | Applies | Note |
| --- | --- | --- |
| Runtime modes | no | Pure client-side math from time and location; no field only one stack reports |
| Polling | no | No new backend state; the existing 15-minute recomputation stays |
| Mobile | yes | Criterion 9: touch target, `tns-*`, chart stays readable inside `h-40`; overlay values must not cover the plot |
| i18n | yes | Criterion 9: new keys under `components.framing.skyChart.*`, the 13 locales in one batch before the commit |
| Equipment safety | no | Display only, no command reaches hardware |
| Error paths | yes | Criterion 5: missing target coordinates; missing location data must not blank the chart |
| Native | no | No Capacitor plugin involved |
| Persistence | yes | Criterion 6: moon toggle in the persisted `settingsStore`, survives instance switch and `clearAllStates()` |
| Tests | yes | Criterion 7: ephemerides testable as a util under `src/utils/__tests__/` instead of living in the component |

## Decisions taken during implementation

- The moon curve is amber (`rgb(251, 191, 36)`) against the target's cyan.
- The observation planner keeps its own moon readout; SkyChart behaves the same
  in all four places it is embedded. The small redundancy was accepted over a
  per-call-site prop.
- The "now" marker is no longer a bar dataset pinned to a sample index but a
  chart plugin drawing a vertical line at the real, fractional time position.
- The window starts at local noon and runs 24 h in fixed 15-minute steps, so
  midnight always lands on sample 48 (the centre) and every label stays on the
  quarter hour. DST switches happen after midnight and therefore only move the
  far end of the window to 11:00 or 13:00.
- Illumination and separation are evaluated at the middle of the window
  (midnight), which matches what the planner's own readout shows for its
  18:00-06:00 window.
- `SkyChart.vue` also drops its own cruder sun and target formulas in favour of
  `src/utils/astronomy.js`; both agree to well under a degree, so twilight
  shading and the target curve are unchanged on screen.
- `src/plugins/target-scheduler/services/TargetSchedulerService.js` keeps its own
  shortened series: switching it would move values it displays and is outside
  this feature.
