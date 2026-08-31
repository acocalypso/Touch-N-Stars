# Camera rotation from every plate solve

Status: implemented
Date: 2026-08-26

## Goal

The FOV frame in the framing assistant and in the Sky Atlas should show the
camera's actual rotation. Today that value only arrives when the user manually
presses "get camera rotation" (`src/store/cameraStore.js:306`); solves performed
by sequence `Center`, `SolveAndRotate`, `CenterAfterDriftTrigger` or a
meridian-flip recenter never reach the app, so after a night with several
centering runs the frame shows a stale angle.

In the Atlas it stays at _one_ frame, following "last value wins": an angle the
user set by hand holds until a new solve arrives, and then the solve wins. In
the framing assistant a second, dashed **actual** frame is added that shows only
the last solved angle, so dragging the target frame after a solve makes the
difference visible. The rotator page shows the solved angle as a number next to
the mechanical position.

## Scope

- Runtime modes: both (NINA/WPF and PINS/headless)
- Surface: framing overlay, Sky Atlas FOV, rotator page
- Backends touched: **none** — pure frontend change
- State owner: `framingStore` (`rotationAngle` stays the target value;
  `solvedRotationAngle` / `solvedRotationTime` are new), fed from `logStore`

Why no backend change is needed — verified:

- Every solve in NINA _and_ PINS runs through `ImageSolver.Solve()`, which logs
  `Platesolve successful: Coordinates: … - Position Angle: …`
  (`NINA.Platesolving/ImageSolver.cs:54`, identical in both stacks).
- `GET /api/logs?count=500` already returns that line split into
  `{ timestamp, level, source, member, line, message }`, and `Solve` is not in
  `excluded_members` (plugin `Server/Controllers/UtilityController.cs:17-88`).
- `logStore` polls that endpoint app-wide once per second
  (`src/store/logStore.js:185`, started in `src/App.vue:1019`) and already
  derives state from log lines today (autofocus HFR, `startAfTime`,
  `focuserData`). One more derived value fits that existing pattern.
- The Atlas already watches `framingStore.rotationAngle` and calls
  `updateFieldOfView()` (`src/views/CelestiaAtlasView.vue:463-475`), so it picks
  the new value up without any change.

There is no event hook for "every plate solve": the Advanced API `/v2/socket`
has no `PLATE-SOLVE` event (the app subscribes only to `IMAGE-SAVE`,
`src/store/store.js:410`), NINA creates a fresh `PlateSolvingStatusVM` per
sequence item (`NINA.Sequencer/SequenceItem/Platesolving/Center.cs:63`) so there
is no singleton to hook, and `DialogController.ExtractSlewAndCenterInfo` only
works while the WPF dialog is open.

## Non-goals

- No change to the Touch'N'Stars plugin server, ninaAPI, pinsdaemon or
  `@acocalypso/celestia-atlas`.
- No solve history and no history screen — only the latest value.
- No rotator command. Nothing in this feature moves hardware.
- No second frame in the Atlas (the package can only draw one; see Open
  questions).
- No parsing of RA/Dec from the log line — only the angle. The actual frame in
  framing sits concentric with the target frame.
- No deriving the solve's origin (sequence vs. manual) from log context.
- `src/components/framing/getImageRotation.vue` and
  `cameraStore.getCameraRotation()` stay as they are, as the explicit manual
  path.

## Acceptance criteria

1. Given a running sequence with a `Center` item, when a plate solve succeeds,
   the Atlas frame and the framing actual frame show the solved angle within
   about 2 s, without any user interaction.
2. Given the user set the angle by hand, that value stays until a **new** solve
   arrives; a solve that was already applied is never applied a second time.
3. Given a solve has arrived, when the user drags the target frame, the two
   framing frames visibly diverge and the actual frame stays on the solved value.
4. Given no solve has happened in this session, the actual frame is drawn
   concentric with the target frame but is recognisable as "not solved yet"
   (its own style, not identical to the target frame).
5. Given a solve fails (`Platesolve failed`), the last good angle stays
   unchanged, with no message and no error state.
6. Given the app starts while an old solve is still in the log, that solve is
   not applied; only a solve within `logStore.isWithinTenMinutes`
   (`src/store/logStore.js:73`) is adopted on the first poll.
7. Given a rotator is connected, the rotator page shows the last solved sky
   position angle next to `MechanicalPosition`, labelled so the two cannot be
   confused.
8. Behaviour is identical in NINA and PINS mode without a `store.isPINS` branch;
   if `/api/logs` returns no matching line, the app behaves as it does today and
   throws nothing.
9. After `apiStore.clearAllStates()` — connection loss or an instance switch —
   the solved angle and its timestamp are reset; no value from the previous
   instance is carried over.
10. The log-line parser is a pure, unit-tested function and handles the German
    UI culture (`Position Angle: 123,45`) as well as the invariant form
    (`123.45`).

## Decisions

- **Last value wins, not "manual has priority".** `rotationAngle` is both the
  displayed angle and the target sent to the hardware by
  `slewAndCenterRotate()` / `cameraRotate()` (`src/store/framingStore.js:76-112`).
  Letting a solve overwrite it therefore changes what a subsequent "rotate"
  command would send. That is the intended behaviour here: the frame should show
  reality. The second framing frame is what makes the difference between target
  and actual visible before the user acts.
- **Log tailing over a backend hook.** The alternatives all fail: no socket
  event, no singleton VM, no message-broker topic, and the dialog scraper only
  works while a dialog is open. The log line is the one choke point every solve
  passes through, and the frontend can already read it.
- **The parser normalises through `positionAngleFromNinaPlateSolve`**
  (`src/integrations/celestiaAtlas/positionAngle.js:36`), the same conversion
  `cameraStore.getCameraRotation()` uses, guarded by
  `src/integrations/celestiaAtlas/__tests__/position-angle.test.js`. The raw
  `PositionAngle` is never assigned directly.

## Dimensions considered

| Dimension        | Applies | Note                                                                                                                                                                                         |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime modes    | yes     | Same log line and log path in NINA and PINS. No `isPINS` branch; a missing line means today's behaviour (criterion 8).                                                                       |
| Polling          | yes     | Uses the existing 1 s `logStore` poller. No new poller, no new endpoint, no socket event.                                                                                                    |
| Mobile           | yes     | One extra frame and one status field; no new controls, so no new touch targets. The framing angle label gains a second line and must stay readable at 360 px.                                |
| i18n             | yes     | New labels for the actual value in framing and on the rotator page; `en.json` only during implementation, the other 13 locales in one batch before the commit.                               |
| Equipment safety | yes     | No command is issued. That `rotationAngle` follows the last solve is a deliberate decision (see Decisions) and is made visible by the two framing frames.                                    |
| Error paths      | yes     | Failed solve keeps the old value silently (5); an old solve at startup is ignored (6); an unparseable angle is discarded; `fetchLogInfos` already bails out when the backend is unreachable. |
| Native           | no      | No Capacitor-specific API, no permissions, no resume behaviour involved.                                                                                                                     |
| Persistence      | yes     | Criterion 9; state lives in `framingStore` and is reset by `clearAllStates()`.                                                                                                               |
| Tests            | yes     | Criterion 10 — the parser is a pure util with unit tests, testable without a component.                                                                                                      |

## Open questions

- **Log window.** `getLastLogs('500')` runs once per second. A solve could only
  be missed if NINA wrote more than 500 lines in one second — unlikely, but it
  is the one gap in this approach. If it ever happens, the fix is a
  `member=Solve` filter parameter on the existing endpoint. Decision deferred
  until observed.
- **A second frame in the Atlas later.** `@acocalypso/celestia-atlas` (0.1.0,
  pinned as a git commit in `package.json:43`) can draw only one frame via
  `setFieldOfView(FieldOfViewOverlay | null)` and has no coordinate field
  (`src/index.d.ts:25-32,266`). The building blocks for a second overlay with an
  optional `center` — `project(coords)`, `cameraFrameScreenRotationDeg` —
  already exist in the package (`src/public-api.js:2726-2779`). Whether to
  extend the package is a separate effort; Johannes decides.
