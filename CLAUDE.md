# CLAUDE.md

Guidance for AI agents working in this repository.

## Read these first

- [docs/AGENT_GUIDELINES.md](docs/AGENT_GUIDELINES.md) — the project's static agent harness:
  operating principles, product priorities, safety rules. It takes precedence over this file.
- [HighLevelDesign.md](HighLevelDesign.md) — architecture, the two backend runtime
  modes (NINA/WPF and PINS/headless), transports, and test-fixture boundary.
- [CONTRIBUTING.md](CONTRIBUTING.md) — contribution rules, i18n requirements.
- [src/plugins/plugins.md](src/plugins/plugins.md) — plugin authoring.

This file collects hard-won, non-obvious facts that are easy to get wrong and are not
derivable from reading the code quickly. Keep it high-signal; verify before relying on it.

## Verification

```bash
npm run lint
npm run format:check
npm run build
npm run i18n:check
npm run test:run
```

`npm run ci:verify` chains all of them plus `typecheck`. `typecheck` can OOM, and `test:run`
needs Node ≥ 22.15 (`registerHooks`) — below that every test file fails at module
instantiation, which looks alarming but says nothing about the code.

## Polling is mandatory

NINA's `/v2/socket` WebSocket does **not** deliver every equipment/state change. The 2s HTTP
polling (`fetchAllInfos` in `src/store/store.js`) must not be replaced by WebSocket events.
Battery/performance work has to keep the polling and optimize elsewhere: adaptive intervals,
dropping unchanged payloads before store writes, batched backend endpoints.

## Skills: the deep procedures live outside this file

The recurring procedures are documented as on-demand skills in `.claude/skills/` instead of
here, so they cost no context until they are actually needed. Load the skill
before working in these areas — the details are not repeated in this file.

| Skill | Covers |
| --- | --- |
| `feature-kickoff` | new feature: interview the goal, agree acceptance criteria, write `docs/features/<slug>.md` |
| `equipment` | device map, INDI driver changes, OFFLINE reload, connect ordering, every `<X>Settings-…` profile trap |
| `setup-wizard` | wizard steps and their order, z-index staffing, location and coordinate handling |
| `api-endpoint` | plugin-server controllers, the five base URLs, the apiService facade and its surface snapshot |
| `changelog` | CHANGELOG entries and the What's New parser contract |
| `i18n` | locale keys, the checker's rules, translation workflow |
| `tns-review` | three parallel review agents: functionality, UI, maintainability |

## Android networking: two confirmed non-bugs

Do not chase these as app-logic bugs.

- **~2 min WebView stall after Wi-Fi cut + return when mobile data is on.** Chromium attaches
  new requests to TCP connect jobs created over the dead path; they only die at the Linux
  connect timeout (~127s). With mobile data off the app reconnects within seconds. Relevant in
  the field: users join a PINS AP without internet while mobile data is on.
- **~3 min of retries after screen lock** before Android Doze kills in-flight requests. On real
  resume everything reconnects within ~2s. The `resumePending` flag in `App.vue:performResume()`
  fixes the older bug where a real resume trigger was swallowed by the re-entrancy guard — if a
  "doesn't reconnect after unlock" report comes in, check for
  `App resume already in progress, skipping duplicate trigger` with no follow-up first.

## UI conventions

Use the `tns-*` utilities from `src/assets/tailwind.css` (`tns-card`, `tns-btn-primary`,
`tns-btn-secondary`, `tns-input`, `tns-select`, `min-h-touch`), not the legacy raw
gray/cyan palette still present in older screens.

Haptics: a global click listener (`src/services/globalHaptics.js`) taps every control that
actually does something - `<button>`, `[role=button]`, checkboxes/radios and navbar entries.
Clickable rows and cards, labels, plain links and `<select>` stay silent. Do **not** call
`useHaptics()` in components for press feedback; `tns-btn-danger` gets the stronger tap
automatically, and `data-haptic="light|medium|none"` overrides any of it. `useHaptics()` stays for outcome feedback (`notifySuccess`/
`notifyError`) and non-click gestures.

Drag & drop: every `<draggable>` needs `:fallbackOnBody="true"`. `backdrop-filter` on a parent
creates a containing block for `position: fixed`, which misplaces Sortable.js's ghost on Android
Chrome. Do **not** use `forceFallback: true`.

Long-press / hold targets (e.g. hold-to-confirm buttons): `@contextmenu.prevent` does **not**
stop iOS/iPadOS's native long-press callout menu (magnifier/copy). WebKit drives that callout
through the proprietary `-webkit-touch-callout` CSS property, independently of the `contextmenu`
DOM event and of `user-select`/`select-none`. Set `-webkit-touch-callout: none;` explicitly on the
held element (and its overlay/wrapper if it also intercepts pointer events). Existing examples:
`setSlewRate.vue`, `moveAxis.vue`, `NavigationComp.vue`, `ZoomableImage.vue`, `imageModal.vue`,
`ScreenLockOverlay.vue`.

i18n: add new keys to `src/locales/en.json` **only** while implementing, and ask before
generating the other 13 locales — translations are produced in one deliberate batch right
before the commit, never scattered through the work. Until then `i18n:check` reports
`missing (N)` for all 13; that is the expected mid-work state. Every user-facing string
needs an entry. Procedure, checker rules and tooling traps: `.claude/skills/i18n/SKILL.md`.

Targets are Android, iOS and the browser — keep all three working.

Code comments: always write in English, regardless of the language used in the conversation
or commit messages.
