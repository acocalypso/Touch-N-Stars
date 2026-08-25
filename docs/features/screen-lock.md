# Screen lock

Status: implemented
Date: 2026-08-25

## Goal

The user can deliberately lock the app's controls so that nothing gets changed by
accident — in the dark, with the device in a pocket, or when handing the phone to
someone else. While locked, everything stays visible and keeps updating, but no
touch reaches a control. Unlocking requires a deliberate 2 s long press.

## Scope

- Runtime modes: both (NINA/WPF and PINS/headless — pure frontend, no backend involved)
- Surface: new plugin (settings + lock entry point) plus a global overlay in `App.vue`
  and a quick-access button in the navigation / status bar
- Backends touched: none
- State owner: `settingsStore` (`persist: true`, `src/store/settingsStore.js:794`) —
  survives restart and instance switch, unlike `apiStore`, which `clearAllStates()` wipes

## Non-goals

- No existing behaviour changes while the lock is inactive: no view, no control and no
  store outside the new lock state is touched.
- No read-only mode and no per-control disabling — the lock is a single overlay, not a
  `:disabled` pass over the app.
- No PIN, no user accounts, no protection against other people — this guards against
  accidental touches, not against intent.
- No backend command, no new endpoint, no new polling.

## Acceptance criteria

1. Given the plugin is enabled, when the lock button in the navigation is tapped, a
   full-screen overlay covers the app; afterwards no tap on nav, SubNav, buttons, image
   zoom or drag & drop triggers an action.
2. Given the lock is active, when the unlock button is held, a visible progress indicator
   runs and the lock releases only after the full 2 s. Releasing earlier resets the
   progress and leaves the app locked.
3. Given the lock is active, the overlay sits above every other layer — modals, dialogs,
   tutorial, setup wizard and the connection splash (z-40, `src/App.vue:16`). Nothing
   renders on top of it.
4. Given the lock is active, after an app restart and after an instance switch the app is
   still locked.
5. Given the lock is active on Android, the hardware back button / back gesture neither
   navigates nor releases the lock.
6. Locking and unlocking send no command to any backend. A running sequence continues
   unaffected and the UI underneath keeps updating while locked (polling keeps running).
7. On a 360 px phone the unlock target is >= 48 px (`min-h-touch`), sits inside the safe
   areas and works in portrait and landscape.
8. Given the plugin is disabled while the lock is active, the lock is released and the
   button disappears — there is no state that locks the user out.
9. Behaviour is identical in NINA and PINS mode; every new user-facing string has an
   `en.json` key, with the other 13 locales produced in one batch before the commit.

## Decisions

- **Entry point: status bar chip.** A `screenlock` chip in the StatusBar (part of
  `DEFAULT_STATUSBAR_ORDER`, so it can be reordered or hidden like every other chip)
  locks with one tap. The plugin has no page of its own — `install()` is empty and the
  plugin acts purely as the on/off flag in Settings → Plugins.
- **The overlay is transparent.** No scrim: the app underneath stays fully readable, only
  the touches are swallowed. Because that alone reads as a frozen app, the first blocked
  tap fades in a "hold {seconds} s to unlock" hint next to the unlock button for 2 s —
  which is how the first open question below was resolved.
- **Emergency stop stays locked** (variant a). Sequence stop and slew abort are covered by
  the overlay like everything else; intervening costs the 2 s long press. Keeping a live
  "stop" button in the overlay, or auto-releasing on an error event, would let back in
  exactly the accidental touches this feature exists to prevent.

## Dimensions considered

| Dimension        | Applies | Note                                                                                                                                    |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime modes    | yes     | Pure frontend; no payload field is read, so nothing to feature-detect. Criterion 9 pins identical behaviour.                            |
| Polling          | no      | No new backend state. Existing polling must keep running underneath the overlay (criterion 6).                                          |
| Mobile           | yes     | Criterion 7: touch target, safe areas, both orientations.                                                                               |
| i18n             | yes     | Criterion 9.                                                                                                                            |
| Equipment safety | yes     | The lock never issues a command. It does block the emergency stop — accepted, see Decisions.                                            |
| Error paths      | yes     | Criterion 3 covers the connection splash and modals appearing while locked; the lock must win the z-order in every one of those states. |
| Native           | yes     | Criterion 5: Android back button. Keep-awake and resume behaviour stay untouched.                                                       |
| Persistence      | yes     | Criterion 4; state lives in `settingsStore`, not `apiStore`.                                                                            |
| Tests            | yes     | The long-press timer (start / progress / early release / completion) is extractable into a util and unit-testable without a component.  |

## Implementation

| Part                                                                                       | File                                                                                                        |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Feature flag plugin (no view, no route)                                                    | `src/plugins/screen-lock/{plugin.json,index.js}`                                                            |
| Overlay, unlock long press, Android back swallow                                           | `src/plugins/screen-lock/components/ScreenLockOverlay.vue`                                                  |
| Hold timer (wall-clock based, injectable timers) + unit test                               | `src/utils/holdTimer.js`, `src/utils/__tests__/holdTimer.test.js`                                           |
| Persisted lock state, `lockScreen()` / `unlockScreen()`, chip in `DEFAULT_STATUSBAR_ORDER` | `src/store/settingsStore.js`                                                                                |
| Global rendering + release when the plugin is switched off                                 | `src/App.vue`                                                                                               |
| Status bar chip / chip customization entry                                                 | `src/components/status/StatusBar.vue`, `src/components/settings/general/StatusBarCustomizationSettings.vue` |
| `z-lock` (10000, above `toast`)                                                            | `tailwind.config.cjs`                                                                                       |

Known limitation: the StatusBar only renders while the backend is reachable, so the lock
cannot be _armed_ from a disconnected app. An already active lock is unaffected — it
survives disconnects, restarts and instance switches.
