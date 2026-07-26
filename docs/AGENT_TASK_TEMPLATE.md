# Touch-N-Stars Agent Task Template

Use this template when assigning implementation work to Codex or a multi-agent coding team. It is designed to move work from casual prompting into agentic engineering: clear intent, bounded context, scoped execution, validation, and reviewable evidence.

For dependency-specific work, the agent must report whether Context7 MCP was used and note any important documentation source, package version, API version, or assumption that affected the implementation.

````text
# Task For GPT-5.5 Codex Multi-Agent Team

Repository:
<local path to Touch-N-Stars, for example C:\Users\Aco\Desktop\Dev-Tools\Touch-N-Stars>

Task title:
<short imperative title>

Task:
<describe the concrete implementation task in 1-4 paragraphs>

Why this matters:
<explain the user/session outcome, operational problem, bug, release need, or safety improvement>

Operating mode:
<Conductor | Orchestrator | Background/Delegated>

Use Conductor for ambiguous, risky, architectural, hardware-facing, PINS/pinsdaemon, Advanced API contract, WebSocket/SignalR, mobile-native, update/release, auth/token, or production-sensitive work.
Use Orchestrator for well-specified multi-file work with clear tests and existing patterns.
Use Background/Delegated only for narrow, reproducible tasks with explicit acceptance criteria and validation.

Current project context:
- Touch-N-Stars is a mobile-first Vue 3 + Capacitor control interface for N.I.N.A.-based astrophotography sessions.
- It is a frontend control plane and orchestration layer; it does not replace N.I.N.A. sequencing, device control, imaging, guiding, plate solving, profile logic, or processing.
- Runtime modes include standard N.I.N.A., PINS/headless, and local mock mode.
- Standard N.I.N.A. mode talks to the Touch-N-Stars plugin server `/api/*` and N.I.N.A. Advanced API V2 `/v2/api/*` plus WebSocket channels.
- PINS/headless mode can add SignalR hubs and pinsdaemon system APIs, usually on port `8000`.
- Mock mode is for UI development, demos, and selected tests only; it is not proof of real N.I.N.A., PINS, SignalR, WebSocket, pinsdaemon, or hardware behavior.
- The app is hardware-adjacent and system-adjacent; correctness and safety matter more than broad refactors.

Context packet:
- User request / issue text: <paste exact request, bug report, or issue>
- Relevant docs: <HighLevelDesign.md, GEMINI.md, .github/gemini-context.md, .gemini/styleguide.md, CONTRIBUTING.md, plugin docs, wiki pages>
- Relevant files: <views/components/stores/services/plugins/scripts/locales/tests>
- Runtime mode(s): <standard N.I.N.A. | PINS/headless | mock | native Android | native iOS | web browser>
- Backend/API details: <Advanced API endpoints, response examples, `/api/get-api-port`, WebSocket events, SignalR hubs, pinsdaemon endpoints>
- Equipment/session state: <camera/mount/focuser/guider/sequence/TPPA/safety/weather state if relevant>
- Platform details: <Windows N.I.N.A., Raspberry Pi/PINS, browser, Android/iOS, simulator/lab host>
- Logs/screenshots: <console output, network traces, screenshots, stack traces>
- Known constraints: <do not touch real hardware, read-only only, no service mutation, i18n required, mobile layout constraints>

Non-goals:
- <explicitly list what must not be changed>
- <list unrelated runtime modes/transports/plugins/layers to avoid scope creep>
- <state whether live hardware validation is out of scope>

Project-specific rules:
- Follow `docs/AGENT_GUIDELINES.md` or the repository’s current agent guideline file.
- Preserve real astrophotography session safety and predictable equipment-control behavior.
- Preserve N.I.N.A. Advanced API and Touch-N-Stars plugin server contracts.
- Preserve dynamic Advanced API port discovery through the project handshake.
- Preserve standard N.I.N.A., PINS/headless, and mock-mode behavior unless explicitly in scope.
- Preserve WebSocket, SignalR, polling, reconnect, and cleanup behavior where relevant.
- Preserve mobile-first phone/tablet usability.
- Preserve Capacitor Android/iOS behavior when native features are touched.
- Preserve plugin identity and avoid relying on ordinal `/pluginN` routes.
- Add/update i18n entries for user-facing text.
- Do not run or add default tests that move real hardware, start real sequences, run long exposures, change Wi-Fi, install packages, restart services, upload firmware, or mutate a real host.
- Do not hardcode secrets, bearer tokens, hostnames, Wi-Fi credentials, app-store credentials, signing material, or local machine paths.
- Do not revert, overwrite, delete, or undo unrelated work.
- Do not use destructive Git commands.
- Prefer additive, targeted patches over rewrites.

Layer boundaries:
- Presentation: `src/views`, `src/components`.
- Domain state: `src/store`, `src/plugins/*/store`.
- Integration services: `src/services` REST, Advanced API, WebSocket, SignalR, updater, mock, daemon services.
- Transport orchestration: connection handshake, polling loops, socket lifecycle, reconnection, instance switching.
- Plugin system: `src/plugins/*`, `plugin.json`, plugin registry generator, dynamic routes/navigation.
- Mobile/native shell: Capacitor config, Android/iOS projects, native plugins, updater behavior.
- PINS/headless: SignalR hubs, pinsdaemon, Raspberry Pi/Linux assumptions, PHD2/INDI/system behavior.
- Mock/contract testing: mock API service, fixtures, simulated events, contract mocks.
- Localization: `src/locales/*.json`, i18n scripts.
- Build/release: plugin registry, whats-new generation, `dist`, native build, test deployment, OTA update flow.
- Docs/changelog: README, HLD, Gemini context/styleguide, plugin docs, CHANGELOG.

Required workflow:
1. Planner
   - Run `git status --short` before edits.
   - Inspect relevant files before proposing changes.
   - Identify uncommitted user/team work.
   - Identify affected layers, runtime modes, transports, services, stores, plugins, and locales.
   - Identify non-goals.
   - Identify whether Context7 MCP or external API docs are needed.
   - Define acceptance criteria and validation commands.
   - Identify safety, N.I.N.A., Advanced API, PINS, pinsdaemon, WebSocket/SignalR, mobile, plugin, i18n, and release risks.

2. Engineer
   - Define the technical design and contracts.
   - Reuse existing patterns, stores, services, and components.
   - Define runtime-mode behavior and fallback behavior.
   - Define error handling and user-facing messages.
   - Define how mocks or contract tests model the real API/transport shape.

3. Developer
   - Implement only the scoped changes.
   - Add/update tests, docs, changelog, and i18n when behavior changes.
   - Avoid broad formatting, dependency churn, generated-file churn, or unrelated cleanup.
   - Avoid live hardware/system mutation.

4. Reviewer
   - Run `git diff --stat` and `git diff` before finishing.
   - Check acceptance criteria and layer boundaries.
   - Check N.I.N.A. Advanced API and Touch-N-Stars plugin server compatibility.
   - Check runtime modes, transport behavior, mobile UX, plugin identity, i18n, secrets, and safety impact as relevant.
   - Run validation or explain why it was not run.

Acceptance criteria:
1. <observable outcome 1>
2. <observable outcome 2>
3. <observable outcome 3>
4. <test/doc/i18n/API/UX/safety requirement if relevant>

Verification rubric:
- Deterministic checks: <lint/typecheck/unit/build/i18n/format commands and expected results>
- Contract checks: <Advanced API response shape, `/api/get-api-port`, WebSocket event, SignalR message, pinsdaemon response, plugin registry, route identity>
- Manual review: <mobile browser flow, native Android/iOS flow, simulator-backed N.I.N.A., dedicated PINS lab host, screenshots>
- Regression checks: <specific existing behavior that must still work>
- Safety checks: <verify no real hardware/system mutation in default tests; confirm dangerous actions require explicit user intent>
- If non-deterministic/agent behavior is involved: <eval cases, scoring rubric, trajectory/tool-use expectations>

Suggested validation:
```bash
git status --short
npm ci
npm run lint
npm run typecheck
npm run test:run
npm run test:coverage
npm run format:check
npm run i18n:check
npm run build
```

For the full Vue graph, set `NODE_OPTIONS=--max-old-space-size=6144` before
`npm run typecheck` (PowerShell:
`$env:NODE_OPTIONS='--max-old-space-size=6144'`).

Add task-specific validation when relevant:

For preview/web smoke:
```bash
npm run preview:smoke
```

For native/mobile behavior:
```bash
npm run build:native
npm run sync:native
```

For plugin/generator behavior:
```bash
npm run generate-plugins
npm run generate-whats-new
npm run build
```

For N.I.N.A. plugin test deployment on a suitable Windows development machine:
```bash
npm run testbuild
```

For formatting changes only:
```bash
npm run format:check
```

Expected final response:
Task completed: <short summary>

Planner:
- <plan summary, operating mode, affected layers/runtime modes/transports, non-goals>

Engineer:
- <design summary and contracts>

Developer:
- <implementation summary>

Reviewer:
- <pass/pass with notes/needs changes and review findings>

Changed files:
- <file list>

Validation:
- <commands run and results>

Notes:
- <limitations, assumptions, unrelated local changes, Context7 status, live-hardware caveats, remaining risks>
````

## Task Author Checklist

Before handing a task to an agent, make sure the prompt answers:

- What exact behavior should change?
- What behavior must not change?
- Which runtime mode or modes are in scope?
- Which transports are in scope: REST, WebSocket, SignalR, pinsdaemon, native updater?
- Which store/service/component/plugin files are likely involved?
- Does the task affect real hardware, system services, or user session safety?
- How will the agent know it is done?
- Which tests/build/lint/i18n/typecheck checks should run?
- Is live validation required, simulator-backed, lab-host-only, or out of scope?
- Does the task require current dependency docs through Context7?
- Are user-facing strings included in i18n?
- Are docs or changelog updates required?

## Common Task Variants

### UI / Mobile Workflow Task

Add these constraints:

```text
- Preserve mobile-first phone/tablet layout and touch usability.
- Preserve dark/low-light field usability.
- Use existing components, stores, and styling patterns.
- Add/update i18n entries for all user-facing strings.
- Do not rely on translated text as the primary test selector.
- Prefer stable `data-testid`, ARIA roles, and semantic selectors.
- Verify standard N.I.N.A., PINS, and mock mode impact if the flow is shared.
```

Suggested validation:

```bash
npm run lint
npm run typecheck
npm run i18n:check
npm run build
```

Acceptance criteria examples:

```text
1. The UI flow works on narrow phone and tablet widths.
2. All user-facing text uses i18n keys.
3. Existing setup/navigation behavior still works in mock mode.
4. The change does not hide equipment state or safety warnings.
```

### N.I.N.A. Advanced API / Service Task

Add these constraints:

```text
- Do not invent endpoints, request shapes, response envelopes, or event names.
- Preserve the connection handshake and dynamic API port discovery.
- Model domain errors such as disconnected equipment, parked mount, active exposure, active sequence, unsafe safety monitor, or unavailable guider.
- Do not blindly retry invalid-state commands.
- Add contract mocks for request/response and error behavior where practical.
```

Suggested validation:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Acceptance criteria examples:

```text
1. The service uses the discovered Advanced API port rather than assuming a fixed port.
2. Success and error responses preserve the expected project shape.
3. Invalid equipment state is shown as actionable UI feedback.
4. Contract mocks cover success and important error states.
```

### WebSocket / SignalR Task

Add these constraints:

```text
- Preserve connection, reconnection, duplicate-subscription prevention, and teardown behavior.
- Tests should wait for visible state changes or specific events, not arbitrary sleeps.
- Model disconnect, reconnect, stale event, and duplicate event cases where practical.
- Keep standard N.I.N.A. WebSocket behavior separate from PINS SignalR behavior.
```

Suggested validation:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Acceptance criteria examples:

```text
1. The app reconnects without duplicate event handlers.
2. Instance switching clears stale transport state.
3. PINS SignalR behavior does not run in standard N.I.N.A. mode unless detected.
4. Tests assert state/event outcomes without timing-only waits.
```

### PINS / pinsdaemon Task

Add these constraints:

```text
- Treat pinsdaemon system-mutating endpoints as dangerous by default.
- Do not run or add default tests for firmware upload, Wi-Fi changes, system upgrade, package installation, service restart, or real PHD2 mutation.
- Keep tokens and host settings out of source code.
- Use read-only endpoints or contract mocks unless the user explicitly provides a safe lab host.
- Preserve standard N.I.N.A. behavior when PINS is unavailable.
```

Suggested validation:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Acceptance criteria examples:

```text
1. PINS-only UI or service behavior is gated by runtime detection.
2. Missing PINS endpoints do not break standard N.I.N.A. mode.
3. Mutating daemon actions require explicit user confirmation and are not executed by default tests.
4. Token handling uses environment/config paths, not hardcoded secrets.
```

### Plugin System Task

Add these constraints:

```text
- Do not rely on ordinal `/pluginN` routes as stable plugin identity.
- Use stable plugin IDs and metadata.
- Regenerate plugin registry when plugin metadata or entry points change.
- Avoid duplicate routes, stale routes, and duplicate nav entries.
- Respect mock mode behavior where plugin loading may be skipped.
```

Suggested validation:

```bash
npm run generate-plugins
npm run lint
npm run typecheck
npm run build
```

Acceptance criteria examples:

```text
1. Plugin identity is stable through metadata ID.
2. Navigation does not duplicate entries after reload or instance switch.
3. Generated plugin registry is updated intentionally.
4. Tests/selectors do not assume `/plugin1` means a specific plugin.
```

### i18n / Localization Task

Add these constraints:

```text
- Do not hardcode user-facing strings.
- Add concise translation keys under existing locale conventions.
- Use placeholders for dynamic values.
- Keep formatting-only locale churn separate from functional changes when possible.
```

Suggested validation:

```bash
npm run i18n:check
npm run format:check
npm run build
```

Acceptance criteria examples:

```text
1. Every new user-facing string has an i18n key.
2. Missing-key checks pass.
3. Text fits mobile layouts.
4. Dynamic values use placeholders instead of string concatenation.
```

### Capacitor / Native App Task

Add these constraints:

```text
- Preserve web behavior and native Android/iOS behavior.
- Check Capacitor plugin APIs with current documentation.
- Preserve keep-awake, app background/foreground lifecycle, status bar, filesystem, updater, and platform-specific code where relevant.
- Do not commit signing material, app-store credentials, or local build artifacts.
```

Suggested validation:

```bash
npm run build:native
npm run sync:native
```

Acceptance criteria examples:

```text
1. Web build and native build still succeed.
2. App ready/update flow is preserved.
3. Android/iOS platform assumptions are documented.
4. No credentials or local machine paths are introduced.
```

### Build / Release / Changelog Task

Add these constraints:

```text
- Preserve generated plugin registry and whats-new generation behavior.
- Update `CHANGELOG.md` under the appropriate section for notable user-visible changes.
- Do not hand-edit generated files unless intentionally updating generator output.
- Review all generated diffs.
```

Suggested validation:

```bash
npm run generate-plugins
npm run generate-whats-new
npm run lint
npm run build
```

Acceptance criteria examples:

```text
1. Generated files match source metadata/changelog.
2. Build output succeeds without unrelated generated churn.
3. Changelog accurately describes user-visible changes.
4. Release/update metadata assumptions are documented.
```

### Test / Contract Mock Task

Add these constraints:

```text
- Prefer contract mocks for N.I.N.A., WebSocket, SignalR, PINS, and pinsdaemon behavior.
- Do not use UI mock mode as proof of real backend behavior.
- Do not touch live equipment or mutate system services in default tests.
- Include success, invalid-state, auth/error, disconnect/reconnect, and stale-event cases when relevant.
```

Suggested validation:

```bash
npm run test:run
npm run test:coverage
npm run lint
npm run typecheck
npm run build
```

Acceptance criteria examples:

```text
1. Tests model the real communication shape.
2. Tests avoid real hardware/system mutation.
3. Important error states are covered.
4. Existing tests remain deterministic.
```
