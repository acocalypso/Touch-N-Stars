# Install the NINA plugin together with the app plugin

Status: proposed
Date: 2026-10-25

## Goal

When a user enables an app plugin that needs a NINA plugin, PINS offers to install it right
there, including the NINA restart that activates it; on Windows the user gets a clear hint
instead. Nobody has to know any more which PINS package belongs to which app plugin. The
structural half is [pins-core-page.md](pins-core-page.md).

## Scope

- Runtime modes: both. Detection works in both through `GET /v2/api/application/plugins`;
  installing and restarting exist on PINS only.
- Surface: Settings → Plugins (toggle dialog); a shared "NINA plugin missing" component used by
  the plugin views (LiveStack, NightSummary, LuckyCapture, Ground Station, Perihelion,
  10micron).
- Backends touched: Advanced API `/v2/api` (existing), pinsdaemon `:8000` (existing
  `/plugins`, `/plugins/install`; **new** NINA restart endpoint).

Dependency: the pinsdaemon has no way to restart NINA alone today — only
`/plugins`, `/plugins/install`, `/plugins/uninstall` and PHD2 service control; the plugin
server's `system/restart` reboots the whole device (`sudo shutdown -r now`). A new daemon
endpoint that runs `systemctl restart pins` (the NINA service) is needed. It lives in the
pinsdaemon repository, not here.

## Non-goals

- Disabling an app plugin never uninstalls its NINA package.
- The package list in PINS → Software stays complete (install, uninstall, versions).
- No automatic install without confirmation; no install on Windows.

## Acceptance criteria

1. Given PINS and a missing NINA plugin, when the user enables e.g. LiveStack in Settings →
   Plugins, an install dialog opens; confirming starts the daemon job with visible progress,
   cancelling leaves the app plugin enabled and installs nothing.
2. Given a plugin view opened while its NINA plugin is missing, a shared component shows the
   "NINA plugin missing" state — on PINS with an install button, on Windows with a hint to the
   NINA plugin manager and no button. It replaces the per-plugin variants in LiveStack and
   NightSummary.
3. Given a successful install, the user is asked whether to restart NINA; confirming calls the
   daemon endpoint, the app shows the reconnect, and once NINA is back the plugin view loads
   without a manual reload.
4. Given a running sequence, the restart prompt warns explicitly that the sequence will be
   aborted and requires its own confirmation.
5. Given a daemon without the new endpoint (older PINS), the user sees "restart the device to
   activate the plugin" instead of an error — detected from the response, not from a version.
6. Given an install failure (job failed, timeout, daemon unreachable), an error with the job
   log is shown, the app plugin stays enabled, and the install can be retried.
7. The mapping lives in `plugin.json` as `ninaPlugin: { name, pinsPackage }`; matching against
   `/application/plugins` is case-insensitive (`LiveStack`, `PINS.LuckyCapture`,
   `NINA.Plugin.NightSummary`) and covered by a unit test.

## Dimensions considered

| Dimension | Applies | Note |
| --- | --- | --- |
| Runtime modes | yes | Feature-detect the NINA plugin via `/application/plugins` in both; install only where the daemon answers |
| Polling | no | One-shot checks on toggle and view mount; no new poller |
| Mobile | yes | Dialog and job log must fit at phone width with 48 px targets |
| i18n | yes | Dialog, missing-state, restart and fallback texts need `en.json` keys |
| Equipment safety | yes | NINA restart aborts a running sequence and drops device connections → explicit confirmation, warning when a sequence runs (criterion 4) |
| Error paths | yes | Criteria 5 and 6; NINA down during restart is handled by the existing reconnect |
| Native | no | No Capacitor-specific behaviour beyond the existing resume/reconnect |
| Persistence | no | Nothing stored beyond the existing plugin enabled flag |
| Tests | yes | Mapping/matching helper (criterion 7); job flow reuses `pollJobUntilFinished` |

## Open questions

- NINA folder names of Perihelion and 10micron are unknown (packages not installed on the test
  Pi) — verify on the VM during implementation.
- Shape and name of the daemon restart endpoint (sync vs. job, path) — to agree with the
  pinsdaemon maintainer. The frontend can be built first because criterion 5 covers its
  absence.
